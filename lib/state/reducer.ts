import type {
  Character,
  FieldStatus,
  Location,
  Project,
  ProjectBible,
  Scene,
  Shot,
  TextField,
} from "@/lib/types";
import { emptyField } from "@/lib/field";
import { composeFirstFramePrompt, composeVideoPrompt } from "@/lib/generation/promptComposer";

/**
 * All project mutations flow through this reducer. Components compute the
 * new TextField (via the helpers in lib/field.ts) and the reducer only
 * places it, so provenance rules live in one spot and the reducer stays
 * a dumb, easily-tested state machine.
 */

/** Keys of T whose values are editable text fields. */
export type TextFieldKeys<T> = {
  [K in keyof T]: T[K] extends TextField ? K : never;
}[keyof T];

export type ProjectAction =
  | { type: "SET_PROJECT"; project: Project }
  | { type: "SET_TITLE"; field: TextField }
  | { type: "SET_BIBLE_FIELD"; key: TextFieldKeys<ProjectBible>; field: TextField }
  | { type: "SET_CHARACTER_FIELD"; id: string; key: TextFieldKeys<Character>; field: TextField }
  | { type: "SET_LOCATION_FIELD"; id: string; key: TextFieldKeys<Location>; field: TextField }
  | { type: "SET_SCENE_FIELD"; id: string; key: TextFieldKeys<Scene>; field: TextField }
  | { type: "SET_SCENE_LOCATION"; id: string; locationId: string | null }
  | { type: "SET_SCENE_CHARACTERS"; id: string; characterIds: string[] }
  | { type: "SET_SHOT_FIELD"; id: string; key: TextFieldKeys<Shot>; field: TextField }
  | { type: "SET_SHOT_CHARACTERS"; id: string; characterIds: string[] }
  | { type: "SET_SHOT_STATUS"; id: string; status: FieldStatus }
  | { type: "BUMP_SHOT_VERSION"; id: string }
  | { type: "REBUILD_SHOT_PROMPTS"; id: string }
  | { type: "ADD_CHARACTER"; id: string }
  | { type: "ADD_LOCATION"; id: string }
  | { type: "ADD_SCENE"; id: string }
  | { type: "ADD_SHOT"; id: string; sceneId: string }
  | { type: "REMOVE_CHARACTER"; id: string }
  | { type: "REMOVE_LOCATION"; id: string }
  | { type: "REMOVE_SCENE"; id: string }
  | { type: "REMOVE_SHOT"; id: string };

/** Stamped onto every action by the provider so the reducer stays pure. */
export type StampedAction = ProjectAction & { at: string };

function newCharacter(id: string): Character {
  return {
    id,
    name: { ...emptyField(), value: "New Character", source: "user", status: "needs_review" },
    role: emptyField(),
    appearance: emptyField(),
    wardrobe: emptyField(),
    posture: emptyField(),
    movementStyle: emptyField(),
    emotionalBaseline: emptyField(),
    voice: emptyField(),
    recurringGestures: emptyField(),
    continuityAnchors: emptyField(),
    referenceImageNotes: emptyField(),
    neverChange: emptyField(),
  };
}

function newLocation(id: string): Location {
  return {
    id,
    name: { ...emptyField(), value: "New Location", source: "user", status: "needs_review" },
    description: emptyField(),
    architecture: emptyField(),
    lighting: emptyField(),
    props: emptyField(),
    materialPalette: emptyField(),
    atmosphere: emptyField(),
    continuityRisks: emptyField(),
    referenceImageNotes: emptyField(),
  };
}

function newScene(id: string): Scene {
  return {
    id,
    title: { ...emptyField(), value: "New Scene", source: "user", status: "needs_review" },
    purpose: emptyField(),
    emotionalGoal: emptyField(),
    beats: emptyField(),
    locationId: null,
    characterIds: [],
    continuityNotes: emptyField(),
  };
}

function newShot(id: string, sceneId: string): Shot {
  return {
    id,
    sceneId,
    beat: emptyField(),
    purpose: emptyField(),
    characterIds: [],
    blocking: emptyField(),
    screenDirection: emptyField(),
    framing: emptyField(),
    lens: emptyField(),
    movement: emptyField(),
    lighting: emptyField(),
    composition: emptyField(),
    action: emptyField(),
    dialogue: emptyField(),
    audioNotes: emptyField(),
    firstFramePrompt: emptyField(),
    videoPrompt: emptyField(),
    duration: emptyField(),
    transition: emptyField(),
    continuityNotes: emptyField(),
    negativeConstraints: emptyField(),
    status: "missing",
    version: 1,
  };
}

