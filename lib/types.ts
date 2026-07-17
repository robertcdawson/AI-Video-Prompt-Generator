/**
 * Core data model for the preproduction compiler.
 *
 * Every creative field is wrapped in FieldMeta so the UI can show where a
 * value came from (user vs AI vs derived), how confident the generator was,
 * and whether the human has reviewed it. Structural references (entity ids)
 * are intentionally NOT wrapped — they are edited via pickers, not prose.
 */

export type FieldSource = "user" | "ai" | "derived" | "empty";
export type FieldConfidence = "high" | "medium" | "low";
export type FieldStatus = "confirmed" | "needs_review" | "placeholder" | "missing";

export interface FieldMeta<T = string> {
  value: T;
  source: FieldSource;
  confidence: FieldConfidence;
  status: FieldStatus;
  notes?: string;
}

export type TextField = FieldMeta<string>;

/** Style + rules that apply to the whole film. */
export interface ProjectBible {
  premise: TextField;
  theme: TextField;
  tone: TextField;
  visualIntent: TextField;
  aspectRatio: TextField;
  visualStyle: TextField;
  colorPalette: TextField;
  lightingStyle: TextField;
  cameraLanguage: TextField;
  pace: TextField;
  texture: TextField;
  motionLanguage: TextField;
  negativeConstraints: TextField;
  /** Project-wide continuity rules, one per line (e.g. identical-character coverage rules). */
  continuityRules: TextField;
}

export interface Character {
  id: string;
  name: TextField;
  role: TextField;
  appearance: TextField;
  wardrobe: TextField;
  posture: TextField;
  movementStyle: TextField;
  emotionalBaseline: TextField;
  voice: TextField;
  recurringGestures: TextField;
  continuityAnchors: TextField;
  referenceImageNotes: TextField;
  neverChange: TextField;
}

export interface Location {
  id: string;
  name: TextField;
  description: TextField;
  architecture: TextField;
  lighting: TextField;
  props: TextField;
  materialPalette: TextField;
  atmosphere: TextField;
  continuityRisks: TextField;
  referenceImageNotes: TextField;
}

export interface Scene {
  id: string;
  title: TextField;
  purpose: TextField;
  emotionalGoal: TextField;
  /** Script or beat list, one beat per line. */
  beats: TextField;
  locationId: string | null;
  characterIds: string[];
  continuityNotes: TextField;
}

export interface Shot {
  id: string;
  sceneId: string;
  beat: TextField;
  purpose: TextField;
  characterIds: string[];
  blocking: TextField;
  screenDirection: TextField;
  framing: TextField;
  lens: TextField;
  movement: TextField;
  lighting: TextField;
  composition: TextField;
  action: TextField;
  dialogue: TextField;
  audioNotes: TextField;
  firstFramePrompt: TextField;
  videoPrompt: TextField;
  duration: TextField;
  transition: TextField;
  continuityNotes: TextField;
  negativeConstraints: TextField;
  status: FieldStatus;
  version: number;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  title: TextField;
  /** The raw idea the user typed at intake; kept for regeneration context. */
  ideaText: string;
  bible: ProjectBible;
  characters: Character[];
  locations: Location[];
  scenes: Scene[];
  shots: Shot[];
  createdAt: string;
  updatedAt: string;
}

/** Wrapper written to disk on JSON export and expected on import. */
export interface ExportBundle {
  format: "ai-video-preproduction";
  schemaVersion: 1;
  exportedAt: string;
  project: Project;
}

/**
 * Pluggable draft generation. The MVP ships a deterministic mock; a real
 * LLM provider implements the same interface later.
 */
export interface DraftGenerator {
  readonly name: string;
  generate(idea: string, now: string): Promise<Project>;
}
