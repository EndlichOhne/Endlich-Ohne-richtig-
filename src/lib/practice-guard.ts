import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const PRACTICE_COOKIE = "eo_practice";
export const CODE_ATTEMPT_LIMIT = 5;
export const CODE_WINDOW_MS = 15 * 60 * 1000;
export const SESSION_MS = 180 * 24 * 60 * 60 * 1000;
export const ROLES = ["admin", "doctor", "staff"] as const;
export type PracticeRole = (typeof ROLES)[number];

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isPracticeRole(value: string): value is PracticeRole {
  return (ROLES as readonly string[]).includes(value);
}

export function hashPracticeCode(code: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(code.trim(), salt, 32).toString("hex");
  return { salt, hash };
}

export function verifyPracticeCode(code: string, salt: string, hash: string) {
  let prev: Buffer;
  try {
    prev = Buffer.from(hash, "hex");
  } catch {
    return false;
  }
  const next = scryptSync(code.trim(), salt, 32);
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

export function generatePracticeCode() {
  const bytes = randomBytes(12);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

export function rateLimitAllows(recentFailures: number) {
  return recentFailures < CODE_ATTEMPT_LIMIT;
}

export function canCallAdmin(role: PracticeRole | null) {
  return role === "admin";
}

/** Stored role always wins. A client-sent role is ignored. */
export function effectiveRole(stored: PracticeRole, _claimed?: string | null): PracticeRole {
  return stored;
}

export function canReadAppointment(input: {
  actorUserId: string;
  actorRole: PracticeRole | null;
  actorLocationId: string | null;
  customerUserId: string;
  locationId: string;
}) {
  if (input.actorUserId === input.customerUserId) return true;
  if (!input.actorRole || !input.actorLocationId) return false;
  return input.actorLocationId === input.locationId;
}

export function canMutateAppointment(input: {
  actorRole: PracticeRole | null;
  actorLocationId: string | null;
  locationId: string;
}) {
  if (!input.actorRole || !input.actorLocationId) return false;
  return input.actorLocationId === input.locationId;
}

export function canManageMember(input: {
  actorRole: PracticeRole | null;
  actorLocationId: string | null;
  memberLocationId: string;
}) {
  return input.actorRole === "admin" && input.actorLocationId === input.memberLocationId;
}

export function lastAdminBlocks(input: {
  activeAdmins: number;
  targetIsActiveAdmin: boolean;
  nextActive: boolean;
}) {
  if (!input.targetIsActiveAdmin || input.nextActive) return false;
  return input.activeAdmins <= 1;
}

export function lastLocationBlocks(input: {
  activeLocations: number;
  targetActive: boolean;
  nextActive: boolean;
}) {
  if (!input.targetActive || input.nextActive) return false;
  return input.activeLocations <= 1;
}

export function sessionUsable(input: {
  revoked: boolean;
  expired: boolean;
  membershipActive: boolean;
  locationActive: boolean;
  sessionCodeVersion: number;
  membershipCodeVersion: number;
}) {
  if (input.revoked || input.expired) return false;
  if (!input.membershipActive || !input.locationActive) return false;
  return input.sessionCodeVersion === input.membershipCodeVersion;
}

export function skuAmountOk(expectedCents: number, paidCents: number | null | undefined) {
  return typeof paidCents === "number" && Number.isFinite(paidCents) && paidCents === expectedCents;
}