function mapById<T extends { id: string }>(items: T[], id: string, fn: (item: T) => T): T[] {
  return items.map((item) => (item.id === id ? fn(item) : item));
}

export function projectReducer(project: Project | null, action: StampedAction): Project | null {
  if (action.type === "SET_PROJECT") return action.project;
  if (project === null) return null;

  const touched = (next: Project): Project => ({ ...next, updatedAt: action.at });

  switch (action.type) {
    case "SET_TITLE":
      return touched({ ...project, title: action.field });
    case "SET_BIBLE_FIELD":
      return touched({ ...project, bible: { ...project.bible, [action.key]: action.field } });
    case "SET_CHARACTER_FIELD":
      return touched({
        ...project,
        characters: mapById(project.characters, action.id, (c) => ({ ...c, [action.key]: action.field })),
      });
    case "SET_LOCATION_FIELD":
      return touched({
        ...project,
        locations: mapById(project.locations, action.id, (l) => ({ ...l, [action.key]: action.field })),
      });
    case "SET_SCENE_FIELD":
      return touched({
        ...project,
        scenes: mapById(project.scenes, action.id, (s) => ({ ...s, [action.key]: action.field })),
      });
    case "SET_SCENE_LOCATION":
      return touched({
        ...project,
        scenes: mapById(project.scenes, action.id, (s) => ({ ...s, locationId: action.locationId })),
      });
    case "SET_SCENE_CHARACTERS":
      return touched({
        ...project,
        scenes: mapById(project.scenes, action.id, (s) => ({ ...s, characterIds: action.characterIds })),
      });
    case "SET_SHOT_FIELD":
      return touched({
        ...project,
        shots: mapById(project.shots, action.id, (s) => ({ ...s, [action.key]: action.field })),
      });
    case "SET_SHOT_CHARACTERS":
      return touched({
        ...project,
        shots: mapById(project.shots, action.id, (s) => ({ ...s, characterIds: action.characterIds })),
      });
    case "SET_SHOT_STATUS":
      return touched({
        ...project,
        shots: mapById(project.shots, action.id, (s) => ({ ...s, status: action.status })),
      });
    case "BUMP_SHOT_VERSION":
      return touched({
        ...project,
        shots: mapById(project.shots, action.id, (s) => ({ ...s, version: s.version + 1 })),
      });
    case "REBUILD_SHOT_PROMPTS":
      return touched({
        ...project,
        shots: mapById(project.shots, action.id, (s) => ({
          ...s,
          firstFramePrompt: {
            value: composeFirstFramePrompt(project, s),
            source: "derived",
            confidence: "medium",
            status: "needs_review",
          },
          videoPrompt: {
            value: composeVideoPrompt(project, s),
            source: "derived",
            confidence: "medium",
            status: "needs_review",
          },
        })),
      });
    case "ADD_CHARACTER":
      return touched({ ...project, characters: [...project.characters, newCharacter(action.id)] });
    case "ADD_LOCATION":
      return touched({ ...project, locations: [...project.locations, newLocation(action.id)] });
    case "ADD_SCENE":
      return touched({ ...project, scenes: [...project.scenes, newScene(action.id)] });
    case "ADD_SHOT":
      return touched({ ...project, shots: [...project.shots, newShot(action.id, action.sceneId)] });
    case "REMOVE_CHARACTER":
      return touched({
        ...project,
        characters: project.characters.filter((c) => c.id !== action.id),
        scenes: project.scenes.map((s) => ({
          ...s,
          characterIds: s.characterIds.filter((cid) => cid !== action.id),
        })),
        shots: project.shots.map((s) => ({
          ...s,
          characterIds: s.characterIds.filter((cid) => cid !== action.id),
        })),
      });
    case "REMOVE_LOCATION":
      return touched({
        ...project,
        locations: project.locations.filter((l) => l.id !== action.id),
        scenes: project.scenes.map((s) => (s.locationId === action.id ? { ...s, locationId: null } : s)),
      });
    case "REMOVE_SCENE":
      return touched({
        ...project,
        scenes: project.scenes.filter((s) => s.id !== action.id),
        shots: project.shots.filter((s) => s.sceneId !== action.id),
      });
    case "REMOVE_SHOT":
      return touched({ ...project, shots: project.shots.filter((s) => s.id !== action.id) });
    default:
      return project;
  }
}
