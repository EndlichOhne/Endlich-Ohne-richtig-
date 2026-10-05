import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { skuDays, type BillingSku, type ProPlan } from "@/lib/pro";

export type ProStatus = {
  isPro: boolean;
  until: string | null;
  source: string | null;
  stripeReady: boolean;
  plan: ProPlan | null;
  cancelAtPeriodEnd: boolean;
  scanCredits: number;
};

function stripeReady() {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && (key.startsWith("sk_") || key.startsWith("rk_")));
}

export async function isProUser(userId: string) {
  try {
    const sql = await getSql();
    const rows = await sql<{ user_id: string }>`
      select user_id from pro_members
      where user_id = ${userId}
        and status = 'active'
        and (expires_at is null or expires_at > now())
      limit 1
    `;
    return Boolean(rows[0]);
  } catch {
    return false;
  }
}

export async function getScanCredits(userId: string) {
  try {
    const sql = await getSql();
    const rows = await sql<{ credits: number }>`
      select credits from scan_credits where user_id = ${userId} limit 1
    `;
    return Math.max(0, Number(rows[0]?.credits ?? 0));
  } catch {
    return 0;
  }
}

export async function grantPro(
  userId: string,
  source: "stripe" | "preview",
  stripeSessionId?: string,
  opts?: {
    plan?: ProPlan;
    days?: number;
    expiresAt?: Date | string | null;
    subscriptionId?: string | null;
    customerId?: string | null;
    cancelAtPeriodEnd?: boolean;
    status?: string;
  },
) {
  const sql = await getSql();
  const plan = opts?.plan ?? "year";
  let until: string | null = null;
  if (opts?.expiresAt) {
    until = typeof opts.expiresAt === "string" ? opts.expiresAt : opts.expiresAt.toISOString();
  } else {
    const expires = new Date();
    expires.setDate(expires.getDate() + (opts?.days ?? skuDays(plan)));
    until = expires.toISOString();
  }
  const status = opts?.status ?? "active";
  const cancel = Boolean(opts?.cancelAtPeriodEnd);
  await sql`
    insert into pro_members (
      user_id, status, source, started_at, expires_at, stripe_session_id, updated_at,
      plan, stripe_subscription_id, stripe_customer_id, cancel_at_period_end
    )
    values (
      ${userId}, ${status}, ${source}, now(), ${until}, ${stripeSessionId ?? null}, now(),
      ${plan}, ${opts?.subscriptionId ?? null}, ${opts?.customerId ?? null}, ${cancel}
    )
    on conflict (user_id) do update set
      status = excluded.status,
      source = excluded.source,
      expires_at = excluded.expires_at,
      stripe_session_id = coalesce(excluded.stripe_session_id, pro_members.stripe_session_id),
      plan = coalesce(excluded.plan, pro_members.plan),
      stripe_subscription_id = coalesce(excluded.stripe_subscription_id, pro_members.stripe_subscription_id),
      stripe_customer_id = coalesce(excluded.stripe_customer_id, pro_members.stripe_customer_id),
      cancel_at_period_end = excluded.cancel_at_period_end,
      updated_at = now()
  `;
  return until;
}

export async function endPro(userId: string) {
  const sql = await getSql();
  await sql`
    update pro_members
    set status = 'canceled', cancel_at_period_end = true, updated_at = now()
    where user_id = ${userId}
  `;
}

export async function grantScanCredit(
  userId: string,
  reason: string,
  stripeSessionId?: string,
  amount = 1,
) {
  const sql = await getSql();
  const id = stripeSessionId
    ? `sess-${stripeSessionId}`
    : `cred-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (stripeSessionId) {
    const seen = await sql<{ id: string }>`
      select id from scan_credit_ledger where stripe_session_id = ${stripeSessionId} limit 1
    `;
    if (seen[0]) return getScanCredits(userId);
  }
  await sql`
    insert into scan_credit_ledger (id, user_id, delta, reason, stripe_session_id)
    values (${id}, ${userId}, ${amount}, ${reason}, ${stripeSessionId ?? null})
  `;
  await sql`
    insert into scan_credits (user_id, credits, updated_at)
    values (${userId}, ${amount}, now())
    on conflict (user_id) do update set
      credits = scan_credits.credits + ${amount},
      updated_at = now()
  `;
  return getScanCredits(userId);
}

export async function consumeScanCredit(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ credits: number }>`
    update scan_credits
    set credits = credits - 1, updated_at = now()
    where user_id = ${userId} and credits > 0
    returning credits
  `;
  if (!rows[0]) return false;
  const id = `use-${userId}-${Date.now()}`;
  await sql`
    insert into scan_credit_ledger (id, user_id, delta, reason)
    values (${id}, ${userId}, -1, 'scan')
  `;
  return true;
}

export async function canKiScan(userId: string) {
  const isPro = await isProUser(userId);
  if (isPro) return { ok: true as const, isPro: true, credits: 0 };
  const credits = await getScanCredits(userId);
  if (credits > 0) return { ok: true as const, isPro: false, credits };
  return { ok: false as const, isPro: false, credits: 0 };
}

export const getProStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ProStatus> => {
    const ready = stripeReady();
    const empty: ProStatus = {
      isPro: false,
      until: null,
      source: null,
      stripeReady: ready,
      plan: null,
      cancelAtPeriodEnd: false,
      scanCredits: 0,
    };
    try {
      const sql = await getSql();
      const rows = await sql<{
        expires_at: string | null;
        source: string;
        plan: string | null;
        cancel_at_period_end: boolean;
      }>`
        select expires_at, source, plan, cancel_at_period_end from pro_members
        where user_id = ${context.userId}
          and status = 'active'
          and (expires_at is null or expires_at > now())
        limit 1
      `;
      const row = rows[0];
      const credits = await getScanCredits(context.userId);
      const plan = row?.plan === "month" || row?.plan === "year" ? row.plan : row ? "year" : null;
      return {
        isPro: Boolean(row),
        until: row?.expires_at ? String(row.expires_at) : null,
        source: row?.source ?? null,
        stripeReady: ready,
        plan,
        cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end),
        scanCredits: credits,
      };
    } catch {
      return empty;
    }
  });

export const activateProPreview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { sku: BillingSku } => {
    const sku = (input as { sku?: string } | null)?.sku;
    if (sku === "scan" || sku === "month" || sku === "year") return { sku };
    return { sku: "year" };
  })
  .handler(async ({ context, data }) => {
    if (stripeReady()) {
      throw new Error("Bitte über Stripe abschließen.");
    }
    const { upsertPaidTx, fulfillTx } = await import("@/lib/billing");
    const tx = await upsertPaidTx({
      userId: context.userId,
      sku: data.sku,
      provider: "preview",
    });
    await fulfillTx(tx);
    const credits = data.sku === "scan" ? await getScanCredits(context.userId) : 0;
    const untilRows = data.sku === "scan"
      ? null
      : await (await getSql())<{ expires_at: string | null }>`
          select expires_at from pro_members where user_id = ${context.userId} limit 1
        `;
    return {
      ok: true as const,
      kind: data.sku === "scan" ? ("scan" as const) : ("pro" as const),
      credits,
      until: untilRows?.[0]?.expires_at ? String(untilRows[0].expires_at) : null,
    };
  });
