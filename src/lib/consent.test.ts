import assert from "node:assert/strict";
import test from "node:test";
import {
  CONSENT_VERSION,
  EMPTY_CONSENT,
  acceptRequiredRecord,
  explicitConsentReady,
  normalizeConsent,
  requiredOk,
} from "./consent.ts";

test("plain accept does not set age18", () => {
  const next = acceptRequiredRecord(EMPTY_CONSENT);
  assert.equal(next.age18, false);
  assert.equal(next.agb, false);
  assert.equal(next.privacy, false);
  assert.equal(next.medical, false);
  assert.equal(requiredOk(next), false);
  assert.equal(next.version, "endlich-ohne-5");
});

test("AGB, privacy and medical without 18+ do not open the app", () => {
  const next = acceptRequiredRecord(EMPTY_CONSENT, {
    agb: true,
    privacy: true,
    medical: true,
  });
  assert.equal(next.age18, false);
  assert.equal(next.acceptedAt, null);
  assert.equal(requiredOk(next), false);
});

test("explicit 18+ together with the three notices opens the app", () => {
  const next = acceptRequiredRecord(
    EMPTY_CONSENT,
    { agb: true, privacy: true, medical: true, age18: true },
    "2026-10-05T09:00:00.000Z",
  );
  assert.equal(requiredOk(next), true);
  assert.equal(next.acceptedAt, "2026-10-05T09:00:00.000Z");
  assert.equal(next.version, CONSENT_VERSION);
});

test("a normal click is not an explicit confirmation", () => {
  assert.equal(
    explicitConsentReady({ agb: true, privacy: true, medical: true, age18: false }),
    false,
  );
  assert.equal(
    explicitConsentReady({ agb: false, privacy: false, medical: false, age18: false }),
    false,
  );
});

test("a new consent version drops a previous 18+ flag", () => {
  const next = normalizeConsent({
    version: "endlich-ohne-4",
    age18: true,
    agb: true,
    privacy: true,
    medical: true,
    acceptedAt: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(next.age18, false);
  assert.equal(next.version, CONSENT_VERSION);
  assert.equal(requiredOk(next), false);
});

test("the current consent version keeps an explicit 18+ confirmation", () => {
  const next = normalizeConsent({
    ...EMPTY_CONSENT,
    agb: true,
    privacy: true,
    medical: true,
    age18: true,
    acceptedAt: "2026-10-05T09:00:00.000Z",
  });
  assert.equal(requiredOk(next), true);
});
