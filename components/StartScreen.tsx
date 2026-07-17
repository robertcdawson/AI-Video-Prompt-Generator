"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { getAutosaveSnapshot } from "@/lib/storage";
import { parseProjectImport, ImportError } from "@/lib/exporters/json";
import { useProjectState } from "@/lib/state/ProjectContext";

interface Props {
  onNewProject: () => void;
  onOpenEditor: () => void;
}

export function StartScreen({ onNewProject, onOpenEditor }: Props) {
  const { dispatch } = useProjectState();
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // localStorage is browser-only; the server snapshot is always "no autosave",
  // and the storage event keeps this in sync if another tab saves.
  const autosaved = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    getAutosaveSnapshot,
    () => null,
  );

  const handleFile = async (file: File) => {
    setImportError(null);
    try {
      const project = parseProjectImport(await file.text());
      dispatch({ type: "SET_PROJECT", project });
      onOpenEditor();
    } catch (e) {
      setImportError(e instanceof ImportError ? e.message : "Could not read that file.");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">AI Video Preproduction</h1>
      <p className="mt-2 text-zinc-600">
        Turn a rough video idea into a project bible, shot table, and agent-ready prompts. AI drafts the
        structure; you review, edit, and direct.
      </p>

      <div className="mt-10 flex flex-col gap-3">
        {autosaved !== null && (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "SET_PROJECT", project: autosaved });
              onOpenEditor();
            }}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-left shadow-sm transition-colors hover:bg-indigo-100"
          >
            <span className="block font-semibold text-indigo-900">
              Resume “{autosaved.title.value || "Untitled project"}”
            </span>
            <span className="text-sm text-indigo-700">
              Autosaved · {autosaved.shots.length} shots · last edited{" "}
              {autosaved.updatedAt ? new Date(autosaved.updatedAt).toLocaleString() : "recently"}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onNewProject}
          className="rounded-xl border border-zinc-900 bg-zinc-900 px-5 py-4 text-left shadow-sm transition-colors hover:bg-zinc-800"
        >
          <span className="block font-semibold text-white">Start a new project</span>
          <span className="text-sm text-zinc-300">Describe your idea and get a full draft to direct.</span>
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-zinc-300 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:bg-zinc-50"
        >
          <span className="block font-semibold text-zinc-900">Load a project file</span>
          <span className="text-sm text-zinc-500">Import a previously exported .json project.</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        {importError !== null && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {importError}
          </p>
        )}
      </div>

      <p className="mt-12 text-xs text-zinc-400">
        Local-first: everything stays in this browser until you export it.
      </p>
    </main>
  );
}
