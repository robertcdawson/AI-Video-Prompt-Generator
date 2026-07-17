"use client";

import type { Project } from "@/lib/types";

/** Chip-toggle list for assigning characters to a scene or shot. */
export function CharacterPicker({
  project,
  selected,
  onChange,
}: {
  project: Project;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (project.characters.length === 0) {
    return <p className="text-xs text-zinc-400">No characters defined yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {project.characters.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== c.id) : [...selected, c.id])
            }
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              active
                ? "border-indigo-300 bg-indigo-100 text-indigo-800"
                : "border-zinc-300 bg-white text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            {c.name.value || "(unnamed)"}
          </button>
        );
      })}
    </div>
  );
}

export function LocationSelect({
  project,
  value,
  onChange,
}: {
  project: Project;
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      <option value="">— no location —</option>
      {project.locations.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name.value || "(unnamed location)"}
        </option>
      ))}
    </select>
  );
}
