/** Twelve months, matching 24 September to 24 September in a non-leap span. */
export const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Privileged practice access. The normal account session can outlive this. */
export const PRACTICE_SESSION_MS = 8 * 60 * 60 * 1000;

export const REAUTH_MESSAGE = "Aus Sicherheitsgründen musst du dich erneut anmelden.";

export function accountStillValid(lastAuthenticatedAt: number, now: number) {
  return now < lastAuthenticatedAt + YEAR_MS;
}

export function practiceSessionValid(expiresAt: number, now: number) {
  return now < expiresAt;
}
