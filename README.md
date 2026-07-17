# AI Video Preproduction

A **preproduction compiler for AI video workflows**. You type a rough video idea; the app compiles it into structured, editable production data — project bible, characters, locations, scenes, a shot table, first-frame image prompts, video-generation prompts, and a setup prompt for an external AI video agent such as Google Flow.

This is **not** a video generator. AI drafts the structure; the human reviews, edits, and directs.

## Product philosophy

- AI drafts, humans direct: every generated value is labeled with its **source** (`user | ai | derived | empty`), **confidence**, and review **status** (`confirmed | needs_review | placeholder | missing`).
- The app teaches filmmaking through structure (coverage grammar, the 180-degree line, continuity anchors), not by hiding it.
- Nothing must be filled in manually — the generator infers good defaults and marks them AI-suggested.
- Local-first: no backend, no accounts. Projects autosave to `localStorage` and export/import as JSON.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## How to use it

1. **Start screen** — create a new project, load an exported `.json`, or resume the autosave.
2. **Idea intake** — describe the video roughly (try: *"Two identical androids sit on a couch and joke about how humans outsource their thinking to AI."*) and hit **Generate Project Draft**.
3. **Project editor** — collapsible sections for Bible, Characters, Locations, Scenes, Shots, Exports. Every field shows provenance badges and a Confirm toggle; the header counts confirmed vs. open fields. **Focus mode** hides everything you've already confirmed.
4. **Shots** — each shot card carries blocking, screen direction, framing, lens, movement, dialogue, continuity notes, a first-frame prompt and a video prompt (rebuildable from the structured fields), plus status and version.
5. **Exports** — three sequential prompts, each copy-to-clipboard:
   - **Step 1 — Set Up the Agent**: instructs the video agent to read the bible, confirm the rules, work one shot at a time, restate each shot for approval, and never generate unapproved.
   - **Step 2 — Add the Project Brief**: bible + characters + locations + continuity rules + negative constraints.
   - **Step 3 — Generate the Shots**: one prompt per shot.
   - Plus: project JSON download/import and a Markdown shot table.

### Identical-character handling

When the idea implies visually identical characters (twins, clones, identical androids), the generator injects a project-wide continuity rule requiring every shot to specify who is speaking, who is positioned where, facing which direction, and the coverage type (A1 coverage, A2 coverage, two-shot, insert, cutaway) — distinguishing them **only** by position, blocking, eyeline, speaking role, and screen direction, never by wardrobe or props unless deliberately assigned.

## Architecture

```
app/                    Next.js App Router shell (the app is fully client-side)
components/
  App.tsx               view state machine: start → intake → editor
  StartScreen.tsx       create / load / resume
  IdeaIntake.tsx        rough idea → Generate Project Draft
  editor/               one component per section + shot cards + export panel
  ui/                   FieldInput (the single field-editing surface), badges,
                        CollapsibleSection, CopyButton, focus-mode prefs
lib/
  types.ts              data model: Project, FieldMeta, Character, Location,
                        Scene, Shot, ExportBundle, DraftGenerator
  field.ts              FieldMeta provenance helpers (aiField, withUserEdit, …)
  generation/
    index.ts            generator registry — swap in a real LLM here
    mockGenerator.ts    deterministic keyword/seeded-template draft generator
    promptComposer.ts   composes first-frame + video prompts from structure
  exporters/
    text.ts             agent setup / project brief / shot prompts / md table
    json.ts             export bundle + hardened import validation
  state/
    reducer.ts          all project mutations (pure reducer)
    ProjectContext.tsx  provider, timestamp stamping, debounced autosave
  storage.ts            localStorage autosave slot
  stats.ts              field-status diagnostics for the header
```

Design decisions worth knowing:

- **`FieldMeta<T>` everywhere.** Structural references (entity ids) stay plain and are edited with pickers; prose fields carry provenance so the UI and exports can flag what's unreviewed.
- **Deterministic generation and exports.** The mock generator seeds a PRNG from the idea text — the same idea always yields byte-identical drafts (ids included). Exporters are pure functions of the project.
- **Pluggable generation.** `DraftGenerator` is a one-method interface; `lib/generation/index.ts` is the only place a real LLM provider needs to be wired in.
- **Distrustful import.** Imported JSON is structurally validated and every field coerced back into a well-formed `FieldMeta`; unknown keys are dropped.

## Roadmap (post-MVP)

- Real LLM integration (Claude API) behind the existing `DraftGenerator` interface, including regenerate-per-entity
- Image prompt generation and reference image management (upload, attach to characters/locations, referenced in shot prompts)
- Drag-and-drop shot reordering and shot re-numbering
- Version history per shot (keep prior prompt versions, diff/compare)
- Prompt comparison view (side-by-side variants)
- Cost tracking per generation attempt
- Model-specific export presets: Google Flow, Grok Imagine, Runway, Kling, Sora (prompt dialects + duration/aspect constraints)
- Multi-project library, IndexedDB storage, dark theme
