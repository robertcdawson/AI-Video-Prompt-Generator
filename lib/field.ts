import type { FieldConfidence, FieldMeta, FieldStatus, TextField } from "@/lib/types";

/** A value the AI drafted and the human has not yet reviewed. */
export function aiField(value: string, confidence: FieldConfidence = "medium"): TextField {
  return { value, source: "ai", confidence, status: "needs_review" };
}

/** A value computed from other fields (prompts, etc.). */
export function derivedField(value: string): TextField {
  return { value, source: "derived", confidence: "medium", status: "needs_review" };
}

/** A field the generator could not infer at all. */
export function emptyField(): TextField {
  return { value: "", source: "empty", confidence: "low", status: "missing" };
}

/** A low-confidence stand-in the user is expected to replace. */
export function placeholderField(value: string): TextField {
  return { value, source: "ai", confidence: "low", status: "placeholder" };
}

/** Apply a user edit: typing claims ownership and re-opens review state. */
export function withUserEdit(field: FieldMeta<string>, value: string): TextField {
  if (value.trim() === "") {
    return { ...field, value, source: "empty", confidence: "low", status: "missing" };
  }
  return { ...field, value, source: "user", confidence: "high", status: "needs_review" };
}

export function withStatus(field: TextField, status: FieldStatus): TextField {
  return { ...field, status };
}

export function withNotes(field: TextField, notes: string): TextField {
  return { ...field, notes: notes.trim() === "" ? undefined : notes };
}

export function isBlank(field: TextField): boolean {
  return field.value.trim() === "";
}

/** Non-crypto string hash used to make the mock generator deterministic. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic id derived from a namespace + seed (stable across runs for the same idea). */
export function makeId(prefix: string, seed: string): string {
  return `${prefix}_${hashString(seed).toString(36)}`;
}
