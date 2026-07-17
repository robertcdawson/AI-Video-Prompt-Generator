"use client";

import { useState } from "react";
import type { TextField } from "@/lib/types";
import { withNotes, withStatus, withUserEdit } from "@/lib/field";
import { FieldBadges } from "@/components/ui/StatusBadge";
import { useEditorPrefs } from "@/components/ui/EditorPrefs";

interface Props {
  label: string;
  field: TextField;
  onChange: (next: TextField) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  /** Monospace rendering for prompt-style fields. */
  mono?: boolean;
  /** Keep visible even in focus mode (e.g. the header title). */
  ignoreFocusMode?: boolean;
}

/**
 * The single editing surface for every FieldMeta-backed value:
 * input + provenance badges + confirm toggle + optional notes.
 */
export function FieldInput({
  label,
  field,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
  mono = false,
  ignoreFocusMode = false,
}: Props) {
  const { focusMode } = useEditorPrefs();
  const [showNotes, setShowNotes] = useState(false);

  if (focusMode && !ignoreFocusMode && field.status === "confirmed") return null;

  const confirmed = field.status === "confirmed";
  const canConfirm = field.value.trim() !== "";
  const inputClasses = `w-full rounded-md border px-2.5 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
    field.status === "missing"
      ? "border-rose-300 bg-rose-50/40"
      : field.status === "placeholder"
        ? "border-orange-300 bg-orange-50/40"
        : "border-zinc-300 bg-white"
  } ${mono ? "font-mono text-xs" : ""}`;

  return (
    <div className="py-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
          <FieldBadges field={field} />
        </label>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            {field.notes ? "notes ●" : "notes"}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onChange(withStatus(field, confirmed ? "needs_review" : "confirmed"))}
            className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
              confirmed
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
            }`}
          >
            {confirmed ? "Confirmed ✓" : "Confirm"}
          </button>
        </span>
      </div>
      {multiline ? (
        <textarea
          value={field.value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(withUserEdit(field, e.target.value))}
          className={inputClasses}
        />
      ) : (
        <input
          type="text"
          value={field.value}
          placeholder={placeholder}
          onChange={(e) => onChange(withUserEdit(field, e.target.value))}
          className={inputClasses}
        />
      )}
      {showNotes && (
        <input
          type="text"
          value={field.notes ?? ""}
          placeholder="Private production notes for this field…"
          onChange={(e) => onChange(withNotes(field, e.target.value))}
          className="mt-1 w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 placeholder-zinc-400 focus:outline-none"
        />
      )}
    </div>
  );
}
