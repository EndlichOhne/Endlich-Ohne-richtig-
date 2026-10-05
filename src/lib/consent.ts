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
  return c.agb && c.privacy && c.medical && c.age18 && c.version === CONSENT_VERSION;
}

export function loadConsent(): ConsentRecord {
  if (typeof window === "undefined") return EMPTY_CONSENT;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return EMPTY_CONSENT;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return { ...EMPTY_CONSENT };
    return { ...EMPTY_CONSENT, ...parsed };
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
