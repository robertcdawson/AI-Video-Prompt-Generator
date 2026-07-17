import type {
  Character,
  DraftGenerator,
  Location,
  Project,
  ProjectBible,
  Scene,
  Shot,
} from "@/lib/types";
import { aiField, derivedField, emptyField, hashString, makeId, placeholderField } from "@/lib/field";
import { composeFirstFramePrompt, composeVideoPrompt } from "@/lib/generation/promptComposer";

/**
 * Deterministic mock draft generator.
 *
 * The same idea text always produces the same draft (ids included), which
 * makes exports reproducible and the pipeline testable. It does shallow
 * keyword inference — enough to produce a plausible, teachable structure —
 * and is honest about uncertainty: anything it invents from thin air is
 * marked `placeholder`/low confidence, anything it can't infer is `missing`.
 */

/** Tiny seeded PRNG (mulberry32) so template picks are stable per idea. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, options: readonly T[]): T {
  return options[Math.floor(rng() * options.length)];
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Idea parsing
// ---------------------------------------------------------------------------

interface ParsedIdea {
  raw: string;
  lower: string;
  /** e.g. "how humans outsource their thinking to AI" */
  topic: string | null;
  subjectNoun: string;
  characterCount: number;
  identical: boolean;
  isDialogueDriven: boolean;
  isComedic: boolean;
}

const SUBJECT_NOUNS = [
  "android", "robot", "astronaut", "detective", "chef", "wizard", "scientist",
  "vampire", "pirate", "knight", "cowboy", "alien", "ghost", "clown",
  "musician", "dancer", "teacher", "doctor", "soldier", "monk", "samurai",
  "woman", "man", "girl", "boy", "kid", "child", "dog", "cat", "friend", "stranger",
] as const;

const NUMBER_WORDS: Record<string, number> = {
  one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, "1": 1, "2": 2, "3": 3, "4": 4,
};

