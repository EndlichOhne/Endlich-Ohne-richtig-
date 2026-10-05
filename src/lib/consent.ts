export const CONSENT_VERSION = "endlich-ohne-5";
export const CONSENT_KEY = "eo-consent";

export type ConsentRecord = {
  version: string;
  acceptedAt: string | null;
  agb: boolean;
  privacy: boolean;
  medical: boolean;
  age18: boolean;
  location: boolean;
  notifications: boolean;
  personalized: boolean;
  onboardingDone: boolean;
};

export const EMPTY_CONSENT: ConsentRecord = {
  version: CONSENT_VERSION,
  acceptedAt: null,
  agb: false,
  privacy: false,
  medical: false,
  age18: false,
  location: false,
  notifications: false,
  personalized: false,
  onboardingDone: false,
};

export function requiredOk(c: ConsentRecord): boolean {
  return c.agb === true && c.privacy === true && c.medical === true && c.age18 === true && c.version === CONSENT_VERSION;
}

/** All four boxes must be explicitly true. A plain click is not enough. */
export function explicitConsentReady(flags: {
  agb: boolean;
  privacy: boolean;
  medical: boolean;
  age18: boolean;
}): boolean {
  return flags.agb === true && flags.privacy === true && flags.medical === true && flags.age18 === true;
}

/**
 * Merge a consent attempt. Does not invent age18, AGB, privacy, or the medical notice.
 * Entry is stored only when each of those four was already true or passed as true.
 */
export function acceptRequiredRecord(
  current: ConsentRecord,
  extras?: Partial<ConsentRecord>,
  now = new Date().toISOString(),
): ConsentRecord {
  const next: ConsentRecord = {
    ...current,
    ...extras,
    version: CONSENT_VERSION,
  };
  if (!explicitConsentReady(next)) {
    return {
      ...next,
      acceptedAt: null,
    };
  }
  return {
    ...next,
    agb: true,
    privacy: true,
    medical: true,
    age18: true,
    onboardingDone: true,
    acceptedAt: now,
  };
}

export function normalizeConsent(parsed: unknown): ConsentRecord {
  if (!parsed || typeof parsed !== "object") return { ...EMPTY_CONSENT };
  const record = parsed as Partial<ConsentRecord>;
  if (record.version !== CONSENT_VERSION) return { ...EMPTY_CONSENT };
  return {
    ...EMPTY_CONSENT,
    ...record,
    version: CONSENT_VERSION,
    agb: record.agb === true,
    privacy: record.privacy === true,
    medical: record.medical === true,
    age18: record.age18 === true,
    location: record.location === true,
    notifications: record.notifications === true,
    personalized: record.personalized === true,
    onboardingDone: record.onboardingDone === true,
    acceptedAt: typeof record.acceptedAt === "string" ? record.acceptedAt : null,
  };
}

export function loadConsent(): ConsentRecord {
  if (typeof window === "undefined") return EMPTY_CONSENT;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return EMPTY_CONSENT;
    const parsed = JSON.parse(raw) as unknown;
    return normalizeConsent(parsed);
  } catch {
    return EMPTY_CONSENT;
  }
}

export function saveConsent(record: ConsentRecord) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* private mode / blocked storage – still allow this session */
  }
}

export function clearLocalAppData() {
  const keys = [
    "eo-consent",
    "eo-check",
    "eo-planner",
    "eo-payments",
    "eo-ai-chat",
    "eo-pro-teaser",
    "eo-email-ok",
  ];
  keys.forEach((key) => localStorage.removeItem(key));
  void import("@/lib/tattoo-photos").then((m) => m.clearAllPhotos());
}
