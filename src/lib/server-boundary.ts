export type BoundaryRole = "admin" | "doctor" | "staff";

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
