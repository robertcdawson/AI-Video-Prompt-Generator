"use client";

import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { FieldInput } from "@/components/ui/FieldInput";
import { FocusHiddenNote, NeedsReviewCount } from "@/components/ui/FocusHiddenNote";
import { collectTextFields } from "@/lib/stats";
import { useOpenProject } from "@/lib/state/ProjectContext";

export function BibleSection() {
  const { project, dispatch } = useOpenProject();
  const b = project.bible;
  const set = (key: keyof typeof b) => (field: (typeof b)[keyof typeof b]) =>
    dispatch({ type: "SET_BIBLE_FIELD", key, field });

  return (
    <CollapsibleSection
      title="Project Bible"
      subtitle="The rules every shot must obey"
      badge={<NeedsReviewCount fields={collectTextFields(b)} />}
    >
      <FocusHiddenNote fields={collectTextFields(b)} />
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <FieldInput label="Premise" field={b.premise} onChange={set("premise")} multiline />
          <FieldInput label="Theme" field={b.theme} onChange={set("theme")} multiline rows={2} />
          <FieldInput label="Tone" field={b.tone} onChange={set("tone")} multiline rows={2} />
          <FieldInput label="Visual intent" field={b.visualIntent} onChange={set("visualIntent")} multiline rows={2} />
          <FieldInput label="Aspect ratio" field={b.aspectRatio} onChange={set("aspectRatio")} placeholder="16:9" />
          <FieldInput label="Pace" field={b.pace} onChange={set("pace")} multiline rows={2} />
        </div>
        <div>
          <FieldInput label="Visual style" field={b.visualStyle} onChange={set("visualStyle")} multiline rows={2} />
          <FieldInput label="Color palette" field={b.colorPalette} onChange={set("colorPalette")} multiline rows={2} />
          <FieldInput label="Lighting style" field={b.lightingStyle} onChange={set("lightingStyle")} multiline rows={2} />
          <FieldInput label="Camera language" field={b.cameraLanguage} onChange={set("cameraLanguage")} multiline rows={2} />
          <FieldInput label="Texture" field={b.texture} onChange={set("texture")} multiline rows={2} />
          <FieldInput label="Motion language" field={b.motionLanguage} onChange={set("motionLanguage")} multiline rows={2} />
        </div>
      </div>
      <div className="mt-2 border-t border-zinc-100 pt-2">
        <FieldInput
          label="Continuity rules (one per line)"
          field={b.continuityRules}
          onChange={set("continuityRules")}
          multiline
          rows={5}
        />
        <FieldInput
          label="Negative constraints (never allowed)"
          field={b.negativeConstraints}
          onChange={set("negativeConstraints")}
          multiline
          rows={3}
        />
      </div>
    </CollapsibleSection>
  );
}
