"use client";

import type { Character } from "@/lib/types";
import type { TextFieldKeys } from "@/lib/state/reducer";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { FieldInput } from "@/components/ui/FieldInput";
import { freshId, useOpenProject } from "@/lib/state/ProjectContext";

function CharacterCard({ character }: { character: Character }) {
  const { dispatch } = useOpenProject();
  const set = (key: TextFieldKeys<Character>) => (field: Character["name"]) =>
    dispatch({ type: "SET_CHARACTER_FIELD", id: character.id, key, field });

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <FieldInput label="Name" field={character.name} onChange={set("name")} />
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remove character “${character.name.value}”? Shots referencing them keep their text but lose the assignment.`)) {
              dispatch({ type: "REMOVE_CHARACTER", id: character.id });
            }
          }}
          className="mt-2 text-xs text-zinc-400 hover:text-rose-600"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <FieldInput label="Role" field={character.role} onChange={set("role")} multiline rows={2} />
          <FieldInput label="Appearance" field={character.appearance} onChange={set("appearance")} multiline />
          <FieldInput label="Wardrobe" field={character.wardrobe} onChange={set("wardrobe")} multiline rows={2} />
          <FieldInput label="Posture" field={character.posture} onChange={set("posture")} multiline rows={2} />
          <FieldInput label="Movement style" field={character.movementStyle} onChange={set("movementStyle")} multiline rows={2} />
          <FieldInput label="Emotional baseline" field={character.emotionalBaseline} onChange={set("emotionalBaseline")} multiline rows={2} />
        </div>
        <div>
          <FieldInput label="Voice" field={character.voice} onChange={set("voice")} multiline rows={2} />
          <FieldInput label="Recurring gestures" field={character.recurringGestures} onChange={set("recurringGestures")} multiline rows={2} />
          <FieldInput label="Continuity anchors" field={character.continuityAnchors} onChange={set("continuityAnchors")} multiline />
          <FieldInput label="Reference image notes" field={character.referenceImageNotes} onChange={set("referenceImageNotes")} multiline rows={2} placeholder="Which reference image locks this character, and what matters in it" />
          <FieldInput label="Must never change" field={character.neverChange} onChange={set("neverChange")} multiline rows={2} />
        </div>
      </div>
    </div>
  );
}

export function CharactersSection() {
  const { project, dispatch } = useOpenProject();
  return (
    <CollapsibleSection
      title="Characters"
      subtitle={`${project.characters.length} defined`}
    >
      <div className="flex flex-col gap-4">
        {project.characters.length === 0 && (
          <p className="text-sm text-zinc-400">No characters yet — add one below.</p>
        )}
        {project.characters.map((c) => (
          <CharacterCard key={c.id} character={c} />
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_CHARACTER", id: freshId("char") })}
          className="self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        >
          + Add character
        </button>
      </div>
    </CollapsibleSection>
  );
}
