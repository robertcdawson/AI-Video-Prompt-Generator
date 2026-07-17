import type { Character, Location, Project, Shot, TextField } from "@/lib/types";
import { charactersInShot, sceneForShot } from "@/lib/generation/promptComposer";

/**
 * Step 1 / 2 / 3 prompt exporters plus the Markdown shot table.
 * All output is a pure function of the project — no timestamps, no
 * randomness — so the same project always exports the same text.
 */

function field(label: string, f: TextField): string | null {
  const v = f.value.trim();
  if (v === "") return null;
  const flag = f.status === "confirmed" ? "" : ` [${f.status.replace("_", " ")}]`;
  return `- ${label}${flag}: ${v}`;
}

function section(title: string, lines: Array<string | null>): string {
  const body = lines.filter((l): l is string => l !== null).join("\n");
  return `## ${title}\n\n${body === "" ? "_(nothing specified)_" : body}`;
}

function characterBlock(c: Character): string {
  return section(`Character: ${c.name.value}`, [
    field("Role", c.role),
    field("Appearance", c.appearance),
    field("Wardrobe", c.wardrobe),
    field("Posture", c.posture),
    field("Movement style", c.movementStyle),
    field("Emotional baseline", c.emotionalBaseline),
    field("Voice", c.voice),
    field("Recurring gestures", c.recurringGestures),
    field("Continuity anchors", c.continuityAnchors),
    field("Reference image", c.referenceImageNotes),
    field("Must never change", c.neverChange),
  ]);
}

function locationBlock(l: Location): string {
  return section(`Location: ${l.name.value}`, [
    field("Description", l.description),
    field("Architecture", l.architecture),
    field("Lighting", l.lighting),
    field("Props", l.props),
    field("Material palette", l.materialPalette),
    field("Atmosphere", l.atmosphere),
    field("Continuity risks", l.continuityRisks),
    field("Reference image", l.referenceImageNotes),
  ]);
}

/** Step 2: the film bible, characters, locations, style rules, negatives. */
export function generateProjectBrief(project: Project): string {
  const b = project.bible;
  const parts = [
    `# Project Brief: ${project.title.value}`,
    section("Premise & Intent", [
      field("Premise", b.premise),
      field("Theme", b.theme),
      field("Tone", b.tone),
      field("Visual intent", b.visualIntent),
    ]),
    section("Visual Rules", [
      field("Aspect ratio", b.aspectRatio),
      field("Visual style", b.visualStyle),
      field("Color palette", b.colorPalette),
      field("Lighting style", b.lightingStyle),
      field("Camera language", b.cameraLanguage),
      field("Pace", b.pace),
      field("Texture", b.texture),
      field("Motion language", b.motionLanguage),
    ]),
    section("Continuity Rules", [
      ...b.continuityRules.value.split("\n").map((r) => (r.trim() === "" ? null : `- ${r.trim()}`)),
    ]),
    section("Negative Constraints (never allowed)", [field("Global", b.negativeConstraints)]),
    ...project.characters.map(characterBlock),
    ...project.locations.map(locationBlock),
  ];
  return parts.join("\n\n");
}

/** Step 1: how the external video agent should behave, start to finish. */
export function generateAgentSetupPrompt(project: Project): string {
  const shotCount = project.shots.length;
  return [
    `# Video Agent Setup — ${project.title.value}`,
    "",
    "You are acting as the shot-execution agent for this project. Follow this working agreement exactly:",
    "",
    "1. Read the Project Brief below in full before generating anything.",
    "2. Confirm back to me, in your own words: the visual rules, each character's locked appearance rules, and every continuity rule — especially rules about visually identical characters.",
    `3. Review the shot list (${shotCount} shots). Do not reorder or merge shots.`,
    "4. Work ONE shot at a time, in order. Never batch-generate.",
    "5. Before each generation, restate for my approval:",
    "   - the shot's purpose",
    "   - the active characters and who is speaking",
    "   - the blocking (who is where in the frame)",
    "   - which reference image you will use",
    "   - the camera framing and lens",
    "   - the camera/subject motion",
    "   - the continuity risks for this shot",
    "6. DO NOT generate until I explicitly approve the restated shot prompt.",
    "7. After generating, wait for my accept/retry decision before moving to the next shot.",
    "8. If any instruction is ambiguous or conflicts with a continuity rule, ask instead of guessing.",
    "",
    "The Project Brief and shot prompts follow in separate messages.",
  ].join("\n");
}

/** One Step 3 execution prompt for a single shot. */
export function generateShotPrompt(project: Project, shot: Shot, index: number): string {
  const scene = sceneForShot(project, shot);
  const cast = charactersInShot(project, shot);
  return [
    `## Shot ${index + 1} of ${project.shots.length} (${shot.id}, v${shot.version})`,
    "",
    ...[
      scene ? `- Scene: ${scene.title.value}` : `- Scene: ${shot.sceneId}`,
      field("Purpose", shot.purpose),
      cast.length > 0 ? `- Active characters: ${cast.map((c) => c.name.value).join(", ")}` : "- Active characters: none (insert/cutaway)",
      field("Beat", shot.beat),
      field("Blocking", shot.blocking),
      field("Screen direction", shot.screenDirection),
      field("Framing", shot.framing),
      field("Lens", shot.lens),
      field("Camera movement", shot.movement),
      field("Lighting", shot.lighting),
      field("Composition", shot.composition),
      field("Action", shot.action),
      field("Dialogue", shot.dialogue),
      field("Audio", shot.audioNotes),
      field("Duration", shot.duration),
      field("Transition out", shot.transition),
      field("Continuity", shot.continuityNotes),
      field("Negative constraints", shot.negativeConstraints),
    ].filter((l): l is string => l != null),
    "",
    "### First-frame image prompt",
    "```",
    shot.firstFramePrompt.value.trim() === "" ? "(not yet composed)" : shot.firstFramePrompt.value,
    "```",
    "",
    "### Video generation prompt",
    "```",
    shot.videoPrompt.value.trim() === "" ? "(not yet composed)" : shot.videoPrompt.value,
    "```",
  ].join("\n");
}

/** Step 3: all shot execution prompts concatenated in order. */
export function generateShotExecutionPrompts(project: Project): string {
  const header = [
    `# Shot Execution Prompts — ${project.title.value}`,
    "",
    "Execute these one at a time, in order, under the working agreement from the setup prompt.",
    "",
  ].join("\n");
  return header + project.shots.map((s, i) => generateShotPrompt(project, s, i)).join("\n\n---\n\n");
}

function mdCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

/** Markdown table summarizing every shot, for docs or spreadsheets. */
export function generateMarkdownShotTable(project: Project): string {
  const header =
    "| # | Shot ID | Scene | Framing | Characters | Blocking | Action | Dialogue | Duration | Status | Ver |";
  const divider = "|---|---------|-------|---------|------------|----------|--------|----------|----------|--------|-----|";
  const rows = project.shots.map((shot, i) => {
    const scene = sceneForShot(project, shot);
    const cast = charactersInShot(project, shot).map((c) => c.name.value).join(", ") || "—";
    return `| ${i + 1} | ${shot.id} | ${mdCell(scene?.title.value ?? "")} | ${mdCell(shot.framing.value)} | ${mdCell(cast)} | ${mdCell(shot.blocking.value)} | ${mdCell(shot.action.value)} | ${mdCell(shot.dialogue.value)} | ${mdCell(shot.duration.value)} | ${shot.status} | ${shot.version} |`;
  });
  return [`# Shot Table: ${project.title.value}`, "", header, divider, ...rows].join("\n");
}
