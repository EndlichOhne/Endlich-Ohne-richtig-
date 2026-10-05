export const CHECK_KEY = "eo-check";

export type Kind = "tattoo" | "pmu" | "microblading" | "coverup";
export type Size = "xs" | "s" | "m" | "l" | "xl";
export type Age = "under6" | "6to12" | "1to3" | "3to5" | "over5";
export type Origin = "pro" | "amateur" | "unknown";
export type Region =
  | "arm"
  | "forearm"
  | "hand"
  | "shoulder"
  | "chest"
  | "back"
  | "belly"
  | "hip"
  | "leg"
  | "foot"
  | "face"
  | "brows"
  | "lips"
  | "other";

export const COLORS = [
  "Schwarz",
  "Dunkelblau",
  "Blau",
  "Rot",
  "Orange",
  "Gelb",
  "Grün",
  "Türkis",
  "Violett",
  "Weiß",
  "Hautfarbe",
  "andere",
] as const;

export const HARD_COLORS = new Set([
  "Gelb",
  "Weiß",
  "Orange",
  "Grün",
  "Türkis",
  "Hautfarbe",
]);

export type CheckAnswers = {
  kind: Kind | null;
  size: Size | null;
  widthCm: string;
  heightCm: string;
  colors: string[];
  age: Age | null;
  origin: Origin | null;
  region: Region | null;
  photoNoteAck: boolean;
};

export const EMPTY_CHECK: CheckAnswers = {
  kind: null,
  size: null,
  widthCm: "",
  heightCm: "",
  colors: [],
  age: null,
  origin: null,
  region: null,
  photoNoteAck: false,
};

export const KIND_LABEL: Record<Kind, string> = {
  tattoo: "Tattoo",
  pmu: "Permanent Make-up",
  microblading: "Microblading",
  coverup: "Cover-up-Aufhellung",
};

export const SIZE_LABEL: Record<Size, string> = {
  xs: "sehr klein",
  s: "klein",
  m: "mittel",
  l: "groß",
  xl: "sehr groß",
};

export const AGE_LABEL: Record<Age, string> = {
  under6: "unter 6 Monate",
  "6to12": "6–12 Monate",
  "1to3": "1–3 Jahre",
  "3to5": "3–5 Jahre",
  over5: "über 5 Jahre",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  pro: "professionelles Tattoo",
  amateur: "Amateur-/Laientattoo",
  unknown: "unbekannt",
};

export const REGION_LABEL: Record<Region, string> = {
  arm: "Arm",
  forearm: "Unterarm",
  hand: "Hand",
  shoulder: "Schulter",
  chest: "Brust",
  back: "Rücken",
  belly: "Bauch",
  hip: "Hüfte",
  leg: "Bein",
  foot: "Fuß",
  face: "Gesicht",
  brows: "Augenbrauen",
  lips: "Lippen",
  other: "andere",
};

export function loadCheck(): CheckAnswers {
  if (typeof window === "undefined") return EMPTY_CHECK;
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    if (!raw) return EMPTY_CHECK;
    return { ...EMPTY_CHECK, ...(JSON.parse(raw) as CheckAnswers) };
  } catch {
    return EMPTY_CHECK;
  }
}

export function saveCheck(answers: CheckAnswers) {
  const { ...safe } = answers;
  localStorage.setItem(CHECK_KEY, JSON.stringify(safe));
}

export type Estimate = {
  sessionsLabel: string;
  priceLabel: string;
  factors: string[];
  caveats: string[];
};

export function estimateFrom(a: CheckAnswers): Estimate {
  const factors: string[] = [];
  let low = 4;
  let high = 8;

  if (a.kind === "pmu" || a.kind === "microblading") {
    low = 2;
    high = 6;
    factors.push("PMU/Microblading sitzt oft flacher, Farben können trotzdem hartnäckig sein.");
  } else if (a.kind === "coverup") {
    low = 3;
    high = 8;
    factors.push("Aufhellung für ein Cover-up zielt nicht auf vollständige Entfernung.");
  }

  const sizeBoost: Record<Size, [number, number]> = {
    xs: [0, 0],
    s: [1, 2],
    m: [2, 4],
    l: [4, 6],
    xl: [6, 8],
  };
  if (a.size) {
    const [l, h] = sizeBoost[a.size];
    low += l;
    high += h;
    factors.push(`Fläche: ${SIZE_LABEL[a.size]}.`);
  }

  const hard = a.colors.filter((c) => HARD_COLORS.has(c));
  if (hard.length) {
    low += 2;
    high += 4;
    factors.push(`Schwerer zugängliche Farben: ${hard.join(", ")}.`);
  }
  if (a.colors.includes("Schwarz") || a.colors.includes("Dunkelblau")) {
    factors.push("Dunkle Pigmente sprechen oft besser auf gängige Laserwellenlängen an – ohne Garantie.");
  }

  if (a.age === "under6") {
    factors.push("Sehr junge Pigmentierung: oft wird erst nach ausreichender Heilung behandelt.");
  }
  if (a.origin === "pro") {
    factors.push("Professionelle Arbeit kann dichter und tiefer liegen.");
    high += 1;
  }
  if (a.origin === "amateur") {
    factors.push("Laientattoos variieren stark in Tiefe und Dichte.");
  }

  const slowHeal: Region[] = ["hand", "foot", "face", "brows", "lips"];
  if (a.region && slowHeal.includes(a.region)) {
    high += 2;
    factors.push(`Region ${REGION_LABEL[a.region]}: Heilung und Abstände können länger sein.`);
  }

  low = Math.max(2, Math.min(low, 16));
  high = Math.max(low + 2, Math.min(high, 20));

  const priceBySize: Record<Size, string> = {
    xs: "etwa 80–180 €",
    s: "etwa 100–220 €",
    m: "etwa 150–350 €",
    l: "etwa 250–500 €",
    xl: "etwa 350–600 €",
  };

  return {
    sessionsLabel: `ca. ${low}–${high}+ Behandlungen`,
    priceLabel: a.size
      ? `${priceBySize[a.size]} pro Sitzung`
      : "etwa 80–600 € pro Sitzung",
    factors,
    caveats: [
      "Algorithmische Einschätzung – keine medizinische Diagnose.",
      "Keine Garantie auf vollständige Entfernung oder eine feste Sitzungszahl.",
      "Die Gesamtkosten können erst nach individueller Einschätzung seriös bestimmt werden.",
    ],
  };
}
