"use client";

import { EditorPrefsProvider, useEditorPrefs } from "@/components/ui/EditorPrefs";
import { FieldInput } from "@/components/ui/FieldInput";
import { BibleSection } from "@/components/editor/BibleSection";
import { CharactersSection } from "@/components/editor/CharactersSection";
import { LocationsSection } from "@/components/editor/LocationsSection";
import { ScenesSection } from "@/components/editor/ScenesSection";
import { ShotsSection } from "@/components/editor/ShotsSection";
import { ExportsSection } from "@/components/editor/ExportsSection";
import { HowToUseSection } from "@/components/editor/HowToUseSection";
import { projectFieldStats } from "@/lib/stats";
import { useOpenProject } from "@/lib/state/ProjectContext";

function EditorHeader({ onExit }: { onExit: () => void }) {
  const { project, dispatch } = useOpenProject();
  const { focusMode, setFocusMode } = useEditorPrefs();
  const stats = projectFieldStats(project);
  const openItems = stats.needs_review + stats.placeholder + stats.missing;

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <button type="button" onClick={onExit} className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Projects
        </button>
        <div className="min-w-[16rem] flex-1">
          <FieldInput
            label="Project title"
            field={project.title}
            onChange={(field) => dispatch({ type: "SET_TITLE", field })}
            ignoreFocusMode
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Diagnostics: how much of the project the human has actually signed off on */}
          <span className="text-xs text-zinc-500" title="confirmed / total fields">
            <span className="font-semibold text-emerald-700">{stats.confirmed}</span>
            <span> / {stats.total} confirmed</span>
            {openItems > 0 && <span className="ml-2 font-medium text-amber-700">{openItems} open</span>}
          </span>
          <label
            className="flex min-h-[45px] cursor-pointer items-center gap-2 px-1 text-sm font-medium text-zinc-600"
            title="Hide fields you've already confirmed, so you can work through what still needs attention"
          >
            <input
              type="checkbox"
              checked={focusMode}
              onChange={(e) => setFocusMode(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Focus mode
          </label>
        </div>
      </div>
      {focusMode && (
        <div className="border-t border-indigo-100 bg-indigo-50">
          <p className="mx-auto max-w-5xl px-6 py-2 text-sm text-indigo-900">
            {openItems > 0 ? (
              <>
                <strong>Focus mode is on:</strong> confirmed fields are temporarily hidden so you can
                concentrate on the <strong>{openItems}</strong> still needing review — follow the amber
                “to review” counts on each section to find them. Nothing is deleted — turn Focus mode
                off to see everything again.
              </>
            ) : (
              <>
                <strong>Focus mode is on, and everything is confirmed</strong> — that&apos;s why the fields
                are hidden. Turn Focus mode off to see them again.
              </>
            )}
          </p>
        </div>
      )}
    </header>
  );
}

export function EditorScreen({ onExit }: { onExit: () => void }) {
  return (
    <EditorPrefsProvider>
      <div className="min-h-screen bg-zinc-100">
        <EditorHeader onExit={onExit} />
        <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6">
          <BibleSection />
          <CharactersSection />
          <LocationsSection />
          <ScenesSection />
          <ShotsSection />
          <ExportsSection />
          <HowToUseSection />
        </main>
        <footer className="mx-auto max-w-5xl px-6 pb-8 text-sm text-zinc-400">
          Autosaves to this browser. Download the project file from the Exports section to keep a portable copy.
        </footer>
      </div>
    </EditorPrefsProvider>
  );
}
