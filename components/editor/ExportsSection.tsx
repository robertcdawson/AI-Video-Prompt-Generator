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

  return (
    <CollapsibleSection title="Exports" subtitle="Copy prompts into your video agent, or save the project">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-zinc-800">Level 1 — Agent Setup Prompt</h3>
          <p className="mb-2 text-xs text-zinc-500">
            Paste this first: it tells the agent (e.g. Google Flow) how to behave — one shot at a time,
            restate before generating, never generate without approval.
          </p>
          <CopyButton label="Copy Agent Setup Prompt" getText={() => generateAgentSetupPrompt(project)} />
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-zinc-800">Level 2 — Project Brief</h3>
          <p className="mb-2 text-xs text-zinc-500">
            The film bible: style rules, characters, locations, continuity rules, and negative constraints.
            Unconfirmed fields are flagged inline so the agent knows what is still soft.
          </p>
          <CopyButton label="Copy Project Brief" getText={() => generateProjectBrief(project)} />
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-zinc-800">Level 3 — Shot Execution Prompts</h3>
          <p className="mb-2 text-xs text-zinc-500">
            One prompt per shot, in order, each with its first-frame and video prompts. (Individual shots can
            also be copied from the Shots section.)
          </p>
          <CopyButton label="Copy Shot Execution Prompts" getText={() => generateShotExecutionPrompts(project)} />
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <h3 className="mb-1 text-sm font-semibold text-zinc-800">Files</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                download(
                  `${slug(project.title.value)}.json`,
                  serializeProject(project, new Date().toISOString()),
                  "application/json",
                )
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Download project JSON
            </button>
            <button
              type="button"
              onClick={() =>
                download(`${slug(project.title.value)}-shot-table.md`, generateMarkdownShotTable(project), "text/markdown")
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Download Markdown shot table
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Import project JSON…
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
          </div>
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
