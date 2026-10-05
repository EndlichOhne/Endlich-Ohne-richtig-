import assert from "node:assert/strict";
import test from "node:test";
import { depositIdempotencyKey, proIdempotencyKey } from "./checkout-key.ts";

test("the same deposit intent keeps one Stripe key", () => {
  const input = { sizeId: "m", locationSlug: "karlsruhe", date: "2026-10-20", method: "card" };
  assert.equal(depositIdempotencyKey("user-a", input), depositIdempotencyKey("user-a", input));
});

test("a different account does not share the deposit key", () => {
  const input = { sizeId: "m", locationSlug: "karlsruhe", date: "2026-10-20", method: "card" };
  assert.notEqual(depositIdempotencyKey("user-a", input), depositIdempotencyKey("user-b", input));
});

test("the pro key does not change between two clicks", () => {
  assert.equal(proIdempotencyKey("user-a", "month"), proIdempotencyKey("user-a", "month"));
  assert.notEqual(proIdempotencyKey("user-a", "month"), proIdempotencyKey("user-a", "year"));
});
