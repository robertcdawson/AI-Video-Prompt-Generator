"use client";

import type { TextField } from "@/lib/types";
import { useEditorPrefs } from "@/components/ui/EditorPrefs";

/**
 * Focus mode hides confirmed fields, which used to leave cards looking
 * mysteriously empty. Each card passes its focus-hideable fields here so the
 * card can say what disappeared and why instead of showing a blank shell.
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
