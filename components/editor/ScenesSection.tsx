"use client";

import type { Scene } from "@/lib/types";
import type { TextFieldKeys } from "@/lib/state/reducer";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { FieldInput } from "@/components/ui/FieldInput";
import { FocusHiddenNote, NeedsReviewCount } from "@/components/ui/FocusHiddenNote";
import { CharacterPicker, LocationSelect } from "@/components/editor/pickers";
import { collectTextFields } from "@/lib/stats";
import { freshId, useOpenProject } from "@/lib/state/ProjectContext";

/** The fields Focus mode can hide — everything except the always-visible title. */
const hideableFields = (s: Scene) => [s.purpose, s.emotionalGoal, s.beats, s.continuityNotes];

function SceneCard({ scene, index }: { scene: Scene; index: number }) {
  const { project, dispatch } = useOpenProject();
  const set = (key: TextFieldKeys<Scene>) => (field: Scene["title"]) =>
    dispatch({ type: "SET_SCENE_FIELD", id: scene.id, key, field });
  const shotCount = project.shots.filter((s) => s.sceneId === scene.id).length;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Identity stays visible in focus mode so the card is never anonymous */}
          <FieldInput label={`Scene ${index + 1} — Title`} field={scene.title} onChange={set("title")} ignoreFocusMode />
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remove scene “${scene.title.value}” and its ${shotCount} shot(s)?`)) {
              dispatch({ type: "REMOVE_SCENE", id: scene.id });
            }
          }}
          className="mt-2 text-xs text-zinc-400 hover:text-rose-600"
        >
          Remove
        </button>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-100 pb-3">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Location
          <LocationSelect
            project={project}
            value={scene.locationId}
            onChange={(locationId) => dispatch({ type: "SET_SCENE_LOCATION", id: scene.id, locationId })}
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Characters</span>
          <CharacterPicker
            project={project}
            selected={scene.characterIds}
            onChange={(characterIds) => dispatch({ type: "SET_SCENE_CHARACTERS", id: scene.id, characterIds })}
          />
        </div>
        <span className="text-xs text-zinc-400">{shotCount} shot(s)</span>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <FieldInput label="Purpose" field={scene.purpose} onChange={set("purpose")} multiline rows={2} />
          <FieldInput label="Emotional goal" field={scene.emotionalGoal} onChange={set("emotionalGoal")} multiline rows={2} />
        </div>
        <div>
          <FieldInput label="Beats / script (one per line)" field={scene.beats} onChange={set("beats")} multiline rows={4} />
          <FieldInput label="Continuity notes" field={scene.continuityNotes} onChange={set("continuityNotes")} multiline rows={2} />
        </div>
      </div>
    </div>
  );
}

export function ScenesSection() {
  const { project, dispatch } = useOpenProject();
  return (
    <CollapsibleSection
      title="Scenes"
      subtitle={`${project.scenes.length} defined`}
      badge={<NeedsReviewCount fields={project.scenes.flatMap(collectTextFields)} />}
    >
      <FocusHiddenNote fields={project.scenes.flatMap(hideableFields)} />
      <div className="flex flex-col gap-4">
        {project.scenes.length === 0 && <p className="text-sm text-zinc-400">No scenes yet — add one below.</p>}
        {project.scenes.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} />
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_SCENE", id: freshId("scene") })}
          className="self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        >
          + Add scene
        </button>
      </div>
    </CollapsibleSection>
  );
}
