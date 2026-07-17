"use client";

import { createContext, useContext, useState } from "react";

/**
 * Focus mode hides fields the user has already confirmed so review passes
 * only show what still needs attention. Kept in context so every FieldInput
 * can honor it without prop drilling.
 */

interface EditorPrefs {
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}

const EditorPrefsContext = createContext<EditorPrefs>({ focusMode: false, setFocusMode: () => {} });

export function EditorPrefsProvider({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  return (
    <EditorPrefsContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </EditorPrefsContext.Provider>
  );
}

export function useEditorPrefs(): EditorPrefs {
  return useContext(EditorPrefsContext);
}
