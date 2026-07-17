"use client";

import { useRef, useState } from "react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  generateAgentSetupPrompt,
  generateMarkdownShotTable,
  generateProjectBrief,
  generateShotExecutionPrompts,
} from "@/lib/exporters/text";
import { parseProjectImport, serializeProject, ImportError } from "@/lib/exporters/json";
import { useOpenProject } from "@/lib/state/ProjectContext";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(title: string): string {
  const s = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return s === "" ? "project" : s;
}

export function ExportsSection() {
  const { project, dispatch } = useOpenProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    setImportError(null);
    try {
      const imported = parseProjectImport(await file.text());
      if (!window.confirm(`Replace the current project with “${imported.title.value || "Untitled"}”?`)) return;
      dispatch({ type: "SET_PROJECT", project: imported });
    } catch (e) {
      setImportError(e instanceof ImportError ? e.message : "Could not read that file.");
    }
  };

  const fileButton =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50";

  return (
    <CollapsibleSection title="Exports" subtitle="Copy prompts for your video agent, or save this project as a file">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Copy prompts into your video agent</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Paste these prompts into your video agent in order. First set up how the agent should work, then
            provide the project context, and finally give it the individual shot prompts.
          </p>

          <div className="mt-3 flex flex-col gap-4">
            <div>
              <h4 className="mb-1 text-sm font-semibold text-zinc-800">Step 1 — Set Up the Agent</h4>
              <p className="mb-2 text-sm text-zinc-500">
                Paste this first. It tells the video agent to work one shot at a time, restate its understanding
                before generating, and wait for your approval.
              </p>
              <CopyButton label="Copy Agent Setup Prompt" getText={() => generateAgentSetupPrompt(project)} />
            </div>

            <div>
              <h4 className="mb-1 text-sm font-semibold text-zinc-800">Step 2 — Add the Project Brief</h4>
              <p className="mb-2 text-sm text-zinc-500">
                Paste this next. It supplies the film bible, characters, locations, visual rules, continuity
                requirements, and negative constraints.
              </p>
              <CopyButton label="Copy Project Brief" getText={() => generateProjectBrief(project)} />
            </div>

            <div>
              <h4 className="mb-1 text-sm font-semibold text-zinc-800">Step 3 — Generate the Shots</h4>
              <p className="mb-2 text-sm text-zinc-500">
                Paste these last. They provide the instructions, first-frame prompt, and video prompt for each
                shot in sequence. You can also copy individual shots from the Shots section.
              </p>
              <CopyButton label="Copy Shot Execution Prompts" getText={() => generateShotExecutionPrompts(project)} />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-5">
          <h3 className="text-base font-semibold text-zinc-900">Save this project</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Your work autosaves to this browser only. Download the project file to keep a permanent backup or
            to move it to another device — you can re-open it here anytime.
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-2">
            <button
              type="button"
              onClick={() =>
                download(
                  `${slug(project.title.value)}.json`,
                  serializeProject(project, new Date().toISOString()),
                  "application/json",
                )
              }
              className={fileButton}
            >
              Download project file (.json)
            </button>
            <button
              type="button"
              onClick={() =>
                download(`${slug(project.title.value)}-shot-table.md`, generateMarkdownShotTable(project), "text/markdown")
              }
              className={fileButton}
            >
              Download shot table (Markdown)
            </button>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            The shot table is a read-only summary for sharing with collaborators — only the project file can be
            re-opened here.
          </p>
        </div>

        <div className="border-t border-zinc-100 pt-5">
          <h3 className="text-base font-semibold text-zinc-900">Re-open a saved project</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Load a project file (.json) you downloaded earlier. It replaces whatever is currently in the editor,
            so save the current project first if you want to keep it.
          </p>
          <button type="button" onClick={() => fileRef.current?.click()} className={`mt-3 ${fileButton}`}>
            Open project file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
              e.target.value = "";
            }}
          />
          {importError !== null && (
            <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {importError}
            </p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
