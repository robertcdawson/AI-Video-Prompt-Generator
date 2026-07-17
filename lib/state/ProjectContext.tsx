"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import type { Project } from "@/lib/types";
import { projectReducer, type ProjectAction } from "@/lib/state/reducer";
import { saveProject } from "@/lib/storage";

interface ProjectContextValue {
  project: Project | null;
  dispatch: (action: ProjectAction) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, rawDispatch] = useReducer(projectReducer, null);
  const saveTimer = useRef<number | null>(null);

  // Stamp a timestamp onto every action so the reducer itself stays pure.
  const dispatch = useCallback((action: ProjectAction) => {
    rawDispatch({ ...action, at: new Date().toISOString() });
  }, []);

  // Debounced autosave: every project change lands in localStorage shortly after.
  useEffect(() => {
    if (project === null) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveProject(project), 400);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [project]);

  return <ProjectContext.Provider value={{ project, dispatch }}>{children}</ProjectContext.Provider>;
}

export function useProjectState(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (ctx === null) throw new Error("useProjectState must be used inside ProjectProvider");
  return ctx;
}

/** For screens that only render when a project is open. */
export function useOpenProject(): { project: Project; dispatch: (action: ProjectAction) => void } {
  const { project, dispatch } = useProjectState();
  if (project === null) throw new Error("No project is open");
  return { project, dispatch };
}

let idCounter = 0;
/** Ids for user-created entities (generator ids stay deterministic separately). */
export function freshId(prefix: string): string {
  idCounter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}
