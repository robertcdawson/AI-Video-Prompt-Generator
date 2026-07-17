import type { FieldSource, FieldStatus, TextField } from "@/lib/types";

const STATUS_STYLES: Record<FieldStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  needs_review: { label: "Needs review", className: "bg-amber-100 text-amber-800 border-amber-300" },
  placeholder: { label: "Placeholder", className: "bg-orange-100 text-orange-800 border-orange-300" },
  missing: { label: "Missing", className: "bg-rose-100 text-rose-800 border-rose-300" },
};

const SOURCE_STYLES: Record<FieldSource, { label: string; className: string } | null> = {
  ai: { label: "AI", className: "bg-violet-100 text-violet-800 border-violet-300" },
  derived: { label: "Derived", className: "bg-sky-100 text-sky-800 border-sky-300" },
  user: { label: "You", className: "bg-blue-100 text-blue-800 border-blue-300" },
  empty: null,
};

function Chip({ label, className, title }: { label: string; className: string; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: FieldStatus }) {
  const s = STATUS_STYLES[status];
  return <Chip label={s.label} className={s.className} />;
}

/** Compact provenance chips for one field: source + status (+ confidence on hover). */
export function FieldBadges({ field }: { field: TextField }) {
  const source = SOURCE_STYLES[field.source];
  const status = STATUS_STYLES[field.status];
  return (
    <span className="inline-flex items-center gap-1">
      {source !== null && (
        <Chip label={source.label} className={source.className} title={`Confidence: ${field.confidence}`} />
      )}
      <Chip label={status.label} className={status.className} />
    </span>
  );
}
