"use client";

import { useState } from "react";
import { getGenerator } from "@/lib/generation";
import { useProjectState } from "@/lib/state/ProjectContext";

const EXAMPLE_IDEA =
  "Two identical androids sit on a couch and joke about how humans outsource their thinking to AI.";

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export function IdeaIntake({ onDone, onBack }: Props) {
  const { dispatch } = useProjectState();
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (idea.trim() === "" || busy) return;
    setBusy(true);
    try {
      const project = await getGenerator().generate(idea.trim(), new Date().toISOString());
      dispatch({ type: "SET_PROJECT", project });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <button type="button" onClick={onBack} className="mb-6 self-start text-sm text-zinc-500 hover:text-zinc-800">
        ← Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">What&apos;s the video?</h1>
      <p className="mt-2 text-zinc-600">
        Describe it roughly — a premise, a vibe, a moment. The draft generator will propose a full
        production structure that you can then review field by field.
      </p>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={6}
        autoFocus
        placeholder={`e.g. ${EXAMPLE_IDEA}`}
        className="mt-6 w-full rounded-xl border border-zinc-300 bg-white p-4 text-base text-zinc-900 shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={idea.trim() === "" || busy}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Drafting…" : "Generate Project Draft"}
        </button>
        <button
          type="button"
          onClick={() => setIdea(EXAMPLE_IDEA)}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          Use the example idea
        </button>
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Drafting runs locally with a deterministic generator for now. Everything it invents is labeled
        AI-suggested so you can review it; a real model can be plugged in later without changing the app.
      </p>
    </main>
  );
}
