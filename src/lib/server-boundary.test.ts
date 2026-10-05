import assert from "node:assert/strict";
import test from "node:test";
import {
  accessFixture,
  appointmentVisible,
  canAttachOwnTattoo,
  decideAppointmentRead,
  decideAppointmentWrite,
  membershipCoversLocation,
  practiceAccessAllows,
  previewBillingAllowed,
  sessionActor,
} from "./server-boundary.ts";

test("a client userId cannot replace the session user", () => {
  const actor = sessionActor("user-a", { userId: "user-b", role: "admin" });
  assert.equal(actor.userId, "user-a");
  assert.equal(actor.ignoredClientUserId, true);
  assert.equal(actor.ignoredClientRole, true);
});

test("user A cannot read user B's appointment", () => {
  assert.equal(
    appointmentVisible({
      actorUserId: "user-a",
      actorRole: null,
      actorLocationId: null,
      customerUserId: "user-b",
      locationId: "loc-b",
    }),
    false,
  );
});

test("a practice session at location A cannot read location B", () => {
  assert.equal(
    appointmentVisible({
      actorUserId: "doctor-1",
      actorRole: "doctor",
      actorLocationId: "loc-a",
      customerUserId: "user-b",
      locationId: "loc-b",
    }),
    false,
  );
});

test("a normal user cannot read practice appointments of others", () => {
  assert.equal(
    appointmentVisible({
      actorUserId: "user-a",
      actorRole: null,
      actorLocationId: "loc-a",
      customerUserId: "user-b",
      locationId: "loc-a",
    }),
    false,
  );
});

test("a doctor without a membership cannot read practice appointments", () => {
  assert.equal(
    appointmentVisible({
      actorUserId: "doctor-1",
      actorRole: null,
      actorLocationId: null,
      customerUserId: "user-b",
      locationId: "loc-a",
    }),
    false,
  );
});

test("a manipulated locationId does not grant access without that membership", () => {
  assert.equal(
    appointmentVisible({
      actorUserId: "doctor-1",
      actorRole: "doctor",
      actorLocationId: "loc-a",
      customerUserId: "user-b",
      locationId: "loc-claimed",
    }),
    false,
  );
});

test("the customer can still read their own appointment", () => {
  assert.equal(
    appointmentVisible({
      actorUserId: "user-a",
      actorRole: null,
      actorLocationId: null,
      customerUserId: "user-a",
      locationId: "loc-a",
    }),
    true,
  );
});

test("a reminder can only be attached to the actor's tattoo", () => {
  assert.equal(canAttachOwnTattoo("user-a", "user-a"), true);
  assert.equal(canAttachOwnTattoo("user-b", "user-a"), false);
});

test("preview billing is refused when Stripe is configured or the deploy is production", () => {
  assert.equal(previewBillingAllowed({ stripeReady: true, vercelEnv: "preview" }), false);
  assert.equal(previewBillingAllowed({ stripeReady: false, vercelEnv: "production" }), false);
  assert.equal(previewBillingAllowed({ stripeReady: false, vercelEnv: "preview" }), true);
});

test("A doctor at location A can read an appointment at location A", () => {
  const verified = accessFixture({ userId: "doctor-a", locationId: "loc-a", role: "doctor" });
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "doctor-a",
      verified,
      appointment: { customerUserId: "customer-b", locationId: "loc-a" },
      request: { locationId: "loc-b", role: "admin" },
    }),
    true,
  );
});

test("B doctor at location A cannot read an appointment at location B", () => {
  const verified = accessFixture({ userId: "doctor-a", locationId: "loc-a", role: "doctor" });
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "doctor-a",
      verified,
      appointment: { customerUserId: "customer-b", locationId: "loc-b" },
      request: { locationId: "loc-a" },
    }),
    false,
  );
});

test("C a doctor without a membership cannot open practice data", () => {
  assert.equal(practiceAccessAllows(null, ["doctor", "staff", "admin"]), false);
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "doctor-a",
      verified: null,
      appointment: { customerUserId: "customer-b", locationId: "loc-a" },
    }),
    false,
  );
});

test("D a disabled membership loses access", () => {
  const verified = accessFixture({
    userId: "doctor-a",
    locationId: "loc-a",
    role: "doctor",
    membershipActive: false,
  });
  assert.equal(practiceAccessAllows(verified, ["doctor"]), false);
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "doctor-a",
      verified,
      appointment: { customerUserId: "customer-b", locationId: "loc-a" },
    }),
    false,
  );
});

test("E a request locationId for B does not grant location B", () => {
  assert.equal(
    membershipCoversLocation({
      membershipUserId: "doctor-a",
      actorUserId: "doctor-a",
      membershipLocationId: "loc-a",
      requestedLocationId: "loc-b",
      membershipActive: true,
      locationActive: true,
      membershipRole: "doctor",
      allowedRoles: ["doctor", "admin", "staff"],
    }),
    false,
  );
  const verified = accessFixture({ userId: "doctor-a", locationId: "loc-a", role: "doctor" });
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "doctor-a",
      verified,
      appointment: { customerUserId: "customer-b", locationId: "loc-b" },
      request: { locationId: "loc-b", role: "doctor" },
    }),
    false,
  );
});

test("F a claimed admin role does not escalate a doctor", () => {
  const verified = accessFixture({ userId: "doctor-a", locationId: "loc-a", role: "doctor" });
  assert.equal(practiceAccessAllows(verified, ["admin"]), false);
  assert.equal(
    decideAppointmentWrite({
      verified,
      appointmentLocationId: "loc-b",
      request: { role: "admin", locationId: "loc-b" },
    }),
    false,
  );
});

test("G customer A cannot read customer B's appointment", () => {
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "customer-a",
      verified: null,
      appointment: { customerUserId: "customer-b", locationId: "loc-a" },
      request: { userId: "customer-b", role: "admin", locationId: "loc-a" },
    }),
    false,
  );
});

test("H customer A can read their own appointment", () => {
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "customer-a",
      verified: null,
      appointment: { customerUserId: "customer-a", locationId: "loc-b" },
      request: { userId: "customer-b", role: "staff", locationId: "loc-a" },
    }),
    true,
  );
});

test("I a disabled location invalidates the practice session", () => {
  const verified = accessFixture({
    userId: "doctor-a",
    locationId: "loc-a",
    role: "doctor",
    locationActive: false,
  });
  assert.equal(practiceAccessAllows(verified, ["doctor", "admin", "staff"]), false);
});

test("J a disabled membership invalidates the practice session", () => {
  const verified = accessFixture({
    userId: "doctor-a",
    locationId: "loc-a",
    role: "staff",
    membershipActive: false,
  });
  assert.equal(practiceAccessAllows(verified, ["staff"]), false);
});

test("K a rotated practice code invalidates the old session", () => {
  const verified = accessFixture({
    userId: "doctor-a",
    locationId: "loc-a",
    role: "doctor",
    sessionCodeVersion: 1,
    membershipCodeVersion: 2,
  });
  assert.equal(practiceAccessAllows(verified, ["doctor"]), false);
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "doctor-a",
      verified,
      appointment: { customerUserId: "customer-b", locationId: "loc-a" },
    }),
    false,
  );
});
