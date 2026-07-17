"use client";

import { useState } from "react";
import { ProjectProvider, useProjectState } from "@/lib/state/ProjectContext";
import { StartScreen } from "@/components/StartScreen";
import { IdeaIntake } from "@/components/IdeaIntake";
import { EditorScreen } from "@/components/editor/EditorScreen";

export type AppView = "start" | "intake" | "editor";

function AppInner() {
  const [view, setView] = useState<AppView>("start");
  const { project } = useProjectState();

  if (view === "intake") return <IdeaIntake onDone={() => setView("editor")} onBack={() => setView("start")} />;
  if (view === "editor" && project !== null) {
    return <EditorScreen onExit={() => setView("start")} />;
  }
  return <StartScreen onNewProject={() => setView("intake")} onOpenEditor={() => setView("editor")} />;
}

export function App() {
  return (
    <ProjectProvider>
      <AppInner />
    </ProjectProvider>
  );
}
