import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { skuCents, skuDays, type BillingSku } from "@/lib/pro";
import {
  endPro,
  getScanCredits,
  grantPro,
  grantScanCredit,
} from "@/lib/pro-api";

export type TxStatus = "paid" | "unpaid" | "refunded" | "canceled";
export type Fulfillment =
  | "pending"
  | "granted"
  | "consumed"
  | "refunded_unused"
  | "refunded_used";

export type BillingTx = {
  id: string;
  userId: string;
  sku: BillingSku;
  provider: string;
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  amountCents: number;
  status: TxStatus;
  fulfillment: Fulfillment;
  createdAt: string;
};

export type ScanRunStatus = "started" | "completed" | "failed_server" | "failed_photo";

type ClaimReason = "duplicate" | "accidental" | "scan_failed" | "other";

function nid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function stripeReady() {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && (key.startsWith("sk_") || key.startsWith("rk_")));
}

async function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const StripeSdk = (await import("stripe")).default;
  return new StripeSdk(key, { maxNetworkRetries: 2, typescript: true });
}

function asSku(v: string | null | undefined): BillingSku | null {
  return v === "scan" || v === "month" || v === "year" ? v : null;
}

function rowTx(r: {
  id: string;
  user_id: string;
  sku: string;
  provider: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  amount_cents: number;
  status: string;
  fulfillment: string;
  created_at: string;
}): BillingTx {
  return {
    id: r.id,
    userId: r.user_id,
    sku: asSku(r.sku) ?? "scan",
    provider: r.provider,
    stripeSessionId: r.stripe_session_id,
    stripePaymentIntent: r.stripe_payment_intent,
    amountCents: Number(r.amount_cents),
    status: r.status as TxStatus,
    fulfillment: r.fulfillment as Fulfillment,
    createdAt: String(r.created_at),
  };
}

