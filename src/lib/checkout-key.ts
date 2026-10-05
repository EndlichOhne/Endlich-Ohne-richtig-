import { createHash } from "node:crypto";

/** Same booking intent keeps one Stripe key. A clock suffix would open a second charge. */
export function depositIdempotencyKey(
  userId: string,
  input: { sizeId: string; locationSlug: string; date: string; method: string },
) {
  const raw = `${userId}|${input.sizeId}|${input.locationSlug}|${input.date}|${input.method}`;
  return `eodep${createHash("sha256").update(raw).digest("hex").slice(0, 48)}`;
}

/** One open checkout per account and SKU. Stripe retains the key for 24 hours. */
export function proIdempotencyKey(userId: string, sku: string) {
  return `eopro${createHash("sha256").update(`${userId}|${sku}`).digest("hex").slice(0, 48)}`;
}
