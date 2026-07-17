"use client";

import { useState } from "react";
import type { FieldStatus, Shot } from "@/lib/types";
import type { TextFieldKeys } from "@/lib/state/reducer";
import { CollapsibleSection, DisclosureChevron } from "@/components/ui/CollapsibleSection";
import { FieldInput } from "@/components/ui/FieldInput";
import { FocusHiddenNote } from "@/components/ui/FocusHiddenNote";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { CharacterPicker } from "@/components/editor/pickers";
import { charactersInShot, sceneForShot } from "@/lib/generation/promptComposer";
import { freshId, useOpenProject } from "@/lib/state/ProjectContext";

const SHOT_STATUSES: FieldStatus[] = ["missing", "placeholder", "needs_review", "confirmed"];

function ShotCard({ shot, index }: { shot: Shot; index: number }) {
  const { project, dispatch } = useOpenProject();
  const [open, setOpen] = useState(false);
  const set = (key: TextFieldKeys<Shot>) => (field: Shot["beat"]) =>
    dispatch({ type: "SET_SHOT_FIELD", id: shot.id, key, field });

  const scene = sceneForShot(project, shot);
  const cast = charactersInShot(project, shot);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* Summary row — the "shot table" view */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="grid min-h-[45px] w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-1.5 pl-4 pr-1 text-left hover:bg-zinc-50"
      >
        <span className="text-sm font-bold text-zinc-400">{index + 1}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-zinc-900">
            {shot.framing.value || "(framing not set)"}
          </span>
          <span className="block truncate text-xs text-zinc-500">
            {scene?.title.value ?? "No scene"} · {cast.map((c) => c.name.value).join(", ") || "no characters"} ·{" "}
            {shot.duration.value || "?"}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">v{shot.version}</span>
          <StatusBadge status={shot.status} />
          <DisclosureChevron open={open} />
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-100 pb-3">
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Shot status
              <select
                value={shot.status}
                onChange={(e) =>
                  dispatch({ type: "SET_SHOT_STATUS", id: shot.id, status: e.target.value as FieldStatus })
                }
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {SHOT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Characters</span>
              <CharacterPicker
                project={project}
                selected={shot.characterIds}
                onChange={(characterIds) => dispatch({ type: "SET_SHOT_CHARACTERS", id: shot.id, characterIds })}
              />
            </div>
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "BUMP_SHOT_VERSION", id: shot.id })}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                title="Increment when you re-generate this shot in the video tool"
              >
                Bump version (v{shot.version})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete shot ${index + 1}?`)) {
                    dispatch({ type: "REMOVE_SHOT", id: shot.id });
                  }
                }}
                className="text-xs text-zinc-400 hover:text-rose-600"
              >
                Delete
              </button>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <div>
              <FieldInput label="Purpose" field={shot.purpose} onChange={set("purpose")} multiline rows={2} />
              <FieldInput label="Beat / script" field={shot.beat} onChange={set("beat")} multiline rows={2} />
              <FieldInput label="Blocking" field={shot.blocking} onChange={set("blocking")} multiline rows={2} />
              <FieldInput label="Screen direction" field={shot.screenDirection} onChange={set("screenDirection")} multiline rows={2} />
              <FieldInput label="Framing" field={shot.framing} onChange={set("framing")} />
              <FieldInput label="Lens" field={shot.lens} onChange={set("lens")} placeholder="e.g. 50mm" />
              <FieldInput label="Camera movement" field={shot.movement} onChange={set("movement")} />
              <FieldInput label="Composition" field={shot.composition} onChange={set("composition")} multiline rows={2} />
            </div>
            <div>
              <FieldInput label="Lighting (overrides bible)" field={shot.lighting} onChange={set("lighting")} multiline rows={2} />
              <FieldInput label="Action" field={shot.action} onChange={set("action")} multiline rows={2} />
              <FieldInput label="Dialogue" field={shot.dialogue} onChange={set("dialogue")} multiline rows={2} />
              <FieldInput label="Audio notes" field={shot.audioNotes} onChange={set("audioNotes")} multiline rows={2} />
              <FieldInput label="Duration" field={shot.duration} onChange={set("duration")} placeholder="e.g. 5s" />
              <FieldInput label="Transition out" field={shot.transition} onChange={set("transition")} />
              <FieldInput label="Continuity notes" field={shot.continuityNotes} onChange={set("continuityNotes")} multiline rows={2} />
              <FieldInput label="Negative constraints (shot-specific)" field={shot.negativeConstraints} onChange={set("negativeConstraints")} multiline rows={2} />
            </div>
          </div>
          <FocusHiddenNote
            fields={[
              shot.purpose,
              shot.beat,
              shot.blocking,
              shot.screenDirection,
              shot.framing,
              shot.lens,
              shot.movement,
              shot.composition,
              shot.lighting,
              shot.action,
              shot.dialogue,
              shot.audioNotes,
              shot.duration,
              shot.transition,
              shot.continuityNotes,
              shot.negativeConstraints,
              shot.firstFramePrompt,
              shot.videoPrompt,
            ]}
          />

          <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-800">Generation prompts</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "REBUILD_SHOT_PROMPTS", id: shot.id })}
                className="rounded-md border border-sky-300 bg-white px-2 py-1 text-xs text-sky-700 hover:bg-sky-50"
                title="Recompose both prompts from the bible, location, characters, and this shot's fields (overwrites manual prompt edits)"
              >
                Rebuild from fields
              </button>
            </div>
            <FieldInput label="First-frame image prompt" field={shot.firstFramePrompt} onChange={set("firstFramePrompt")} multiline rows={6} mono />
            <FieldInput label="Video generation prompt" field={shot.videoPrompt} onChange={set("videoPrompt")} multiline rows={6} mono />
            <div className="mt-1 flex gap-2">
              <CopyButton label="Copy first-frame prompt" getText={() => shot.firstFramePrompt.value} />
              <CopyButton label="Copy video prompt" getText={() => shot.videoPrompt.value} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ShotsSection() {
  const { project, dispatch } = useOpenProject();
  const confirmed = project.shots.filter((s) => s.status === "confirmed").length;

  return (
    <CollapsibleSection
      title="Shots"
      subtitle={`${project.shots.length} shots · ${confirmed} confirmed`}
    >
      <div className="flex flex-col gap-2">
        {project.shots.length === 0 && (
          <p className="text-sm text-zinc-400">No shots yet — add one to a scene below.</p>
        )}
        {project.shots.map((s, i) => (
          <ShotCard key={s.id} shot={s} index={i} />
        ))}
        <div className="mt-1 flex flex-wrap gap-2">
          {project.scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => dispatch({ type: "ADD_SHOT", id: freshId("shot"), sceneId: scene.id })}
              className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
            >
              + Add shot to “{scene.title.value}”
            </button>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}
