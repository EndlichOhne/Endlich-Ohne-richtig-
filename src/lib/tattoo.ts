import {
  HARD_COLORS,
  SIZE_LABEL,
  type CheckAnswers,
  type Size,
} from "@/lib/check";
import { SESSION_BANDS } from "@/lib/pricing";

export type ScoreBand = "easy" | "mid" | "hard";
export type Level = "low" | "mid" | "high";
export type SessionStatus = "geplant" | "ausstehend" | "erledigt";
export type TattooSource = "scan" | "check" | "manual";

export type TattooRecord = {
  id: string;
  name: string;
  kind: string;
  bodyLocation: string;
  sizeKey: string;
  widthCm: string;
  heightCm: string;
  colors: string[];
  originGuess: string;
  difficulty: number;
  sessionsLow: number;
  sessionsHigh: number;
  sessionCostLow: number;
  sessionCostHigh: number;
  intensity: Level;
  complexity: Level;
  colorLevel: Level;
  sizeLevel: Level;
  whyText: string;
  factors: string[];
  analysisJson: string;
  progress: number;
  journalWhy: string;
  source: TattooSource;
  createdAt: string;
  updatedAt: string;
};

export type TattooSession = {
  id: string;
  tattooId: string;
  title: string;
  date: string;
  notes: string;
  costCents?: number;
  studio: string;
  area: string;
  progress?: number;
  status: SessionStatus;
  createdAt: string;
};

export type TattooReminder = {
  id: string;
  tattooId?: string;
  title: string;
  dueDate: string;
  kind: string;
  done: boolean;
  createdAt: string;
};

export const BAND_LABEL: Record<ScoreBand, string> = {
  easy: "eher einfach",
  mid: "mittel",
  hard: "anspruchsvoll",
};

export const LEVEL_LABEL: Record<Level, string> = {
  low: "gering",
  mid: "mittel",
  high: "hoch",
};

export const SOURCE_LABEL: Record<TattooSource, string> = {
  scan: "KI-Scan",
  check: "Frage-Check",
  manual: "Manuell angelegt",
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  geplant: "Geplant",
  ausstehend: "Ausstehend",
  erledigt: "Erledigt",
};

export const REMINDER_KIND_LABEL: Record<string, string> = {
  sitzung: "Nächste Sitzung",
  foto: "Foto für Vergleich",
  fortschritt: "Fortschritt aktualisieren",
  studio: "Studio kontaktieren",
  notiz: "Eigene Notiz",
};

export function scoreBand(n: number): ScoreBand {
  if (n < 4) return "easy";
  if (n < 7) return "mid";
  return "hard";
}

export function clampScore(n: number) {
  return Math.round(Math.min(10, Math.max(1, n)) * 10) / 10;
}

export function newId(prefix: string) {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id.slice(0, 8)}`;
}

export function passportCode(id: string) {
  const tail = id.replace(/[^a-z0-9]/gi, "").slice(-3).toUpperCase() || "001";
  return `Tattoo #${tail}`;
}

export function dayGreeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 11) return "Guten Morgen";
  if (h >= 11 && h < 18) return "Guten Tag";
  if (h >= 18 && h < 22) return "Guten Abend";
  return "Willkommen zurück";
}

export function sizeDisplay(
  t: Pick<TattooRecord, "sizeKey" | "widthCm" | "heightCm">,
) {
  const dims = t.widthCm && t.heightCm ? `${t.widthCm} × ${t.heightCm} cm` : "";
  const key: Size | "" =
    t.sizeKey === "xs" || t.sizeKey === "s" || t.sizeKey === "m" || t.sizeKey === "l" || t.sizeKey === "xl"
      ? t.sizeKey
      : "";
  const label = key ? SIZE_LABEL[key] : "";
  if (dims && label) return `${label} (${dims})`;
  return dims || label || "—";
}

export function progressFromSessions(done: number, estimatedHigh: number) {
  if (done <= 0) return 0;
  const denom = Math.max(estimatedHigh, done, 1);
  return Math.min(95, Math.round((done / denom) * 100));
}

export function formatShortDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayIso(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}

export function isOverdue(dueDate: string, done: boolean) {
  if (done || !dueDate) return false;
  return dueDate < todayIso();
}

export function scoreFromCheck(a: CheckAnswers): Pick<
  TattooRecord,
  | "difficulty"
  | "sessionsLow"
  | "sessionsHigh"
  | "sessionCostLow"
  | "sessionCostHigh"
  | "intensity"
  | "complexity"
  | "colorLevel"
  | "sizeLevel"
  | "whyText"
  | "factors"
> {
  const factors: string[] = [];
  let low = 4;
  let high = 8;
  if (a.kind === "pmu" || a.kind === "microblading") {
    low = 2;
    high = 6;
    factors.push("PMU/Microblading sitzt oft flacher – Farben können trotzdem hartnäckig sein.");
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
    factors.push("Dunkle Pigmente sprechen oft besser an – ohne Garantie.");
  }
  if (a.origin === "pro") {
    factors.push("Professionelle Arbeit kann dichter und tiefer liegen.");
    high += 1;
  }
  low = Math.max(2, Math.min(low, 16));
  high = Math.max(low + 2, Math.min(high, 20));

  const band = SESSION_BANDS.find((b) => b.id === a.size) ?? SESSION_BANDS[2];
  const sessionLow = Math.round((band.totalCents / 100) * 0.75);
  const sessionHigh = Math.round((band.totalCents / 100) * 1.15);
  const difficulty = clampScore((low + high) / 2.4);
  const sizeLevel: Level =
    a.size === "xs" || a.size === "s" ? "low" : a.size === "l" || a.size === "xl" ? "high" : "mid";
  const colorLevel: Level =
    hard.length >= 2 ? "high" : hard.length === 1 || a.colors.length > 2 ? "mid" : "low";
  const intensity: Level = a.origin === "pro" ? "high" : "mid";
  const complexity: Level =
    scoreBand(difficulty) === "hard" ? "high" : scoreBand(difficulty) === "easy" ? "low" : "mid";

  return {
    difficulty,
    sessionsLow: low,
    sessionsHigh: high,
    sessionCostLow: sessionLow,
    sessionCostHigh: sessionHigh,
    intensity,
    complexity,
    colorLevel,
    sizeLevel,
    whyText: factors[0] ?? "Mehrere sichtbare Faktoren fließen in die Schätzung ein.",
    factors,
  };
}

export function costPlan(
  t: Pick<TattooRecord, "sessionsLow" | "sessionsHigh" | "sessionCostLow" | "sessionCostHigh">,
) {
  const midS = Math.round((t.sessionsLow + t.sessionsHigh) / 2);
  const midC = Math.round((t.sessionCostLow + t.sessionCostHigh) / 2);
  return {
    budget: {
      label: "Budget",
      sessions: t.sessionsLow,
      per: t.sessionCostLow,
      total: t.sessionsLow * t.sessionCostLow,
      hint: "Untere Spanne der Richtwerte.",
    },
    standard: {
      label: "Standard",
      sessions: midS,
      per: midC,
      total: midS * midC,
      hint: "Mittlere Spanne, oft als Orientierung genutzt.",
    },
    premium: {
      label: "Premium",
      sessions: t.sessionsHigh,
      per: t.sessionCostHigh,
      total: t.sessionsHigh * t.sessionCostHigh,
      hint: "Obere Spanne bei höherem Aufwand.",
    },
  } as const;
}

export const COST_DISCLAIMER =
  "Alle Beträge sind unverbindliche Schätzungen / Richtwerte, kein Angebot und keine Garantie.";