function parseIdea(raw: string): ParsedIdea {
  const lower = raw.toLowerCase();
  const words = lower.split(/[^a-z0-9']+/).filter((w) => w !== "");

  let subjectNoun = "character";
  let subjectIndex = -1;
  for (const noun of SUBJECT_NOUNS) {
    const idx = words.findIndex((w) => w === noun || w === `${noun}s`);
    if (idx !== -1 && (subjectIndex === -1 || idx < subjectIndex)) {
      subjectNoun = noun;
      subjectIndex = idx;
    }
  }

  let characterCount = 1;
  if (subjectIndex > 0) {
    const prev = words[subjectIndex - 1];
    const prev2 = subjectIndex > 1 ? words[subjectIndex - 2] : "";
    characterCount = NUMBER_WORDS[prev] ?? NUMBER_WORDS[prev2] ?? (words[subjectIndex].endsWith("s") ? 2 : 1);
  } else if (subjectIndex === 0) {
    characterCount = words[0].endsWith("s") ? 2 : 1;
  }
  characterCount = Math.min(Math.max(characterCount, 1), 4);

  const identical = /\b(identical|twin|twins|clone|clones|duplicate|same-looking)\b/.test(lower);
  const isDialogueDriven = /\b(joke|jokes|talk|argue|debate|discuss|banter|chat|interview|conversation|complain)\b/.test(lower);
  const isComedic = /\b(joke|jokes|funny|comedy|banter|absurd|satir|parody|deadpan)\b/.test(lower);

  const aboutMatch = raw.match(/\babout\s+(.+?)(?:[.!?]|$)/i);
  const topic = aboutMatch ? aboutMatch[1].trim() : null;

  return { raw, lower, topic, subjectNoun, characterCount, identical, isDialogueDriven, isComedic };
}

// ---------------------------------------------------------------------------
// Location inference
// ---------------------------------------------------------------------------

interface LocationTemplate {
  key: string;
  name: string;
  description: string;
  architecture: string;
  lighting: string;
  props: string;
  materialPalette: string;
  atmosphere: string;
  continuityRisks: string;
}

const LOCATION_TEMPLATES: LocationTemplate[] = [
  {
    key: "couch|sofa|living room|apartment|tv",
    name: "Apartment Living Room",
    description: "A modest, lived-in living room centered on a mid-century couch facing the camera, coffee table in front, window light from one side.",
    architecture: "Small urban apartment; single main wall behind the couch, one side window, shelf unit as background depth.",
    lighting: "Soft window key from screen left, warm practical lamp fill on the right, gentle falloff to the back wall.",
    props: "Couch, coffee table with two mugs, floor lamp, wall shelf with books and one plant.",
    materialPalette: "Worn fabric, warm wood, matte painted wall, a little brass.",
    atmosphere: "Domestic, calm, slightly too tidy — a stage for conversation.",
    continuityRisks: "Mug positions on the coffee table; couch cushion arrangement; lamp on/off state; window light direction must stay screen left.",
  },
  {
    key: "office|desk|cubicle|meeting",
    name: "Open-Plan Office",
    description: "A contemporary open-plan office with rows of desks, glass partitions, and a wall of windows in the background.",
    architecture: "Long rectangular floor, exposed ceiling, glass-walled meeting room at the far end.",
    lighting: "Flat cool fluorescent ambience with daylight spill from the window wall.",
    props: "Desks, monitors, task chairs, whiteboard with half-erased diagrams, coffee cups.",
    materialPalette: "Grey carpet, white laminate, brushed aluminum, glass.",
    atmosphere: "Quietly busy, impersonal, hum of HVAC.",
    continuityRisks: "Monitor screen contents; whiteboard writing; background extras' positions between shots.",
  },
  {
    key: "bar|pub|diner|cafe|coffee|restaurant",
    name: "Neighborhood Bar",
    description: "A dim neighborhood bar with a long counter, stools, and shelves of bottles glowing behind the bartender's station.",
    architecture: "Narrow room, bar counter along one wall, booths opposite, neon sign in the window.",
    lighting: "Low warm practicals, bottle-shelf glow, pools of light over the counter.",
    props: "Bar stools, glassware, coasters, neon sign, jukebox in the corner.",
    materialPalette: "Dark stained wood, brass rail, cracked leather, colored glass.",
    atmosphere: "Intimate, murmuring, end-of-the-day.",
    continuityRisks: "Drink fill levels; glass positions; neon sign visibility; background patron placement.",
  },
  {
    key: "forest|woods|park|garden|trail",
    name: "Forest Clearing",
    description: "A quiet forest clearing with tall trunks, ferns, and shafts of light cutting through the canopy.",
    architecture: "Natural clearing roughly ten meters across, fallen log at its edge, path exiting frame right.",
    lighting: "Dappled sunlight through canopy, cool ambient shade, occasional light shafts.",
    props: "Fallen log, ferns, scattered leaves, distant path marker.",
    materialPalette: "Bark, moss, wet leaf litter, grey stone.",
    atmosphere: "Hushed, damp, birdsong.",
    continuityRisks: "Sun direction and shadow angles; foliage arrangement; weather consistency across shots.",
  },
  {
    key: "street|city|sidewalk|alley|rooftop",
    name: "City Street",
    description: "A mid-density city street with storefronts, parked cars, and pedestrians passing in soft focus.",
    architecture: "Three-story mixed-use facades, wide sidewalk, crosswalk at the near corner.",
    lighting: "Overcast daylight, even and soft, storefront glow at street level.",
    props: "Parked cars, street signs, newspaper box, cafe tables at one storefront.",
    materialPalette: "Concrete, brick, glass, painted metal.",
    atmosphere: "Ambient traffic, distant sirens, ordinary urban rhythm.",
    continuityRisks: "Parked car positions; pedestrian extras; storefront signage; time-of-day light.",
  },
  {
    key: "spaceship|space station|cockpit|starship|orbit",
    name: "Spacecraft Interior",
    description: "A compact spacecraft crew compartment with curved panels, instrument glow, and a viewport showing starfield.",
    architecture: "Cylindrical module, two crew seats facing a console, hatch aft.",
    lighting: "Cool console glow key, dim overhead strips, starlight rim from the viewport.",
    props: "Crew seats, console with switches, handholds, mission patch on the bulkhead.",
    materialPalette: "Brushed alloy, matte white composite, glowing acrylic.",
    atmosphere: "Low mechanical hum, isolated, precise.",
    continuityRisks: "Console indicator states; starfield orientation through viewport; harness buckled/unbuckled.",
  },
  {
    key: "kitchen|cook|bake",
    name: "Home Kitchen",
    description: "A bright home kitchen with a central island, hanging pans, and morning light through a window over the sink.",
    architecture: "L-shaped counters plus island, window over sink, doorway to dining area.",
    lighting: "Morning window key, warm under-cabinet fill.",
    props: "Island with cutting board, hanging pans, kettle, bowl of fruit.",
    materialPalette: "Butcher block, ceramic tile, stainless steel, linen.",
    atmosphere: "Warm, domestic, faint kettle hiss.",
    continuityRisks: "Ingredient states (chopped/whole); pan positions; window light angle.",
  },
];

function inferLocation(parsed: ParsedIdea): LocationTemplate | null {
  for (const t of LOCATION_TEMPLATES) {
    const keys = t.key.split("|");
    if (keys.some((k) => parsed.lower.includes(k))) return t;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Character inference
// ---------------------------------------------------------------------------

interface CharacterSpec {
  noun: string;
  appearance: string;
  wardrobe: string;
  posture: string;
  movementStyle: string;
  voice: string;
}

const CHARACTER_SPECS: Record<string, CharacterSpec> = {
  android: {
    noun: "android",
    appearance: "Humanoid android with smooth pale synthetic skin, subtle seam lines at the jaw and temples, and calm gray eyes that catch the light slightly too evenly.",
    wardrobe: "Fitted charcoal utility suit with a thin collar; no logos.",
    posture: "Unnaturally upright and still; perfect symmetry at rest.",
    movementStyle: "Economical and precise; motions start and stop cleanly with no fidgeting.",
    voice: "Even, measured, lightly synthetic warmth; minimal pitch variation.",
  },
  robot: {
    noun: "robot",
    appearance: "Compact bipedal robot with a matte off-white shell, articulated joints, and a single expressive lens for a face.",
    wardrobe: "No clothing; body panels with small worn decals.",
    posture: "Slight forward servo lean, head tracks whoever speaks.",
    movementStyle: "Quick servo adjustments punctuated by complete stillness.",
    voice: "Clipped, softly vocoded, oddly polite.",
  },
  generic: {
    noun: "character",
    appearance: "Adult of unremarkable build with an expressive face the camera can read easily.",
    wardrobe: "Simple, era-appropriate everyday clothing in muted tones.",
    posture: "Relaxed but attentive.",
    movementStyle: "Natural, unhurried gestures.",
    voice: "Conversational, natural cadence.",
  },
};

function specForNoun(noun: string): CharacterSpec {
  return CHARACTER_SPECS[noun] ?? { ...CHARACTER_SPECS.generic, noun };
}

function characterNames(parsed: ParsedIdea): string[] {
  const n = parsed.characterCount;
  if (parsed.subjectNoun === "android" || parsed.subjectNoun === "robot") {
    return Array.from({ length: n }, (_, i) => `A${i + 1}`);
  }
  const letters = ["A", "B", "C", "D"];
  if (n === 1) return [titleCase(parsed.subjectNoun)];
  return Array.from({ length: n }, (_, i) => `${titleCase(parsed.subjectNoun)} ${letters[i]}`);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

const IDENTICAL_RULE = (names: string[]): string =>
  `Because ${names.join(" and ")} are physically identical, every shot must specify which one is speaking, ` +
  `where each is positioned in the frame, which direction each is facing, and whether the shot is ` +
  `${names.map((n) => `${n} coverage`).join(", ")}, a two-shot, an insert, or a cutaway. ` +
  `Distinguish them only by position, blocking, eyeline, speaking role, and screen direction — ` +
  `never by wardrobe or props unless a distinguishing item is intentionally assigned in the character sheet.`;

function buildBible(parsed: ParsedIdea, rng: () => number): ProjectBible {
  const tone = parsed.isComedic
    ? pick(rng, [
        "Deadpan satirical comedy; the humor comes from stillness and timing, not mugging.",
        "Dry observational comedy played completely straight.",
      ])
    : pick(rng, [
        "Quietly contemplative with an undercurrent of tension.",
        "Grounded and sincere, letting small moments carry weight.",
      ]);

  const visualStyle = pick(rng, [
    "Naturalistic cinematic realism with shallow depth of field and restrained grading.",
    "Clean cinematic look, slightly desaturated, filmic contrast curve.",
  ]);

  const premise = parsed.raw.trim();

  return {
    premise: aiField(premise, "high"),
    theme: parsed.topic
      ? aiField(`An exploration of ${parsed.topic}.`, "medium")
      : placeholderField("State the underlying theme in one sentence — what is this really about?"),
    tone: aiField(tone),
    visualIntent: aiField(
      parsed.isDialogueDriven
        ? "The camera observes rather than performs: locked or gently drifting frames that give the performances room, with cuts driven by dialogue rhythm."
        : "Purposeful, composed frames where camera movement is motivated by action, not decoration.",
    ),
    aspectRatio: aiField("16:9", "high"),
    visualStyle: aiField(visualStyle),
    colorPalette: aiField(
      pick(rng, [
        "Warm neutrals with a single cool accent; nothing saturated above skin tones.",
        "Muted earth tones, soft blacks, one controlled accent color per scene.",
      ]),
    ),
    lightingStyle: aiField(
      pick(rng, [
        "Soft motivated key from practical sources, gentle contrast, no visible fixtures.",
        "Naturalistic single-source lighting with soft wraps and honest shadows.",
      ]),
    ),
    cameraLanguage: aiField(
      parsed.isDialogueDriven
        ? "Classic coverage grammar: establishing two-shot, matched singles at equal focal lengths, inserts for punctuation. Respect the 180-degree line at all times."
        : "Deliberate framing with a consistent lens set; movement only when the story moves.",
    ),
    pace: aiField(
      parsed.isComedic
        ? "Measured, with holds after punchlines; comedy lives in the extra half-second."
        : "Unhurried; let shots breathe before cutting.",
    ),
    texture: aiField("Subtle film grain, soft halation on highlights, no digital sharpening."),
    motionLanguage: aiField(
      "Camera is static or on a slow drift; characters move deliberately. No whip pans, no speed ramps.",
    ),
    negativeConstraints: aiField(
      "No text or captions in frame, no watermarks, no extra characters, no morphing or warping faces, no changes to character appearance between shots, no camera shake, no lens flares.",
      "high",
    ),
    continuityRules: aiField(
      [
        "Character appearance, wardrobe, and grooming are locked across all shots.",
        "Location layout, props, and lighting direction must match the location sheet in every shot.",
        "Respect the 180-degree line established in each scene's two-shot.",
      ].join("\n"),
      "high",
    ),
  };
}

function buildCharacter(parsed: ParsedIdea, name: string, index: number, allNames: string[]): Character {
  const spec = specForNoun(parsed.subjectNoun);
  const identicalPair = parsed.identical && allNames.length > 1;
  const side = index % 2 === 0 ? "screen left" : "screen right";

  return {
    id: makeId("char", `${parsed.raw}::char::${name}`),
    name: aiField(name, "high"),
    role: aiField(
      identicalPair
        ? index === 0
          ? "Instigator — starts each comedic thread; sits screen left."
          : "Escalator — tops each thread and lands the punchlines; sits screen right."
        : index === 0
          ? "Protagonist"
          : "Supporting",
      "medium",
    ),
    appearance: aiField(spec.appearance),
    wardrobe: aiField(
      identicalPair
        ? `${spec.wardrobe} Identical to ${allNames.filter((n) => n !== name).join(" and ")} by design — do not add distinguishing items unless deliberately assigned here.`
        : spec.wardrobe,
    ),
    posture: aiField(spec.posture),
    movementStyle: aiField(spec.movementStyle),
    emotionalBaseline: aiField(
      parsed.isComedic ? "Serene, unbothered certainty — never breaks deadpan." : "Composed, watchful.",
    ),
    voice: aiField(spec.voice),
    recurringGestures: placeholderField(
      index === 0
        ? "Suggestion: a slow head tilt when making a point."
        : "Suggestion: a single slow blink before replying.",
    ),
    continuityAnchors: aiField(
      identicalPair
        ? `Default position: ${side} of the two-shot. Distinguished from the other(s) ONLY by position, eyeline, and speaking turn — never by appearance.`
        : "Keep face, hair, and wardrobe identical in every shot; anchor to the reference image.",
      "high",
    ),
    referenceImageNotes: emptyField(),
    neverChange: aiField(
      "Face, eye color, hair, wardrobe, and body proportions must never change between shots.",
      "high",
    ),
  };
}

function buildLocation(parsed: ParsedIdea): Location {
  const t = inferLocation(parsed);
  if (t) {
    return {
      id: makeId("loc", `${parsed.raw}::loc::${t.name}`),
      name: aiField(t.name, "high"),
      description: aiField(t.description),
      architecture: aiField(t.architecture),
      lighting: aiField(t.lighting),
      props: aiField(t.props),
      materialPalette: aiField(t.materialPalette),
      atmosphere: aiField(t.atmosphere),
      continuityRisks: aiField(t.continuityRisks, "high"),
      referenceImageNotes: emptyField(),
    };
  }
  return {
    id: makeId("loc", `${parsed.raw}::loc::primary`),
    name: placeholderField("Primary Location"),
    description: placeholderField("Describe the main setting implied by the idea."),
    architecture: emptyField(),
    lighting: emptyField(),
    props: emptyField(),
    materialPalette: emptyField(),
    atmosphere: emptyField(),
    continuityRisks: emptyField(),
    referenceImageNotes: emptyField(),
  };
}

interface ShotSeed {
  purposeLabel: string;
  purpose: string;
  framing: string;
  lens: string;
  movement: string;
  composition: string;
  blocking: string;
  screenDirection: string;
  action: string;
  dialogue: string;
  duration: string;
  transition: string;
  continuity: string;
  characterIds: string[];
  dialogueIsPlaceholder?: boolean;
}

function buildScenesAndShots(
  parsed: ParsedIdea,
  characters: Character[],
  location: Location,
): { scenes: Scene[]; shots: Shot[] } {
  const names = characters.map((c) => c.name.value);
  const ids = characters.map((c) => c.id);
  const topic = parsed.topic ?? "the subject of the piece";
  const twoPlus = characters.length >= 2;
  const nameA = names[0];
  const nameB = names[1] ?? names[0];
  const pairIds = twoPlus ? [ids[0], ids[1]] : [ids[0]];
  const identicalNote = parsed.identical && twoPlus
    ? ` ${nameA} is screen left, ${nameB} is screen right; identify each by position and eyeline only.`
    : "";

  const scene1: Scene = {
    id: makeId("scene", `${parsed.raw}::scene::1`),
    title: aiField(parsed.isDialogueDriven ? "The Conversation" : "Setup"),
    purpose: aiField(
      parsed.isDialogueDriven
        ? `Establish the pair and the premise, then build the exchange about ${topic} to its strongest beat.`
        : "Establish the world, the character(s), and what they want.",
    ),
    emotionalGoal: aiField(
      parsed.isComedic
        ? "The audience settles into the deadpan rhythm and starts anticipating the next line."
        : "Curiosity — the audience leans in.",
    ),
    beats: aiField(
      (parsed.isDialogueDriven
        ? [
            "Establish the space and the characters in it.",
            `First exchange introduces the topic: ${topic}.`,
            "The exchange escalates; each line tops the last.",
            "A held pause lands the strongest beat.",
          ]
        : [
            "Establish the space.",
            "Introduce the character(s) mid-activity.",
            "A small event sets the story in motion.",
          ]
      ).join("\n"),
    ),
    locationId: location.id,
    characterIds: ids,
    continuityNotes: parsed.identical && twoPlus
      ? aiField(`Lock positions for the whole scene: ${nameA} screen left, ${nameB} screen right. Do not swap sides between shots.`, "high")
      : aiField("Establish and hold the 180-degree line from the first two-shot.", "medium"),
  };

  const scene2: Scene = {
    id: makeId("scene", `${parsed.raw}::scene::2`),
    title: aiField(parsed.isComedic ? "The Button" : "Resolution"),
    purpose: aiField(
      parsed.isComedic
        ? "Land the final reversal and get out fast — the ending is the punchline."
        : "Resolve the beat and leave a lasting final image.",
    ),
    emotionalGoal: aiField(parsed.isComedic ? "A dry final laugh, then silence." : "A satisfying settle."),
    beats: aiField(
      (parsed.isComedic
        ? ["A final line reframes everything before it.", "Hold on the stillness after the line.", "Cut to black."]
        : ["The consequence of scene 1 arrives.", "Final image states the theme without words."]
      ).join("\n"),
    ),
    locationId: location.id,
    characterIds: ids,
    continuityNotes: aiField("Match all continuity anchors from Scene 1 — same layout, light direction, and positions.", "high"),
  };

  const dlg = (speaker: string, hint: string): string => `${speaker}: "${hint}"`;

  const seeds: ShotSeed[] = [];

  seeds.push({
    purposeLabel: "establishing",
    purpose: "Establish the space and the characters' spatial relationship; set the 180-degree line.",
    framing: twoPlus ? "Wide two-shot, symmetrical, camera at seated eye level" : "Wide establishing shot, character in environment",
    lens: "35mm",
    movement: "Locked off",
    composition: twoPlus
      ? "Centered symmetry; equal negative space on both sides; characters framed by the set."
      : "Character placed on a thirds line with the environment doing the storytelling.",
    blocking: twoPlus
      ? `${nameA} seated screen left, ${nameB} seated screen right, both facing camera, angled slightly toward each other.`
      : `${nameA} centered in the space, mid-activity.`,
    screenDirection: twoPlus ? `${nameA} looks frame right when speaking to ${nameB}; ${nameB} looks frame left.` : "Neutral.",
    action: twoPlus
      ? "Both hold near-stillness; small attentive turns toward whoever speaks."
      : "Character continues their activity, unaware of the camera.",
    dialogue: parsed.isDialogueDriven
      ? dlg(nameA, `Opening observation that introduces ${topic}`)
      : "",
    duration: "6s",
    transition: "Cut",
    continuity: `This shot establishes the line of action — all subsequent coverage stays on this side.${identicalNote}`,
    characterIds: ids,
    dialogueIsPlaceholder: parsed.isDialogueDriven,
  });

  if (twoPlus) {
    seeds.push({
      purposeLabel: `${nameA} coverage`,
      purpose: `${nameA} coverage — deliver a line and let the camera read the deadpan.`,
      framing: `Medium close-up single on ${nameA}, over-the-shoulder foreground of ${nameB} soft`,
      lens: "50mm",
      movement: "Locked off",
      composition: `${nameA} on the right third looking frame right; ${nameB}'s shoulder soft in left foreground.`,
      blocking: `${nameA} remains seated screen left of the couch geometry; ${nameB}'s shoulder anchors the frame edge.`,
      screenDirection: `${nameA} eyeline frame right, at ${nameB}'s eye height.`,
      action: `${nameA} delivers the line with minimal movement; one slow head tilt on the key word.`,
      dialogue: parsed.isDialogueDriven ? dlg(nameA, `Setup line developing ${topic}`) : "",
      duration: "5s",
      transition: "Cut",
      continuity: `${nameA} coverage. Same eyeline height and lens as ${nameB}'s matching single. Do not mirror or flip.${identicalNote}`,
      characterIds: [ids[0], ids[1]],
      dialogueIsPlaceholder: parsed.isDialogueDriven,
    });
    seeds.push({
      purposeLabel: `${nameB} coverage`,
      purpose: `${nameB} coverage — the reply that tops the setup.`,
      framing: `Medium close-up single on ${nameB}, over-the-shoulder foreground of ${nameA} soft`,
      lens: "50mm",
      movement: "Locked off",
      composition: `${nameB} on the left third looking frame left; ${nameA}'s shoulder soft in right foreground.`,
      blocking: `${nameB} remains seated screen right; ${nameA}'s shoulder anchors the frame edge.`,
      screenDirection: `${nameB} eyeline frame left, matching ${nameA}'s single.`,
      action: `${nameB} replies, then holds perfectly still through the beat after the line.`,
      dialogue: parsed.isDialogueDriven ? dlg(nameB, `Reply that escalates ${topic}`) : "",
      duration: "5s",
      transition: "Cut",
      continuity: `${nameB} coverage — matched single to the previous shot, same lens and eyeline height.${identicalNote}`,
      characterIds: [ids[0], ids[1]],
      dialogueIsPlaceholder: parsed.isDialogueDriven,
    });
  } else {
    seeds.push({
      purposeLabel: "medium",
      purpose: "Bring the audience closer to the character as the situation develops.",
      framing: `Medium shot on ${nameA}`,
      lens: "50mm",
      movement: "Slow push-in",
      composition: `${nameA} on a thirds line, environment readable behind.`,
      blocking: `${nameA} holds position from the establishing shot.`,
      screenDirection: "Consistent with the established line of action.",
      action: "The character's activity develops one step further.",
      dialogue: "",
      duration: "5s",
      transition: "Cut",
      continuity: "Match position, wardrobe, and light direction from the establishing shot.",
      characterIds: [ids[0]],
    });
  }

  seeds.push({
    purposeLabel: "insert",
    purpose: "Insert for punctuation — a detail that comments on the conversation without a face.",
    framing: "Close-up insert on a significant object in the space",
    lens: "85mm",
    movement: "Locked off",
    composition: "Object centered, shallow focus, background abstracted to tone.",
    blocking: "No characters in frame (hands may enter if motivated).",
    screenDirection: "Neutral.",
    action: "The object sits in stillness; at most one tiny motivated movement.",
    dialogue: "",
    duration: "3s",
    transition: "Cut",
    continuity: "The object must match its position and state in the wide shots.",
    characterIds: [],
  });

  const scene1Seeds = seeds.map((s) => ({ ...s, sceneId: scene1.id }));

  const finalSeeds: Array<ShotSeed & { sceneId: string }> = [
    ...scene1Seeds,
    {
      sceneId: scene2.id,
      purposeLabel: "closing two-shot",
      purpose: parsed.isComedic
        ? "Return to the symmetrical wide for the final line; the stillness after it is the joke."
        : "Final image that states the theme; hold longer than comfortable, then cut.",
      framing: twoPlus ? "Wide two-shot, identical framing to the establishing shot" : "Wide shot, identical framing to the establishing shot",
      lens: "35mm",
      movement: "Locked off",
      composition: "Exact repeat of the opening composition — the repetition is the point.",
      blocking: twoPlus
        ? `${nameA} screen left and ${nameB} screen right, exactly as established.`
        : `${nameA} in the established position.`,
      screenDirection: "As established.",
      action: parsed.isComedic
        ? "The final line lands; both hold absolute stillness for a full two seconds before the cut."
        : "A final, quiet action closes the story.",
      dialogue: parsed.isDialogueDriven ? dlg(nameB, `Final line that reframes ${topic}`) : "",
      duration: "7s",
      transition: "Cut to black",
      continuity: `Framing must exactly match Shot 1 — same camera height, lens, and distance.${identicalNote}`,
      characterIds: pairIds.length === ids.length ? ids : pairIds,
      dialogueIsPlaceholder: parsed.isDialogueDriven,
    },
  ];

  const shots: Shot[] = finalSeeds.map((seed, i) => {
    const beatLines = (i < scene1Seeds.length ? scene1.beats : scene2.beats).value.split("\n");
    return {
      id: makeId("shot", `${parsed.raw}::shot::${i + 1}::${seed.purposeLabel}`),
      sceneId: seed.sceneId,
      beat: aiField(beatLines[Math.min(i, beatLines.length - 1)] ?? "", "medium"),
      purpose: aiField(seed.purpose),
      characterIds: seed.characterIds,
      blocking: aiField(seed.blocking, parsed.identical ? "high" : "medium"),
      screenDirection: aiField(seed.screenDirection, parsed.identical ? "high" : "medium"),
      framing: aiField(seed.framing),
      lens: aiField(seed.lens, "medium"),
      movement: aiField(seed.movement),
      lighting: { ...emptyField(), notes: "Inherits the bible lighting style unless overridden." },
      composition: aiField(seed.composition),
      action: aiField(seed.action),
      dialogue: seed.dialogue === ""
        ? emptyField()
        : seed.dialogueIsPlaceholder
          ? placeholderField(seed.dialogue)
          : aiField(seed.dialogue),
      audioNotes: aiField(i === 0 ? "Establish the room tone here; it carries through the scene." : "Room tone continues; no score."),
      firstFramePrompt: derivedField(""),
      videoPrompt: derivedField(""),
      duration: aiField(seed.duration, "medium"),
      transition: aiField(seed.transition, "medium"),
      continuityNotes: aiField(seed.continuity, parsed.identical ? "high" : "medium"),
      negativeConstraints: emptyField(),
      status: "needs_review",
      version: 1,
    };
  });

  return { scenes: [scene1, scene2], shots };
}

function inferTitle(parsed: ParsedIdea, rng: () => number): string {
  if (parsed.topic) {
    const words = parsed.topic.split(/\s+/).filter((w) => w.length > 3);
    if (words.length > 0) {
      const key = titleCase(pick(rng, words).replace(/[^a-zA-Z0-9']/g, ""));
      return parsed.subjectNoun !== "character"
        ? `${titleCase(parsed.subjectNoun)}s on ${key}`
        : key;
    }
  }
  const raw = parsed.raw.trim().split(/\s+/).slice(0, 5).join(" ");
  return titleCase(raw.replace(/[.!?]+$/, ""));
}

export const mockGenerator: DraftGenerator = {
  name: "mock",
  async generate(idea: string, now: string): Promise<Project> {
    const parsed = parseIdea(idea);
    const rng = seededRandom(hashString(idea.trim().toLowerCase()));

    const bible = buildBible(parsed, rng);
    const names = characterNames(parsed);
    const characters = names.map((n, i) => buildCharacter(parsed, n, i, names));
    const location = buildLocation(parsed);
    const { scenes, shots } = buildScenesAndShots(parsed, characters, location);

    if (parsed.identical && names.length > 1) {
      bible.continuityRules = {
        ...bible.continuityRules,
        value: `${IDENTICAL_RULE(names)}\n${bible.continuityRules.value}`,
        confidence: "high",
      };
    }

    const project: Project = {
      schemaVersion: 1,
      id: makeId("proj", `${idea.trim()}`),
      title: aiField(inferTitle(parsed, rng), "medium"),
      ideaText: idea,
      bible,
      characters,
      locations: [location],
      scenes,
      shots,
      createdAt: now,
      updatedAt: now,
    };

    // Prompts are derived from everything above, so compose them last.
    project.shots = project.shots.map((shot) => ({
      ...shot,
      firstFramePrompt: derivedField(composeFirstFramePrompt(project, shot)),
      videoPrompt: derivedField(composeVideoPrompt(project, shot)),
    }));

    return project;
  },
};
