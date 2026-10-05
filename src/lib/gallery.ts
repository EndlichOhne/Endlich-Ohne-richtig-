export const GALLERY_DISCLAIMER =
  "Jede Tattoo-Entfernung ist individuell. Sitzungszahl, Dauer und Ergebnis können stark abweichen. Abgebildete Verläufe – auch mit dem Titel „Echte Ergebnisse“ – sind keine typischen Ergebnisse, kein Heilversprechen und keine Garantie. Beispiel-/Demo-Einträge sind gekennzeichnet.";

export type GalleryLocation =
  | "arm"
  | "hand"
  | "leg"
  | "shoulder"
  | "back"
  | "chest"
  | "neck"
  | "other";

export type GallerySize = "s" | "m" | "l";
export type ColorGroup = "black" | "grey" | "color" | "red" | "blue" | "green";
export type ProgressStatus = "treating" | "faded" | "done";
export type ModerationStatus = "draft" | "submitted" | "review" | "published" | "rejected";
export type SessionBand = "1-3" | "4-6" | "7-10" | "10+";

export type TimelineShot = {
  id: string;
  resultId: string;
  imageUrl: string;
  sessionNumber: number;
  takenAt: string;
  caption: string;
  sortOrder: number;
};

export type GalleryResult = {
  id: string;
  userId: string;
  tattooId?: string;
  isDemo: boolean;
  bodyLocation: GalleryLocation;
  sizeKey: GallerySize;
  sizeLabel: string;
  colors: string[];
  colorGroup: ColorGroup;
  sessionCount: number;
  progressStatus: ProgressStatus;
  description: string;
  anonymize: boolean;
  consentPublish: boolean;
  consentReview: boolean;
  moderationStatus: ModerationStatus;
  rejectReason: string;
  beforeUrl: string;
  currentUrl: string;
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  timeline: TimelineShot[];
};

export type GalleryFilters = {
  color: "all" | ColorGroup;
  size: "all" | GallerySize;
  location: "all" | GalleryLocation;
  sessions: "all" | SessionBand;
  status: "all" | ProgressStatus;
};

export const EMPTY_FILTERS: GalleryFilters = {
  color: "all",
  size: "all",
  location: "all",
  sessions: "all",
  status: "all",
};

export const LOCATION_LABEL: Record<GalleryLocation, string> = {
  arm: "Arm",
  hand: "Hand",
  leg: "Bein",
  shoulder: "Schulter",
  back: "Rücken",
  chest: "Brust",
  neck: "Hals",
  other: "Sonstige",
};

export const SIZE_LABEL: Record<GallerySize, string> = {
  s: "Klein",
  m: "Mittel",
  l: "Groß",
};

export const COLOR_LABEL: Record<ColorGroup, string> = {
  black: "Schwarz",
  grey: "Schwarz/Grau",
  color: "Bunt",
  red: "Rot",
  blue: "Blau",
  green: "Grün",
};

export const STATUS_LABEL: Record<ProgressStatus, string> = {
  treating: "In Behandlung",
  faded: "Deutlich aufgehellt",
  done: "Behandlung abgeschlossen",
};

export const MOD_LABEL: Record<ModerationStatus, string> = {
  draft: "Entwurf",
  submitted: "Eingereicht",
  review: "In Prüfung",
  published: "Veröffentlicht",
  rejected: "Abgelehnt",
};

export const GALLERY_COLORS = [
  "Schwarz",
  "Grau",
  "Rot",
  "Blau",
  "Grün",
  "Gelb",
  "Orange",
  "Violett",
  "andere",
] as const;

export function colorGroupFrom(colors: string[]): ColorGroup {
  const set = new Set(colors.map((c) => c.toLowerCase()));
  const has = (n: string) => [...set].some((c) => c.includes(n));
  const chromatic = ["rot", "blau", "grün", "gruen", "gelb", "orange", "violett", "bunt"];
  const chromaCount = chromatic.filter((n) => has(n)).length;
  if (chromaCount >= 2 || has("bunt")) return "color";
  if (has("rot")) return "red";
  if (has("blau")) return "blue";
  if (has("grün") || has("gruen")) return "green";
  if (has("grau") || (has("schwarz") && colors.length > 1)) return "grey";
  return "black";
}

export function sessionBand(n: number): SessionBand {
  if (n <= 3) return "1-3";
  if (n <= 6) return "4-6";
  if (n <= 10) return "7-10";
  return "10+";
}

export function matchesFilters(r: GalleryResult, f: GalleryFilters) {
  if (f.color !== "all" && r.colorGroup !== f.color) return false;
  if (f.size !== "all" && r.sizeKey !== f.size) return false;
  if (f.location !== "all" && r.bodyLocation !== f.location) return false;
  if (f.sessions !== "all" && sessionBand(r.sessionCount) !== f.sessions) return false;
  if (f.status !== "all" && r.progressStatus !== f.status) return false;
  return true;
}

export const FILTER_COLOR: { id: GalleryFilters["color"]; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "black", label: "Schwarz" },
  { id: "grey", label: "Schwarz/Grau" },
  { id: "color", label: "Bunt" },
  { id: "red", label: "Rot" },
  { id: "blue", label: "Blau" },
  { id: "green", label: "Grün" },
];

export const FILTER_SIZE: { id: GalleryFilters["size"]; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "s", label: "Klein" },
  { id: "m", label: "Mittel" },
  { id: "l", label: "Groß" },
];

export const FILTER_LOCATION: { id: GalleryFilters["location"]; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "arm", label: "Arm" },
  { id: "hand", label: "Hand" },
  { id: "leg", label: "Bein" },
  { id: "shoulder", label: "Schulter" },
  { id: "back", label: "Rücken" },
  { id: "chest", label: "Brust" },
  { id: "neck", label: "Hals" },
  { id: "other", label: "Sonstige" },
];

export const FILTER_SESSIONS: { id: GalleryFilters["sessions"]; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "1-3", label: "1–3" },
  { id: "4-6", label: "4–6" },
  { id: "7-10", label: "7–10" },
  { id: "10+", label: "10+" },
];

export const FILTER_STATUS: { id: GalleryFilters["status"]; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "treating", label: "In Behandlung" },
  { id: "faded", label: "Deutlich aufgehellt" },
  { id: "done", label: "Abgeschlossen" },
];

export function shotLabel(s: TimelineShot) {
  if (s.sessionNumber <= 0) return s.caption || "Start";
  return s.caption || `Sitzung ${s.sessionNumber}`;
}
