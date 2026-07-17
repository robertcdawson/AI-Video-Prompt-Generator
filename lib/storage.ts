import type { Project } from "@/lib/types";
import { normalizeProject } from "@/lib/exporters/json";

/**
 * Local-first persistence: one autosave slot in localStorage.
 * Storage failures (quota, private mode) degrade silently — the in-memory
 * project keeps working and export remains available.
 */

const AUTOSAVE_KEY = "avpg.autosave.v1";

export function saveProject(project: Project): void {
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
  } catch {
    // Quota exceeded or storage unavailable; autosave is best-effort.
  }
}

export function loadAutosavedProject(): Project | null {
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (raw === null) return null;
    return normalizeProject(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Snapshot cache so getAutosaveSnapshot can back useSyncExternalStore
// (which requires referentially stable results for unchanged data).
let snapshotRaw: string | null = null;
let snapshotProject: Project | null = null;

export function getAutosaveSnapshot(): Project | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(AUTOSAVE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    try {
      snapshotProject = raw === null ? null : normalizeProject(JSON.parse(raw));
    } catch {
      snapshotProject = null;
    }
  }
  return snapshotProject;
}

export function clearAutosave(): void {
  try {
    window.localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}
