export type BoundaryRole = "admin" | "doctor" | "staff";

const ROLES: BoundaryRole[] = ["admin", "doctor", "staff"];

/**
 * The signed-in user always comes from the server session.
 * A userId, role, or age flag in the body is never the identity.
 */
export function sessionActor(sessionUserId: string, body?: { userId?: unknown; role?: unknown } | null) {
  return {
    userId: sessionUserId,
    ignoredClientUserId: body?.userId != null && String(body.userId) !== sessionUserId,
    ignoredClientRole: body?.role != null,
  };
}

export type VerifiedPracticeAccess = {
  userId: string;
  membershipId: string;
  locationId: string;
  role: BoundaryRole;
  membershipActive: boolean;
  locationActive: boolean;
  mustRotate: boolean;
  revoked: boolean;
  expired: boolean;
  sessionCodeVersion: number;
  membershipCodeVersion: number;
};

/** Client claims never grant a role or a location. */
export function clientClaimsIgnored(body?: {
  userId?: unknown;
  role?: unknown;
  locationId?: unknown;
  memberId?: unknown;
  membershipId?: unknown;
  permissions?: unknown;
  age?: unknown;
  admin?: unknown;
  doctor?: unknown;
  staff?: unknown;
} | Record<string, unknown> | null) {
  return {
    userId: body?.userId,
    role: body?.role,
    locationId: body?.locationId,
    memberId: body?.memberId ?? body?.membershipId,
    permissions: body?.permissions,
    age: body?.age,
    admin: body?.admin,
    doctor: body?.doctor,
    staff: body?.staff,
  };
}

export function verifiedAccessUsable(access: VerifiedPracticeAccess | null): access is VerifiedPracticeAccess {
  if (!access) return false;
  if (!ROLES.includes(access.role)) return false;
  if (access.revoked || access.expired || access.mustRotate) return false;
  if (!access.membershipActive || !access.locationActive) return false;
  return access.sessionCodeVersion === access.membershipCodeVersion;
}

export function practiceAccessAllows(access: VerifiedPracticeAccess | null, allowedRoles: BoundaryRole[]) {
  if (!verifiedAccessUsable(access)) return false;
  return allowedRoles.includes(access.role);
}

/**
 * A requested location id is only a lookup key.
 * Access exists only when that exact location is the verified membership location.
 */
export function membershipCoversLocation(input: {
  membershipUserId: string;
  actorUserId: string;
  membershipLocationId: string;
  requestedLocationId: string;
  membershipActive: boolean;
  locationActive: boolean;
  membershipRole: BoundaryRole | null;
  allowedRoles: BoundaryRole[];
}) {
  if (input.membershipUserId !== input.actorUserId) return false;
  if (!input.membershipLocationId || input.membershipLocationId !== input.requestedLocationId) return false;
  if (!input.membershipActive || !input.locationActive) return false;
  if (!input.membershipRole || !input.allowedRoles.includes(input.membershipRole)) return false;
  return true;
}

export function decideAppointmentRead(input: {
  authenticatedUserId: string;
  verified: VerifiedPracticeAccess | null;
  appointment: { customerUserId: string; locationId: string };
  request?: Record<string, unknown> | null;
}) {
  clientClaimsIgnored(input.request);
  if (input.appointment.customerUserId === input.authenticatedUserId) return true;
  if (!practiceAccessAllows(input.verified, ["admin", "doctor", "staff"])) return false;
  return input.appointment.locationId === input.verified!.locationId;
}

export function decideAppointmentWrite(input: {
  verified: VerifiedPracticeAccess | null;
  appointmentLocationId: string;
  request?: Record<string, unknown> | null;
}) {
  clientClaimsIgnored(input.request);
  if (!practiceAccessAllows(input.verified, ["admin", "doctor", "staff"])) return false;
  return input.appointmentLocationId === input.verified!.locationId;
}

export function appointmentVisible(input: {
  actorUserId: string;
  actorRole: BoundaryRole | null;
  actorLocationId: string | null;
  customerUserId: string;
  locationId: string;
}) {
  if (input.actorUserId === input.customerUserId) return true;
  if (!input.actorRole || !input.actorLocationId) return false;
  return input.actorLocationId === input.locationId;
}

export function canAttachOwnTattoo(ownerUserId: string, actorUserId: string) {
  return ownerUserId === actorUserId;
}

/** Preview fulfillment without Stripe must not run on a production deploy. */
export function previewBillingAllowed(env: { stripeReady: boolean; vercelEnv?: string | null }) {
  if (env.stripeReady) return false;
  if (env.vercelEnv === "production") return false;
  return true;
}

export function accessFixture(
  patch: Partial<VerifiedPracticeAccess> & Pick<VerifiedPracticeAccess, "userId" | "locationId" | "role">,
): VerifiedPracticeAccess {
  return {
    membershipId: "mem-1",
    membershipActive: true,
    locationActive: true,
    mustRotate: false,
    revoked: false,
    expired: false,
    sessionCodeVersion: 1,
    membershipCodeVersion: 1,
    ...patch,
  };
}
