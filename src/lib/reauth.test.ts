import assert from "node:assert/strict";
import test from "node:test";
import { canCallAdmin, effectiveRole, sessionUsable } from "./practice-guard.ts";
import { accountStillValid, practiceSessionValid, YEAR_MS, PRACTICE_SESSION_MS } from "./reauth.ts";

const login = Date.parse("2026-09-24T08:00:00.000Z");

test("A04 account session before 12 months stays valid", () => {
  const justBefore = login + YEAR_MS - 1;
  assert.equal(accountStillValid(login, justBefore), true);
});

test("A05 account session at 12 months requires reauthentication", () => {
  assert.equal(accountStillValid(login, login + YEAR_MS), false);
  assert.equal(accountStillValid(login, Date.parse("2027-09-24T08:00:00.000Z")), false);
});

test("A06 a new authentication starts another 12 months", () => {
  const renewed = Date.parse("2027-09-24T09:00:00.000Z");
  assert.equal(accountStillValid(renewed, renewed + YEAR_MS - 1), true);
});

test("A08 A09 A15 client role cannot become doctor or admin", () => {
  assert.equal(effectiveRole("staff", "doctor"), "staff");
  assert.equal(effectiveRole("staff", "admin"), "staff");
  assert.equal(canCallAdmin(effectiveRole("doctor", "admin")), false);
});

test("A11 doctor is not admin", () => {
  assert.equal(canCallAdmin("doctor"), false);
  assert.equal(canCallAdmin("admin"), true);
});

test("A12 A13 A14 inactive membership or location loses practice access", () => {
  assert.equal(
    sessionUsable({
      revoked: false,
      expired: false,
      membershipActive: false,
      locationActive: true,
      sessionCodeVersion: 1,
      membershipCodeVersion: 1,
    }),
    false,
  );
  assert.equal(
    sessionUsable({
      revoked: false,
      expired: false,
      membershipActive: true,
      locationActive: false,
      sessionCodeVersion: 1,
      membershipCodeVersion: 1,
    }),
    false,
  );
});

test("A16 other location is not the practice session location", () => {
  assert.equal(
    sessionUsable({
      revoked: false,
      expired: false,
      membershipActive: true,
      locationActive: true,
      sessionCodeVersion: 1,
      membershipCodeVersion: 2,
    }),
    false,
  );
});

test("A18 practice session ends when it expires or is revoked", () => {
  const start = login;
  assert.equal(practiceSessionValid(start + PRACTICE_SESSION_MS - 1, start), true);
  assert.equal(practiceSessionValid(start + PRACTICE_SESSION_MS, start + PRACTICE_SESSION_MS), false);
  assert.equal(
    sessionUsable({
      revoked: true,
      expired: false,
      membershipActive: true,
      locationActive: true,
      sessionCodeVersion: 1,
      membershipCodeVersion: 1,
    }),
    false,
  );
});
