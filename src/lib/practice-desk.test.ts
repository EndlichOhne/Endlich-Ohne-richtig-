import assert from "node:assert/strict";
import test from "node:test";
import {
  accessFixture,
  decideAppointmentRead,
  decideAppointmentWrite,
  practiceAccessAllows,
  verifiedAccessUsable,
} from "./server-boundary.ts";
import {
  applyManualPayment,
  canAdvanceStatus,
  roleAllowsAction,
} from "./practice-desk.ts";

test("a customer without a practice session cannot open the desk", () => {
  assert.equal(practiceAccessAllows(null, ["admin", "doctor", "staff"]), false);
});

test("a doctor can open their own location", () => {
  const doctor = accessFixture({ userId: "doc", locationId: "loc-a", role: "doctor" });
  assert.equal(practiceAccessAllows(doctor, ["doctor", "staff", "admin"]), true);
  assert.equal(
    decideAppointmentWrite({
      verified: doctor,
      appointmentLocationId: "loc-a",
      request: { role: "admin", locationId: "loc-b" },
    }),
    true,
  );
});

test("a doctor cannot open another location", () => {
  const doctor = accessFixture({ userId: "doc", locationId: "loc-a", role: "doctor" });
  assert.equal(
    decideAppointmentWrite({
      verified: doctor,
      appointmentLocationId: "loc-b",
      request: { locationId: "loc-a", role: "doctor" },
    }),
    false,
  );
});

test("staff does not receive admin or doctor actions", () => {
  assert.equal(roleAllowsAction("staff", "admin"), false);
  assert.equal(roleAllowsAction("staff", "start"), false);
  assert.equal(roleAllowsAction("staff", "complete"), false);
  assert.equal(roleAllowsAction("staff", "note"), false);
  assert.equal(roleAllowsAction("staff", "arrive"), true);
  assert.equal(roleAllowsAction("doctor", "admin"), false);
  assert.equal(roleAllowsAction("doctor", "start"), true);
  assert.equal(roleAllowsAction("admin", "admin"), true);
});

test("a disabled membership and an expired practice session are rejected", () => {
  const disabled = accessFixture({
    userId: "doc",
    locationId: "loc-a",
    role: "doctor",
    membershipActive: false,
  });
  const expired = accessFixture({
    userId: "doc",
    locationId: "loc-a",
    role: "doctor",
    expired: true,
  });
  assert.equal(verifiedAccessUsable(disabled), false);
  assert.equal(practiceAccessAllows(expired, ["doctor"]), false);
});

test("an appointment status can only move along the treatment path", () => {
  assert.equal(canAdvanceStatus("planned", "confirmed"), true);
  assert.equal(canAdvanceStatus("confirmed", "arrived"), true);
  assert.equal(canAdvanceStatus("arrived", "in_progress"), true);
  assert.equal(canAdvanceStatus("in_progress", "completed"), true);
  assert.equal(canAdvanceStatus("planned", "completed"), false);
  assert.equal(canAdvanceStatus("completed", "planned"), false);
  assert.equal(canAdvanceStatus("cancelled", "confirmed"), false);
});

test("a client payment status cannot mark an appointment paid", () => {
  const denied = applyManualPayment({
    depositCents: 0,
    restCents: 0,
    paidCents: 0,
    addCents: 100,
    method: "cash",
    claimedStatus: "PAID",
  });
  assert.equal(denied.ok, false);
  const stripe = applyManualPayment({
    depositCents: 2500,
    restCents: 7500,
    paidCents: 0,
    addCents: 2500,
    method: "stripe",
    claimedStatus: "PAID",
  });
  assert.equal(stripe.ok, false);
  const paid = applyManualPayment({
    depositCents: 2500,
    restCents: 0,
    paidCents: 0,
    addCents: 2500,
    method: "cash",
    claimedStatus: "OPEN",
  });
  assert.equal(paid.ok, true);
  if (paid.ok) assert.equal(paid.status, "PAID");
});

test("customer A cannot read customer B through a claimed practice role", () => {
  assert.equal(
    decideAppointmentRead({
      authenticatedUserId: "customer-a",
      verified: null,
      appointment: { customerUserId: "customer-b", locationId: "loc-a" },
      request: { role: "admin", locationId: "loc-a", userId: "customer-b" },
    }),
    false,
  );
});
