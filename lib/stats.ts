import type { FieldStatus, Project, TextField } from "@/lib/types";

export type FieldStats = Record<FieldStatus, number> & { total: number };

function isTextField(v: unknown): v is TextField {
  return (
    typeof v === "object" &&
    v !== null &&
    "value" in v &&
    "source" in v &&
    "status" in v &&
    "confidence" in v
  );
}

/** Walk every FieldMeta in the project and tally review status — the "diagnostics" count. */
export function projectFieldStats(project: Project): FieldStats {
  const stats: FieldStats = { confirmed: 0, needs_review: 0, placeholder: 0, missing: 0, total: 0 };
  const visit = (obj: object) => {
    for (const v of Object.values(obj)) {
      if (isTextField(v)) {
        stats[v.status] += 1;
        stats.total += 1;
      }
    }
  };
  visit({ title: project.title });
  visit(project.bible);
  project.characters.forEach(visit);
  project.locations.forEach(visit);
  project.scenes.forEach(visit);
  project.shots.forEach(visit);
  return stats;
}
