import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { PlanItem } from "@/lib/planner";
import { assertDepositPaidForUser } from "@/lib/checkout";
import type { Payment } from "@/lib/payments";

export const listPlanItems = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      title: string;
      date: string;
      note: string;
      payment_id: string | null;
      deposit_cents: number | null;
      rest_cents: number | null;
      total_cents: number | null;
    }>`
      select id, title, date, note, payment_id, deposit_cents, rest_cents, total_cents
      from plan_items
      where user_id = ${context.userId}
      order by date asc, created_at asc
    `;
    return rows.map(
      (r): PlanItem => ({
        id: r.id,
        title: r.title,
        date: r.date,
        note: r.note,
        paymentId: r.payment_id ?? undefined,
        depositCents: r.deposit_cents ?? undefined,
        restCents: r.rest_cents ?? undefined,
        totalCents: r.total_cents ?? undefined,
      }),
    );
  });

export const replacePlanItems = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): PlanItem[] => {
    if (!Array.isArray(input)) throw new Error("Ungültiger Plan");
    return input.slice(0, 40).map((raw) => {
      const i = raw as PlanItem;
      return {
        id: String(i.id ?? "").slice(0, 80),
        title: String(i.title ?? "Termin").slice(0, 80),
        date: String(i.date ?? "").slice(0, 32),
        note: String(i.note ?? "").slice(0, 280),
        paymentId: i.paymentId ? String(i.paymentId).slice(0, 80) : undefined,
        depositCents: typeof i.depositCents === "number" ? i.depositCents : undefined,
        restCents: typeof i.restCents === "number" ? i.restCents : undefined,
        totalCents: typeof i.totalCents === "number" ? i.totalCents : undefined,
      };
    });
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from plan_items where user_id = ${context.userId}`;
    for (const item of data) {
      if (!item.id || !item.date) continue;
      await sql`
        insert into plan_items (
          id, user_id, title, date, note, payment_id, deposit_cents, rest_cents, total_cents
        ) values (
          ${item.id}, ${context.userId}, ${item.title}, ${item.date}, ${item.note},
          ${item.paymentId ?? null}, ${item.depositCents ?? null},
          ${item.restCents ?? null}, ${item.totalCents ?? null}
        )
      `;
    }
    return { ok: true as const };
  });

export const listReceipts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      created_at: string;
      size_id: string;
      size_label: string;
      location_slug: string | null;
      location_name: string | null;
      date: string;
      total_cents: number;
      deposit_cents: number;
      rest_cents: number;
      method: string;
      method_label: string;
      status: string;
      provider: string;
      stripe_mode: string;
      last4: string | null;
      card_brand: string | null;
      email_masked: string | null;
    }>`
      select * from payment_receipts
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map(
      (r): Payment => ({
        id: r.id,
        createdAt: r.created_at,
        sizeId: r.size_id,
        sizeLabel: r.size_label,
        locationSlug: r.location_slug,
        locationName: r.location_name,
        date: r.date,
        totalCents: r.total_cents,
        depositCents: r.deposit_cents,
        restCents: r.rest_cents,
        method: r.method as Payment["method"],
        methodLabel: r.method_label,
        status: r.status as Payment["status"],
        provider: "stripe",
        stripeMode: r.stripe_mode as Payment["stripeMode"],
        last4: r.last4 ?? undefined,
        cardBrand: r.card_brand ?? undefined,
        emailMasked: r.email_masked ?? undefined,
      }),
    );
  });

export const upsertReceipt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): Payment => {
    if (typeof input !== "object" || !input) throw new Error("Ungültiger Beleg");
    const p = input as Payment;
    if (!p.id || typeof p.depositCents !== "number") throw new Error("Ungültiger Beleg");
    return p;
  })
  .handler(async ({ context, data: p }) => {
    if (p.status === "paid") {
      const verified = await assertDepositPaidForUser(p.id, context.userId);
      p = {
        ...p,
        id: verified.id,
        depositCents: verified.depositCents,
        restCents: verified.restCents,
        totalCents: verified.totalCents,
        status: "paid",
        provider: "stripe",
        stripeMode: verified.mode,
      };
    }
    const sql = await getSql();
    await sql`
      insert into payment_receipts (
        id, user_id, created_at, size_id, size_label, location_slug, location_name,
        date, total_cents, deposit_cents, rest_cents, method, method_label, status,
        provider, stripe_mode, last4, card_brand, email_masked
      ) values (
        ${p.id}, ${context.userId}, ${p.createdAt}, ${p.sizeId}, ${p.sizeLabel},
        ${p.locationSlug}, ${p.locationName}, ${p.date}, ${p.totalCents},
        ${p.depositCents}, ${p.restCents}, ${p.method}, ${p.methodLabel}, ${p.status},
        ${p.provider}, ${p.stripeMode}, ${p.last4 ?? null}, ${p.cardBrand ?? null},
        ${p.emailMasked ?? null}
      )
      on conflict (id) do update set
        status = excluded.status,
        method_label = excluded.method_label
      where payment_receipts.user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from tattoo_sessions where user_id = ${context.userId}`;
    await sql`delete from tattoo_reminders where user_id = ${context.userId}`;
    await sql`delete from tattoos where user_id = ${context.userId}`;
    await sql`delete from ai_usage where user_id = ${context.userId}`;
    await sql`delete from email_confirms where user_id = ${context.userId}`;
    await sql`delete from pro_members where user_id = ${context.userId}`;
    await sql`delete from scan_credits where user_id = ${context.userId}`;
    await sql`delete from scan_credit_ledger where user_id = ${context.userId}`;
    await sql`delete from billing_tx where user_id = ${context.userId}`;
    await sql`delete from scan_runs where user_id = ${context.userId}`;
    await sql`delete from billing_claims where user_id = ${context.userId}`;
    await sql`delete from plan_items where user_id = ${context.userId}`;
    await sql`delete from payment_receipts where user_id = ${context.userId}`;
    await sql`delete from practice_sessions where user_id = ${context.userId}`;
    await sql`delete from practice_memberships where user_id = ${context.userId}`;
    await sql`delete from practice_code_attempts where user_id = ${context.userId}`;
    await sql`delete from practice_appointments where customer_user_id = ${context.userId}`;
    await sql`delete from practice_audit where actor_user_id = ${context.userId}`;
    await sql`delete from "session" where "userId" = ${context.userId}`;
    await sql`delete from "account" where "userId" = ${context.userId}`;
    await sql`delete from "user" where "id" = ${context.userId}`;
    return { ok: true as const };
  });
