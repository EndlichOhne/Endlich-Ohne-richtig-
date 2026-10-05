import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { endPro } from "@/lib/pro-api";
import { fulfillStripeSession, markTxRefunded, claimStripeEvent, releaseStripeEvent } from "@/lib/billing";
import { skuCents, skuDays, type BillingSku, type ProPlan } from "@/lib/pro";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.STRIPE_SECRET_KEY;
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!key || !secret) {
          return new Response("not configured", { status: 503 });
        }
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("missing signature", { status: 400 });
        const raw = await request.text();
        const StripeSdk = (await import("stripe")).default;
        const stripe = new StripeSdk(key);
        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(raw, signature, secret);
        } catch {
          return new Response("invalid signature", { status: 400 });
        }
        let claimed = false;
        try {
          claimed = await claimStripeEvent(event.id, event.type);
          if (!claimed) return Response.json({ received: true });
          await applyStripeEvent(event);
        } catch {
          if (claimed) {
            try {
              await releaseStripeEvent(event.id);
            } catch {
              /* retry may no-op if the claim row is already gone */
            }
          }
          return new Response("handler error", { status: 500 });
        }
        return Response.json({ received: true });
      },
    },
  },
});

function planOf(meta?: Stripe.Metadata | null): ProPlan {
  return meta?.plan === "month" ? "month" : "year";
}

function asSku(meta?: Stripe.Metadata | null, mode?: string | null): BillingSku | null {
  if (meta?.kind === "scan" || meta?.plan === "scan") return "scan";
  if (meta?.plan === "month" || meta?.plan === "year") return meta.plan;
  if (mode === "subscription") return planOf(meta);
  return null;
}

function subscriptionPeriodEnd(sub: Stripe.Subscription) {
  const raw = sub as Stripe.Subscription & {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const ts = raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000) : undefined;
}

async function applyStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (!userId) return;
    const sku = asSku(session.metadata, session.mode);
    if (!sku) return;
    if (session.payment_status !== "paid") return;
    if (typeof session.amount_total !== "number" || session.amount_total !== skuCents(sku)) return;
    const subId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    await fulfillStripeSession({
      userId,
      sku,
      sessionId: session.id,
      paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
      subscriptionId: subId ?? null,
      customerId: typeof session.customer === "string" ? session.customer : null,
      amountCents: session.amount_total ?? skuCents(sku),
    });
    return;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    await markTxRefunded({ paymentIntent: pi });
    return;
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (!userId) return;
    if (event.type === "customer.subscription.deleted" || sub.status === "canceled" || sub.status === "unpaid") {
      await endPro(userId);
      return;
    }
    const plan = planOf(sub.metadata);
    const periodEnd = subscriptionPeriodEnd(sub);
    const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
    const { grantPro } = await import("@/lib/pro-api");
    await grantPro(userId, "stripe", undefined, {
      plan,
      days: skuDays(plan),
      expiresAt: periodEnd,
      subscriptionId: sub.id,
      customerId: typeof sub.customer === "string" ? sub.customer : null,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      status: active ? "active" : "canceled",
    });
  }
}
