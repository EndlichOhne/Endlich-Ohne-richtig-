export const FREE_LIMITS = {
  tattoos: 2,
  scansPerMonth: 0,
  chatsPerMonth: 8,
  photosPerTattoo: 10,
} as const;

export type Usage = {
  scans: number;
  chats: number;
  tattooCount: number;
  isPro: boolean;
  scanCredits?: number;
};

export function canScan(u: Usage) {
  if (u.isPro) return { ok: true as const };
  if ((u.scanCredits ?? 0) > 0) return { ok: true as const };
  return { ok: false as const, reason: "paywall" as const };
}

export function canChat(u: Usage) {
  if (u.isPro) return { ok: true as const };
  if (u.chats >= FREE_LIMITS.chatsPerMonth) {
    return { ok: false as const, reason: "chat" as const };
  }
  return { ok: true as const };
}

export function canAddTattoo(u: Usage) {
  if (u.isPro) return { ok: true as const };
  if (u.tattooCount >= FREE_LIMITS.tattoos) {
    return { ok: false as const, reason: "tattoo" as const };
  }
  return { ok: true as const };
}

export const LIMIT_HINT = {
  scan: "Für einen Online-KI-Scan brauchst du PRO oder einen Einzel-Scan (0,50 €).",
  paywall: "Für einen Online-KI-Scan brauchst du PRO oder einen Einzel-Scan (0,50 €).",
  chat: `Kostenlose KI-Fragen für diesen Monat sind aufgebraucht (${FREE_LIMITS.chatsPerMonth}).`,
  tattoo: `Im kostenlosen Plan sind ${FREE_LIMITS.tattoos} Tattoos möglich.`,
  photo: `Maximal ${FREE_LIMITS.photosPerTattoo} Fotos pro Tattoo im Free-Plan.`,
} as const;

export function isLimitError(msg: string) {
  return /aufgebraucht|Free-Limit|nicht möglich|Maximal \d+ Fotos|kostenlose Test|Einzel-Scan|PRO oder/i.test(
    msg,
  );
}
