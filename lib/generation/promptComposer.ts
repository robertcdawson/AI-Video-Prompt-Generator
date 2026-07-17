import type { Character, Location, Project, Scene, Shot } from "@/lib/types";
import { isBlank } from "@/lib/field";

/**
 * Prompt composition is centralized here so generated prompts stay consistent
 * between initial drafting and per-shot "rebuild prompt" actions, and so a
 * future model-specific export preset can swap this module out.
 */

function line(label: string, value: string): string | null {
  return value.trim() === "" ? null : `${label}: ${value.trim()}`;
}

function joinLines(parts: Array<string | null>): string {
  return parts.filter((p): p is string => p !== null).join("\n");
}

export function charactersInShot(project: Project, shot: Shot): Character[] {
  return project.characters.filter((c) => shot.characterIds.includes(c.id));
}

export function sceneForShot(project: Project, shot: Shot): Scene | undefined {
  return project.scenes.find((s) => s.id === shot.sceneId);
}

export function locationForShot(project: Project, shot: Shot): Location | undefined {
  const scene = sceneForShot(project, shot);
  if (!scene || scene.locationId === null) return undefined;
  return project.locations.find((l) => l.id === scene.locationId);
}

function characterCapsule(c: Character): string {
  const bits = [c.appearance.value, c.wardrobe.value, c.posture.value]
    .map((v) => v.trim())
    .filter((v) => v !== "");
  return `${c.name.value}${bits.length > 0 ? ` — ${bits.join("; ")}` : ""}`;
}

/**
 * First-frame prompt: a still-image prompt describing the exact opening frame
 * of the shot. No motion language — that belongs to the video prompt.
 */
export function composeFirstFramePrompt(project: Project, shot: Shot): string {
  const bible = project.bible;
  const location = locationForShot(project, shot);
  const cast = charactersInShot(project, shot);

  return joinLines([
    "Still image: the exact first frame of a video shot.",
    line("Framing", shot.framing.value),
    line("Lens", shot.lens.value),
    location ? line("Setting", `${location.name.value}. ${location.description.value}`) : null,
    cast.length > 0 ? line("Characters", cast.map(characterCapsule).join(" | ")) : null,
    line("Blocking", shot.blocking.value),
    line("Screen direction", shot.screenDirection.value),
    line("Composition", shot.composition.value),
    line("Lighting", isBlank(shot.lighting) ? bible.lightingStyle.value : shot.lighting.value),
    line("Visual style", bible.visualStyle.value),
    line("Color palette", bible.colorPalette.value),
    line("Texture", bible.texture.value),
    line("Aspect ratio", bible.aspectRatio.value),
    line(
      "Negative",
      [shot.negativeConstraints.value, bible.negativeConstraints.value]
        .map((v) => v.trim())
        .filter((v) => v !== "")
        .join("; "),
    ),
  ]);
}

/**
 * Video-generation prompt: assumes the first frame (or a reference image) is
 * already established and describes what happens during the shot.
 */
export function composeVideoPrompt(project: Project, shot: Shot): string {
  const bible = project.bible;
  const cast = charactersInShot(project, shot);

  return joinLines([
    line("Video shot", shot.purpose.value),
    line("Duration", shot.duration.value),
    line("Framing", shot.framing.value),
    line("Camera movement", isBlank(shot.movement) ? bible.motionLanguage.value : shot.movement.value),
    cast.length > 0 ? line("Characters on screen", cast.map((c) => c.name.value).join(", ")) : null,
    line("Blocking", shot.blocking.value),
    line("Screen direction", shot.screenDirection.value),
    line("Action", shot.action.value),
    line("Dialogue", shot.dialogue.value),
    line("Audio", shot.audioNotes.value),
    line("Pace", bible.pace.value),
    line("Continuity", shot.continuityNotes.value),
    line(
      "Negative",
      [shot.negativeConstraints.value, bible.negativeConstraints.value]
        .map((v) => v.trim())
        .filter((v) => v !== "")
        .join("; "),
    ),
  ]);
}
