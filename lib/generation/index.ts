import type { DraftGenerator } from "@/lib/types";
import { mockGenerator } from "@/lib/generation/mockGenerator";

/**
 * Single place to swap in a real LLM-backed generator later:
 * implement DraftGenerator (e.g. anthropicGenerator) and return it here,
 * keyed off config or user choice. Nothing else in the app changes.
 */
export function getGenerator(): DraftGenerator {
  return mockGenerator;
}
