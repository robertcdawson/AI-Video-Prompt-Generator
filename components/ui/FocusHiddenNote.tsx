"use client";

import type { TextField } from "@/lib/types";
import { useEditorPrefs } from "@/components/ui/EditorPrefs";

/**
 * Focus mode hides confirmed fields, which used to leave sections looking
 * mysteriously empty. Each section passes all of its focus-hideable fields
 * here (once — not per card) so it can say what disappeared and why.
 */
export function FocusHiddenNote({ fields }: { fields: TextField[] }) {
  const { focusMode } = useEditorPrefs();
  if (!focusMode) return null;

  const hidden = fields.filter((f) => f.status === "confirmed").length;
  if (hidden === 0) return null;

  const allHidden = hidden === fields.length;
  return (
    <p className="my-2 rounded-md bg-indigo-50/70 px-3 py-2 text-sm text-indigo-800">
      {allHidden
        ? `✓ All ${hidden} fields here are confirmed — Focus mode is hiding them.`
        : `✓ ${hidden} confirmed ${hidden === 1 ? "field is" : "fields are"} hidden by Focus mode.`}
    </p>
  );
}

/**
 * The counterpart to FocusHiddenNote: while Focus mode is on, flag how many
 * fields in a section (or a collapsed shot card) still need attention, so the
 * header count in the banner is traceable to actual places in the page.
 */
export function NeedsReviewCount({ fields }: { fields: TextField[] }) {
  const { focusMode } = useEditorPrefs();
  if (!focusMode) return null;

  const open = fields.filter((f) => f.status !== "confirmed").length;
  if (open === 0) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      {open} to review
    </span>
  );
}
