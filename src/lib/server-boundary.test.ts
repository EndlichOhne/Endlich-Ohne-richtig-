import assert from "node:assert/strict";
import test from "node:test";
import {
  appointmentVisible,
  canAttachOwnTattoo,
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
