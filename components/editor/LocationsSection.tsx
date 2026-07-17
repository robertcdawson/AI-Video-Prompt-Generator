"use client";

import type { Location } from "@/lib/types";
import type { TextFieldKeys } from "@/lib/state/reducer";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { FieldInput } from "@/components/ui/FieldInput";
import { FocusHiddenNote, NeedsReviewCount } from "@/components/ui/FocusHiddenNote";
import { collectTextFields } from "@/lib/stats";
import { freshId, useOpenProject } from "@/lib/state/ProjectContext";

/** The fields Focus mode can hide — everything except the always-visible name. */
const hideableFields = (l: Location) => [
  l.description,
  l.architecture,
  l.lighting,
  l.props,
  l.materialPalette,
  l.atmosphere,
  l.continuityRisks,
  l.referenceImageNotes,
];

function LocationCard({ location }: { location: Location }) {
  const { dispatch } = useOpenProject();
  const set = (key: TextFieldKeys<Location>) => (field: Location["name"]) =>
    dispatch({ type: "SET_LOCATION_FIELD", id: location.id, key, field });

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Identity stays visible in focus mode so the card is never anonymous */}
          <FieldInput label="Name" field={location.name} onChange={set("name")} ignoreFocusMode />
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remove location “${location.name.value}”? Scenes using it will be unassigned.`)) {
              dispatch({ type: "REMOVE_LOCATION", id: location.id });
            }
          }}
          className="mt-2 text-xs text-zinc-400 hover:text-rose-600"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <FieldInput label="Description" field={location.description} onChange={set("description")} multiline />
          <FieldInput label="Architecture" field={location.architecture} onChange={set("architecture")} multiline rows={2} />
          <FieldInput label="Lighting" field={location.lighting} onChange={set("lighting")} multiline rows={2} />
          <FieldInput label="Props" field={location.props} onChange={set("props")} multiline rows={2} />
        </div>
        <div>
          <FieldInput label="Material palette" field={location.materialPalette} onChange={set("materialPalette")} multiline rows={2} />
          <FieldInput label="Atmosphere" field={location.atmosphere} onChange={set("atmosphere")} multiline rows={2} />
          <FieldInput label="Continuity risks" field={location.continuityRisks} onChange={set("continuityRisks")} multiline />
          <FieldInput label="Reference image notes" field={location.referenceImageNotes} onChange={set("referenceImageNotes")} multiline rows={2} />
        </div>
      </div>
    </div>
  );
}

export function LocationsSection() {
  const { project, dispatch } = useOpenProject();
  return (
    <CollapsibleSection
      title="Locations"
      subtitle={`${project.locations.length} defined`}
      badge={<NeedsReviewCount fields={project.locations.flatMap(collectTextFields)} />}
    >
      <FocusHiddenNote fields={project.locations.flatMap(hideableFields)} />
      <div className="flex flex-col gap-4">
        {project.locations.length === 0 && (
          <p className="text-sm text-zinc-400">No locations yet — add one below.</p>
        )}
        {project.locations.map((l) => (
          <LocationCard key={l.id} location={l} />
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_LOCATION", id: freshId("loc") })}
          className="self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        >
          + Add location
        </button>
      </div>
    </CollapsibleSection>
  );
}
