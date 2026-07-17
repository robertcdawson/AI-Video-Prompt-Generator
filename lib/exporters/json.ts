import type {
  Character,
  ExportBundle,
  FieldConfidence,
  FieldSource,
  FieldStatus,
  Location,
  Project,
  Scene,
  Shot,
  TextField,
} from "@/lib/types";
import { emptyField } from "@/lib/field";

export function buildExportBundle(project: Project, exportedAt: string): ExportBundle {
  return { format: "ai-video-preproduction", schemaVersion: 1, exportedAt, project };
}

export function serializeProject(project: Project, exportedAt: string): string {
  return JSON.stringify(buildExportBundle(project, exportedAt), null, 2);
}

// ---------------------------------------------------------------------------
// Import validation
//
// Imports are user-supplied JSON, so nothing is trusted: we check structure,
// coerce every field back into a well-formed FieldMeta, and drop unknown
// keys by rebuilding entities explicitly rather than spreading raw input.
// ---------------------------------------------------------------------------

export class ImportError extends Error {}

const SOURCES: FieldSource[] = ["user", "ai", "derived", "empty"];
const CONFIDENCES: FieldConfidence[] = ["high", "medium", "low"];
const STATUSES: FieldStatus[] = ["confirmed", "needs_review", "placeholder", "missing"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asTextField(v: unknown): TextField {
  if (!isRecord(v) || typeof v.value !== "string") return emptyField();
  return {
    value: v.value,
    source: SOURCES.includes(v.source as FieldSource) ? (v.source as FieldSource) : "user",
    confidence: CONFIDENCES.includes(v.confidence as FieldConfidence)
      ? (v.confidence as FieldConfidence)
      : "medium",
    status: STATUSES.includes(v.status as FieldStatus) ? (v.status as FieldStatus) : "needs_review",
    notes: typeof v.notes === "string" ? v.notes : undefined,
  };
}

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function asIdArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function requireId(v: unknown, what: string): string {
  if (typeof v !== "string" || v.trim() === "") throw new ImportError(`A ${what} is missing its id.`);
  return v;
}

function asCharacter(v: unknown): Character {
  if (!isRecord(v)) throw new ImportError("A character entry is not an object.");
  return {
    id: requireId(v.id, "character"),
    name: asTextField(v.name),
    role: asTextField(v.role),
    appearance: asTextField(v.appearance),
    wardrobe: asTextField(v.wardrobe),
    posture: asTextField(v.posture),
    movementStyle: asTextField(v.movementStyle),
    emotionalBaseline: asTextField(v.emotionalBaseline),
    voice: asTextField(v.voice),
    recurringGestures: asTextField(v.recurringGestures),
    continuityAnchors: asTextField(v.continuityAnchors),
    referenceImageNotes: asTextField(v.referenceImageNotes),
    neverChange: asTextField(v.neverChange),
  };
}

function asLocation(v: unknown): Location {
  if (!isRecord(v)) throw new ImportError("A location entry is not an object.");
  return {
    id: requireId(v.id, "location"),
    name: asTextField(v.name),
    description: asTextField(v.description),
    architecture: asTextField(v.architecture),
    lighting: asTextField(v.lighting),
    props: asTextField(v.props),
    materialPalette: asTextField(v.materialPalette),
    atmosphere: asTextField(v.atmosphere),
    continuityRisks: asTextField(v.continuityRisks),
    referenceImageNotes: asTextField(v.referenceImageNotes),
  };
}

function asScene(v: unknown): Scene {
  if (!isRecord(v)) throw new ImportError("A scene entry is not an object.");
  return {
    id: requireId(v.id, "scene"),
    title: asTextField(v.title),
    purpose: asTextField(v.purpose),
    emotionalGoal: asTextField(v.emotionalGoal),
    beats: asTextField(v.beats),
    locationId: typeof v.locationId === "string" ? v.locationId : null,
    characterIds: asIdArray(v.characterIds),
    continuityNotes: asTextField(v.continuityNotes),
  };
}

function asShot(v: unknown): Shot {
  if (!isRecord(v)) throw new ImportError("A shot entry is not an object.");
  return {
    id: requireId(v.id, "shot"),
    sceneId: asString(v.sceneId, ""),
    beat: asTextField(v.beat),
    purpose: asTextField(v.purpose),
    characterIds: asIdArray(v.characterIds),
    blocking: asTextField(v.blocking),
    screenDirection: asTextField(v.screenDirection),
    framing: asTextField(v.framing),
    lens: asTextField(v.lens),
    movement: asTextField(v.movement),
    lighting: asTextField(v.lighting),
    composition: asTextField(v.composition),
    action: asTextField(v.action),
    dialogue: asTextField(v.dialogue),
    audioNotes: asTextField(v.audioNotes),
    firstFramePrompt: asTextField(v.firstFramePrompt),
    videoPrompt: asTextField(v.videoPrompt),
    duration: asTextField(v.duration),
    transition: asTextField(v.transition),
    continuityNotes: asTextField(v.continuityNotes),
    negativeConstraints: asTextField(v.negativeConstraints),
    status: STATUSES.includes(v.status as FieldStatus) ? (v.status as FieldStatus) : "needs_review",
    version: typeof v.version === "number" && Number.isFinite(v.version) ? Math.max(1, Math.floor(v.version)) : 1,
  };
}

export function normalizeProject(v: unknown): Project {
  if (!isRecord(v)) throw new ImportError("Project data is not an object.");
  const bible = isRecord(v.bible) ? v.bible : {};
  return {
    schemaVersion: 1,
    id: requireId(v.id, "project"),
    title: asTextField(v.title),
    ideaText: asString(v.ideaText, ""),
    bible: {
      premise: asTextField(bible.premise),
      theme: asTextField(bible.theme),
      tone: asTextField(bible.tone),
      visualIntent: asTextField(bible.visualIntent),
      aspectRatio: asTextField(bible.aspectRatio),
      visualStyle: asTextField(bible.visualStyle),
      colorPalette: asTextField(bible.colorPalette),
      lightingStyle: asTextField(bible.lightingStyle),
      cameraLanguage: asTextField(bible.cameraLanguage),
      pace: asTextField(bible.pace),
      texture: asTextField(bible.texture),
      motionLanguage: asTextField(bible.motionLanguage),
      negativeConstraints: asTextField(bible.negativeConstraints),
      continuityRules: asTextField(bible.continuityRules),
    },
    characters: Array.isArray(v.characters) ? v.characters.map(asCharacter) : [],
    locations: Array.isArray(v.locations) ? v.locations.map(asLocation) : [],
    scenes: Array.isArray(v.scenes) ? v.scenes.map(asScene) : [],
    shots: Array.isArray(v.shots) ? v.shots.map(asShot) : [],
    createdAt: asString(v.createdAt, ""),
    updatedAt: asString(v.updatedAt, ""),
  };
}

/** Parse a JSON export file. Accepts a bare Project or an ExportBundle. */
export function parseProjectImport(jsonText: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new ImportError("That file is not valid JSON.");
  }
  if (!isRecord(data)) throw new ImportError("Expected a JSON object at the top level.");

  if (data.format === "ai-video-preproduction") {
    if (data.schemaVersion !== 1) {
      throw new ImportError(`Unsupported schema version ${String(data.schemaVersion)} (this app reads version 1).`);
    }
    return normalizeProject(data.project);
  }
  // Fall back to treating the file as a bare project object.
  return normalizeProject(data);
}
