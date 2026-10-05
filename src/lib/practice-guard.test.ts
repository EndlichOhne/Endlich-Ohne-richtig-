import assert from "node:assert/strict";
import test from "node:test";
import {
  canCallAdmin,
  canManageMember,
  canMutateAppointment,
  canReadAppointment,
  effectiveRole,
  hashPracticeCode,
  lastAdminBlocks,
  lastLocationBlocks,
  rateLimitAllows,
  sessionUsable,
  skuAmountOk,
  verifyPracticeCode,
} from "./practice-guard.ts";

test("practice code hashes and does not compare equal to plaintext", () => {
  const { salt, hash } = hashPracticeCode("KARLSRUHE01");
  assert.notEqual(hash, "KARLSRUHE01");
  assert.equal(verifyPracticeCode("KARLSRUHE01", salt, hash), true);
  assert.equal(verifyPracticeCode("falsch", salt, hash), false);
});

test("attack matrix policy", () => {
  const matrix: { id: string; pass: boolean }[] = [
    { id: "A01", pass: canCallAdmin("staff") === false },
    { id: "A02", pass: canCallAdmin("doctor") === false },
    {
      id: "A03",
      pass:
        canReadAppointment({
          actorUserId: "user-a",
          actorRole: null,
          actorLocationId: null,
          customerUserId: "user-b",
          locationId: "loc-karlsruhe",
        }) === false,
    },
    {
      id: "A04",
      pass:
        canReadAppointment({
          actorUserId: "staff-1",
          actorRole: "staff",
          actorLocationId: "loc-a",
          customerUserId: "user-b",
          locationId: "loc-b",
        }) === false,
    },
    {
      id: "A05",
      pass:
        canManageMember({
          actorRole: "admin",
          actorLocationId: "loc-a",
          memberLocationId: "loc-b",
        }) === false,
    },
    {
      id: "A06",
      pass:
        canMutateAppointment({
          actorRole: "doctor",
          actorLocationId: "loc-a",
          locationId: "loc-b",
        }) === false,
    },
    {
      id: "A07",
      pass:
        canReadAppointment({
          actorUserId: "staff-1",
          actorRole: "staff",
          actorLocationId: "loc-a",
          customerUserId: "user-b",
          locationId: "loc-b",
        }) === false,
    },
    {
      id: "A08",
      pass:
        canMutateAppointment({
          actorRole: "staff",
          actorLocationId: "loc-a",
          locationId: "loc-b",
        }) === false,
    },
    { id: "A09", pass: skuAmountOk(50, 1) === false },
    { id: "A10", pass: skuAmountOk(399, 399) === true },
    {
      id: "A11",
      pass:
        sessionUsable({
          revoked: false,
          expired: false,
          membershipActive: true,
          locationActive: true,
          sessionCodeVersion: 1,
          membershipCodeVersion: 2,
        }) === false,
    },
    {
      id: "A12",
      pass:
        sessionUsable({
          revoked: false,
          expired: false,
          membershipActive: false,
          locationActive: true,
          sessionCodeVersion: 1,
          membershipCodeVersion: 1,
        }) === false,
    },
    {
      id: "A13",
      pass:
        sessionUsable({
          revoked: false,
          expired: false,
          membershipActive: true,
          locationActive: false,
          sessionCodeVersion: 1,
          membershipCodeVersion: 1,
        }) === false,
    },
    {
      id: "A14",
      pass:
        sessionUsable({
          revoked: false,
          expired: true,
          membershipActive: true,
          locationActive: true,
          sessionCodeVersion: 1,
          membershipCodeVersion: 1,
        }) === false,
    },
    { id: "A15", pass: rateLimitAllows(5) === false && rateLimitAllows(4) === true },
    { id: "A16", pass: effectiveRole("staff", "admin") === "staff" },
    { id: "A17", pass: effectiveRole("doctor", "admin") === "doctor" },
    {
      id: "A18",
      pass: canCallAdmin(effectiveRole("staff", "admin")) === false,
    },
    {
      id: "A19",
      pass:
        lastAdminBlocks({
          activeAdmins: 1,
          targetIsActiveAdmin: true,
          nextActive: false,
        }) === true,
    },
    {
      id: "A20",
      pass:
        lastLocationBlocks({
          activeLocations: 1,
          targetActive: true,
          nextActive: false,
        }) === true,
    },
    {
      id: "A21",
      pass:
        sessionUsable({
          revoked: true,
          expired: false,
          membershipActive: true,
          locationActive: true,
          sessionCodeVersion: 2,
          membershipCodeVersion: 2,
        }) === false,
    },
    {
      id: "A22",
      pass:
        sessionUsable({
          revoked: false,
          expired: false,
          membershipActive: false,
          locationActive: true,
          sessionCodeVersion: 1,
          membershipCodeVersion: 1,
        }) === false &&
        canReadAppointment({
          actorUserId: "staff-1",
          actorRole: "staff",
          actorLocationId: "loc-b",
          customerUserId: "user-b",
          locationId: "loc-a",
        }) === false,
    },
  ];
  const failed = matrix.filter((row) => !row.pass).map((row) => row.id);
  assert.deepEqual(failed, []);
});