export async function claimStripeEvent(id: string, type: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    insert into stripe_events (id, type)
    values (${id}, ${type})
    on conflict (id) do nothing
    returning id
  `;
  return Boolean(rows[0]);
}

export async function releaseStripeEvent(id: string) {
  const sql = await getSql();
  await sql`delete from stripe_events where id = ${id}`;
}

export async function upsertPaidTx(input: {
  userId: string;
  sku: BillingSku;
  provider?: string;
  sessionId?: string | null;
  paymentIntent?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  amountCents?: number;
}): Promise<BillingTx> {
  const sql = await getSql();
  const sessionId = input.sessionId || null;
  if (sessionId) {
    const existing = await sql<Parameters<typeof rowTx>[0]>`
      select id, user_id, sku, provider, stripe_session_id, stripe_payment_intent,
             amount_cents, status, fulfillment, created_at
      from billing_tx where stripe_session_id = ${sessionId} limit 1
    `;
    if (existing[0]) return rowTx(existing[0]);
  }
  if (input.paymentIntent) {
    const existing = await sql<Parameters<typeof rowTx>[0]>`
      select id, user_id, sku, provider, stripe_session_id, stripe_payment_intent,
             amount_cents, status, fulfillment, created_at
      from billing_tx where stripe_payment_intent = ${input.paymentIntent} limit 1
    `;
    if (existing[0]) return rowTx(existing[0]);
  }
  const id = sessionId ? `tx-${sessionId}` : nid("tx");
  const amount = input.amountCents ?? skuCents(input.sku);
  await sql`
    insert into billing_tx (
      id, user_id, sku, provider, stripe_session_id, stripe_payment_intent,
      stripe_subscription_id, stripe_customer_id, amount_cents, currency,
      status, fulfillment, created_at
    ) values (
      ${id}, ${input.userId}, ${input.sku}, ${input.provider ?? "stripe"},
      ${sessionId}, ${input.paymentIntent ?? null},
      ${input.subscriptionId ?? null}, ${input.customerId ?? null},
      ${amount}, 'eur', 'paid', 'pending', now()
    )
    on conflict (id) do nothing
  `;
  const rows = await sql<Parameters<typeof rowTx>[0]>`
    select id, user_id, sku, provider, stripe_session_id, stripe_payment_intent,
           amount_cents, status, fulfillment, created_at
    from billing_tx where id = ${id} limit 1
  `;
  return rowTx(rows[0]);
}

export async function fulfillTx(tx: BillingTx): Promise<"granted" | "already" | "skip"> {
  if (tx.status !== "paid") return "skip";
  if (tx.fulfillment === "granted" || tx.fulfillment === "consumed") return "already";
  if (tx.fulfillment === "refunded_unused" || tx.fulfillment === "refunded_used") return "skip";

  if (tx.sku === "scan") {
    await grantScanCredit(tx.userId, tx.provider === "preview" ? "preview" : "stripe", tx.stripeSessionId ?? undefined);
  } else {
    await grantPro(tx.userId, tx.provider === "preview" ? "preview" : "stripe", tx.stripeSessionId ?? undefined, {
      plan: tx.sku,
      days: skuDays(tx.sku),
      subscriptionId: null,
    });
  }
  const sql = await getSql();
  await sql`
    update billing_tx
    set fulfillment = 'granted', granted_at = now()
    where id = ${tx.id} and fulfillment = 'pending'
  `;
  return "granted";
}

export async function fulfillStripeSession(input: {
  userId: string;
  sku: BillingSku;
  sessionId: string;
  paymentIntent?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  amountCents?: number;
  expiresAt?: Date | string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const tx = await upsertPaidTx({
    userId: input.userId,
    sku: input.sku,
    sessionId: input.sessionId,
    paymentIntent: input.paymentIntent,
    subscriptionId: input.subscriptionId,
    customerId: input.customerId,
    amountCents: input.amountCents,
  });
  const result = await fulfillTx(tx);
  if (input.sku !== "scan" && (input.expiresAt || input.subscriptionId)) {
    await grantPro(input.userId, "stripe", input.sessionId, {
      plan: input.sku,
      days: skuDays(input.sku),
      expiresAt: input.expiresAt,
      subscriptionId: input.subscriptionId,
      customerId: input.customerId,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    });
  }
  return { tx, result };
}

export async function markTxRefunded(opts: {
  sessionId?: string | null;
  paymentIntent?: string | null;
}) {
  const sql = await getSql();
  const rows = opts.sessionId
    ? await sql<{ id: string; user_id: string; sku: string; fulfillment: string }>`
        select id, user_id, sku, fulfillment from billing_tx
        where stripe_session_id = ${opts.sessionId} limit 1
      `
    : opts.paymentIntent
      ? await sql<{ id: string; user_id: string; sku: string; fulfillment: string }>`
          select id, user_id, sku, fulfillment from billing_tx
          where stripe_payment_intent = ${opts.paymentIntent} limit 1
        `
      : [];
  const row = rows[0];
  if (!row) return;
  if (row.fulfillment === "refunded_unused" || row.fulfillment === "refunded_used") return;
  const used = row.fulfillment === "consumed";
  await sql`
    update billing_tx
    set status = 'refunded',
        fulfillment = ${used ? "refunded_used" : "refunded_unused"},
        refunded_at = now()
    where id = ${row.id}
  `;
  if (!used && row.sku === "scan") {
    await sql`
      update scan_credits
      set credits = greatest(credits - 1, 0), updated_at = now()
      where user_id = ${row.user_id}
    `;
    await sql`
      insert into scan_credit_ledger (id, user_id, delta, reason, stripe_session_id)
      values (${nid("ref")}, ${row.user_id}, -1, 'stripe_refund', ${opts.sessionId ?? null})
    `;
  }
}

export async function startScanRun(userId: string) {
  const sql = await getSql();
  const id = nid("run");
  await sql`
    insert into scan_runs (id, user_id, status, credit_consumed)
    values (${id}, ${userId}, 'started', false)
  `;
  return id;
}

export async function finishScanRun(
  runId: string,
  userId: string,
  status: ScanRunStatus,
  errorCode?: string,
  consumed = false,
) {
  const sql = await getSql();
  await sql`
    update scan_runs
    set status = ${status},
        credit_consumed = ${consumed},
        error_code = ${errorCode ?? null},
        finished_at = now()
    where id = ${runId} and user_id = ${userId}
  `;
  if (consumed) {
    await sql`
      update billing_tx
      set fulfillment = 'consumed', consumed_at = now()
      where id = (
        select id from billing_tx
        where user_id = ${userId} and sku = 'scan' and fulfillment = 'granted'
        order by created_at asc
        limit 1
      )
    `;
  }
}

async function listUserTx(userId: string) {
  const sql = await getSql();
  const rows = await sql<Parameters<typeof rowTx>[0]>`
    select id, user_id, sku, provider, stripe_session_id, stripe_payment_intent,
           amount_cents, status, fulfillment, created_at
    from billing_tx
    where user_id = ${userId}
    order by created_at desc
    limit 40
  `;
  return rows.map(rowTx);
}

function periodEnd(sub: Stripe.Subscription | null) {
  if (!sub) return undefined;
  const raw = sub as Stripe.Subscription & {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const ts = raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000) : undefined;
}

export const listMyPurchases = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const items = await listUserTx(context.userId);
    const credits = await getScanCredits(context.userId);
    return { items, credits, stripeReady: stripeReady() };
  });

export const restorePurchases = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    let applied = 0;
    let already = 0;
    let expiredIgnored = 0;

    const local = await listUserTx(context.userId);
    for (const tx of local) {
      if (tx.provider === "preview") continue;
      const r = await fulfillTx(tx);
      if (r === "granted") applied += 1;
      if (r === "already") already += 1;
    }

    const stripe = await stripeClient();
    if (stripe) {
      const sql = await getSql();
      const cust = await sql<{ stripe_customer_id: string | null }>`
        select stripe_customer_id from pro_members where user_id = ${context.userId} limit 1
      `;
      const fromTx = local.find((t) => t.stripeSessionId)?.stripeSessionId;
      let customerId = cust[0]?.stripe_customer_id ?? null;
      if (!customerId && fromTx) {
        try {
          const s = await stripe.checkout.sessions.retrieve(fromTx);
          customerId = typeof s.customer === "string" ? s.customer : null;
        } catch {
          /* ignore */
        }
      }
      if (customerId) {
        const sessions = await stripe.checkout.sessions.list({
          customer: customerId,
          limit: 40,
        });
        for (const s of sessions.data) {
          if (s.metadata?.userId && s.metadata.userId !== context.userId) continue;
          const paid =
            s.payment_status === "paid" ||
            s.payment_status === "no_payment_required" ||
            s.status === "complete";
          if (!paid) continue;
          const sku =
            asSku(s.metadata?.plan) ??
            (s.metadata?.kind === "scan" ? "scan" : s.mode === "subscription" ? "year" : null);
          if (!sku) continue;

          if (sku !== "scan") {
            const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
            if (subId) {
              try {
                const sub = await stripe.subscriptions.retrieve(subId);
                const live = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
                const end = periodEnd(sub);
                if (!live && end && end.getTime() < Date.now()) {
                  await endPro(context.userId);
                  expiredIgnored += 1;
                  await upsertPaidTx({
                    userId: context.userId,
                    sku,
                    sessionId: s.id,
                    paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : null,
                    subscriptionId: subId,
                    customerId,
                    amountCents: s.amount_total ?? skuCents(sku),
                  });
                  continue;
                }
                const out = await fulfillStripeSession({
                  userId: context.userId,
                  sku,
                  sessionId: s.id,
                  paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : null,
                  subscriptionId: subId,
                  customerId,
                  amountCents: s.amount_total ?? skuCents(sku),
                  expiresAt: end,
                  cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
                });
                if (out.result === "granted") applied += 1;
                else if (out.result === "already") already += 1;
                continue;
              } catch {
                /* fall through */
              }
            }
          }

          const out = await fulfillStripeSession({
            userId: context.userId,
            sku,
            sessionId: s.id,
            paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : null,
            subscriptionId: typeof s.subscription === "string" ? s.subscription : null,
            customerId,
            amountCents: s.amount_total ?? skuCents(sku),
          });
          if (out.result === "granted") applied += 1;
          else if (out.result === "already") already += 1;
        }
      }
    }

    return {
      ok: true as const,
      applied,
      already,
      expiredIgnored,
      credits: await getScanCredits(context.userId),
    };
  });

export const reviewPurchaseClaim = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { reason: ClaimReason; message: string } => {
    const i = input as { reason?: string; message?: string };
    const reason: ClaimReason =
      i.reason === "duplicate" ||
      i.reason === "accidental" ||
      i.reason === "scan_failed" ||
      i.reason === "other"
        ? i.reason
        : "other";
    return { reason, message: String(i.message ?? "").slice(0, 400) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const recent = await sql<{ n: string | number }>`
      select count(*) as n from billing_claims
      where user_id = ${context.userId}
        and created_at > now() - interval '1 day'
    `;
    if (Number(recent[0]?.n ?? 0) >= 5) {
      return {
        ok: false as const,
        verdict: "rate_limited" as const,
        autoRefund: false,
        creditGiven: 0,
        title: "Zu viele Meldungen",
        body: "Heute sind keine weiteren automatischen Prüfungen möglich. Eine Nutzerbehauptung allein löst keine Erstattung aus.",
      };
    }

    const txs = await listUserTx(context.userId);
    const runs = await sql<{
      id: string;
      status: string;
      credit_consumed: boolean;
      restored: boolean;
      created_at: string;
    }>`
      select id, status, credit_consumed, restored, created_at
      from scan_runs
      where user_id = ${context.userId}
      order by created_at desc
      limit 20
    `;

    let verdict = "rejected_claim";
    let creditGiven = 0;
    let title = "Kein nachweisbarer Fehler";
    let body =
      "Eine Meldung allein reicht nicht. Es gibt in den Zahlungs- und Systemdaten keinen Grund für eine Rückerstattung oder Gutschrift.";
    const evidence: Record<string, unknown> = {
      reason: data.reason,
      txCount: txs.length,
      paid: txs.filter((t) => t.status === "paid").map((t) => ({
        id: t.id,
        sku: t.sku,
        session: t.stripeSessionId,
        fulfillment: t.fulfillment,
        cents: t.amountCents,
        at: t.createdAt,
      })),
      runs: runs.map((r) => ({
        id: r.id,
        status: r.status,
        consumed: r.credit_consumed,
        restored: r.restored,
        at: r.created_at,
      })),
    };

    if (data.reason === "accidental") {
      verdict = "rejected_accidental";
      title = "Kein technischer Fehler";
      body =
        "Ein versehentlicher Klick oder ein Meinungswechsel ist kein Fehler der App. Preis und Produkt werden vor dem Kauf angezeigt. Es gibt keine automatische Rückerstattung.";
    } else if (data.reason === "duplicate") {
      const paid = txs.filter((t) => t.status === "paid" && t.provider !== "preview");
      const groups = new Map<string, BillingTx[]>();
      for (const t of paid) {
        const key = t.sku;
        groups.set(key, [...(groups.get(key) ?? []), t]);
      }
      let grantedMissing = 0;
      let trueDup = false;
      for (const [, list] of groups) {
        if (list.length < 2) continue;
        const pending = list.filter((t) => t.fulfillment === "pending");
        const delivered = list.filter(
          (t) => t.fulfillment === "granted" || t.fulfillment === "consumed",
        );
        for (const t of pending) {
          const r = await fulfillTx(t);
          if (r === "granted") grantedMissing += 1;
        }
        if (delivered.length >= 2) trueDup = true;
      }
      evidence.grantedMissing = grantedMissing;
      evidence.trueDup = trueDup;
      if (grantedMissing > 0) {
        verdict = "restored_undelivered";
        creditGiven = grantedMissing;
        title = "Bezahltes Produkt nachgetragen";
        body =
          "In den Zahlungsdaten war eine erfolgreiche Zahlung ohne ausgeliefertes Produkt. Das Produkt wurde nachgetragen. Es gibt keine automatische Gelderstattung.";
      } else if (trueDup) {
        verdict = "duplicate_evidence";
        title = "Zwei erfolgreiche Zahlungen vorhanden";
        body =
          "Die Daten zeigen mehr als eine abgeschlossene Zahlung für dasselbe Produkt. Eine automatische Rückerstattung erfolgt nicht. Bitte den Zahlungsanbieter mit der Transaktions-ID kontaktieren. Gesetzliche Rechte bleiben unberührt.";
      } else {
        verdict = "rejected_no_duplicate";
        title = "Keine doppelte Zahlung";
        body =
          "In den Transaktionsdaten ist keine zweite erfolgreiche Zahlung für denselben Kauf nachweisbar. Ohne diesen Nachweis gibt es keine Gutschrift.";
      }
    } else if (data.reason === "scan_failed") {
      const failed = runs.find(
        (r) => r.status === "failed_server" && r.credit_consumed && !r.restored,
      );
      const failedNoConsume = runs.find((r) => r.status === "failed_server" && !r.credit_consumed);
      const last = runs[0];
      if (failed) {
        await grantScanCredit(context.userId, "tech_restore");
        await sql`
          update scan_runs set restored = true where id = ${failed.id} and user_id = ${context.userId}
        `;
        verdict = "restored_tech_fail";
        creditGiven = 1;
        title = "Technischer Fehler nachgewiesen";
        body =
          "Der Scan wurde in den Systemdaten als Serverfehler ohne Ergebnis gespeichert, das Guthaben war abgezogen. Es wurde genau ein Scan wieder gutgeschrieben. Keine Gelderstattung.";
      } else if (last?.status === "completed") {
        verdict = "rejected_used";
        title = "Scan wurde verwendet";
        body =
          "Der letzte Scan ist in den Systemdaten erfolgreich abgeschlossen. Unzufriedenheit mit dem Ergebnis führt nicht zu einer kostenlosen Wiederholung.";
      } else if (failedNoConsume) {
        verdict = "rejected_not_consumed";
        title = "Kein Guthaben verbraucht";
        body =
          "Ein technisches Problem ist gespeichert, es wurde jedoch kein Einzel-Scan abgezogen. Deshalb gibt es keine zusätzliche Gutschrift.";
      } else {
        verdict = "rejected_no_error";
        title = "Kein technischer Fehler in den Daten";
        body =
          "Es gibt keinen nachvollziehbaren Serverabbruch ohne Ergebnis. Eine Aussage allein reicht nicht für eine Gutschrift.";
      }
    } else {
      verdict = "rejected_other";
      title = "Keine automatische Erstattung";
      body =
        "Rückerstattungen setzt die App nicht aufgrund einer Meldung um. Nur nachweisbare Zahlungsfehler, nicht gelieferte bezahlte Produkte oder gesetzlich/anbieterseitig vorgeschriebene Fälle.";
    }

    const id = nid("cl");
    await sql`
      insert into billing_claims (
        id, user_id, reason, message, verdict, auto_refund, credit_given, evidence_json
      ) values (
        ${id}, ${context.userId}, ${data.reason}, ${data.message}, ${verdict},
        false, ${creditGiven}, ${JSON.stringify(evidence)}
      )
    `;

    return {
      ok: true as const,
      verdict,
      autoRefund: false,
      creditGiven,
      title,
      body,
      credits: await getScanCredits(context.userId),
    };
  });
