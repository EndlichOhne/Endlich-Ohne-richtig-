import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { findBand, SESSION_BANDS, splitAmount } from "@/lib/pricing";
import type { PayMethod } from "@/lib/payments";
import { authMiddleware } from "@/lib/auth/middleware";
import { fulfillStripeSession } from "@/lib/billing";
import {
  skuCents,
  skuLabel,
  type BillingSku,
} from "@/lib/pro";
import { depositIdempotencyKey, proIdempotencyKey } from "@/lib/checkout-key";

const METHODS: PayMethod[] = ["card", "wallet", "paypal", "sepa", "klarna"];

/** Preferred Stripe types. Card/wallet omit this so the Dashboard enables every method. */
const PREFERRED: Partial<Record<PayMethod, Stripe.Checkout.SessionCreateParams.PaymentMethodType[]>> =
  {
    paypal: ["paypal", "card"],
    sepa: ["sepa_debit", "card"],
    klarna: ["klarna", "card"],
  };

function allowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return true;
    }
    if (host === "grok.com" || host.endsWith(".grok.com")) return true;
    if (host.endsWith(".grok.me") || host.endsWith(".grok-sandbox.com")) return true;
    if (host.endsWith(".vercel.app")) return true;
    const pub = process.env.VITE_PUBLIC_HOSTNAME?.split(",")[0]?.split(":")[0]?.toLowerCase();
    if (pub && host === pub) return true;
    return false;
  } catch {
    return false;
  }
}

function stripeMode(key: string | undefined): "live" | "test" | "off" {
  if (!key) return "off";
  if (key.startsWith("sk_live") || key.startsWith("rk_live")) return "live";
  return "test";
}

function subscriptionPeriodEnd(sub: Stripe.Subscription | null) {
  if (!sub) return undefined;
  const raw = sub as Stripe.Subscription & {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const ts = raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000) : undefined;
}

async function stripeClient(key: string) {
  const StripeSdk = (await import("stripe")).default;
  return new StripeSdk(key, { maxNetworkRetries: 2, typescript: true });
}

export const getPayConfig = createServerFn({ method: "GET" }).handler(async () => {
  const mode = stripeMode(process.env.STRIPE_SECRET_KEY);
  return { ready: mode !== "off", mode };
});

type CreateInput = {
  sizeId: string;
  locationSlug: string;
  date: string;
  email: string;
  method: PayMethod;
  origin: string;
  idempotencyKey: string;
};

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): CreateInput => {
    if (typeof input !== "object" || !input) throw new Error("Ungültige Anfrage");
    const i = input as Record<string, unknown>;
    const sizeId = String(i.sizeId ?? "");
    if (!SESSION_BANDS.some((b) => b.id === sizeId)) {
      throw new Error("Unbekannte Flächenangabe");
    }
    const method = METHODS.includes(i.method as PayMethod)
      ? (i.method as PayMethod)
      : "card";
    const email = String(i.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error("Bitte eine gültige E-Mail für die Quittung angeben.");
    }
    const origin = String(i.origin ?? "");
    if (!allowedOrigin(origin)) throw new Error("Unzulässige Herkunft");
    return {
      sizeId,
      locationSlug: String(i.locationSlug ?? "").slice(0, 80),
      date: String(i.date ?? "").slice(0, 32),
      email,
      method,
      origin,
      idempotencyKey: String(i.idempotencyKey ?? "").slice(0, 64),
    };
  })
  .handler(async ({ data, context }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const mode = stripeMode(key);
    if (!key || mode === "off") {
      return { ok: false as const, code: "not_configured" as const };
    }

    const band = findBand(data.sizeId);
    const split = splitAmount(band.totalCents);
    const stripe = await stripeClient(key);

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      locale: "de",
      submit_type: "pay",
      customer_email: data.email,
      customer_creation: "if_required",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      saved_payment_method_options: { payment_method_save: "disabled" },
      allow_promotion_codes: false,
      success_url: `${data.origin}/zahlung/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/zahlung/abbruch`,
      custom_text: {
        submit: {
          message:
            "Anzahlung auf einen unverbindlichen Sitzungsrichtwert. Kein Behandlungsvertrag, keine Garantie.",
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: split.depositCents,
            product_data: {
              name: `Anzahlung ${split.percent} % · Sitzung ${band.label}`,
              description:
                "Anzahlung auf einen unverbindlichen Sitzungsrichtwert. Kein Behandlungsvertrag, keine Diagnose, keine Garantie. Restbetrag vor Ort nach Beratung.",
            },
          },
        },
      ],
      metadata: {
        sizeId: band.id,
        locationSlug: data.locationSlug,
        date: data.date,
        restCents: String(split.restCents),
        totalCents: String(split.totalCents),
        userId: context.userId,
      },
      payment_intent_data: {
        description: "ENDLICH OHNE Anzahlung Richtwert",
        metadata: {
          sizeId: band.id,
          locationSlug: data.locationSlug,
          userId: context.userId,
        },
      },
    };

    const idemp = depositIdempotencyKey(context.userId, data);

    const create = (
      types: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] | undefined,
      suffix: string,
    ) =>
      stripe.checkout.sessions.create(
        types?.length ? { ...params, payment_method_types: types } : params,
        { idempotencyKey: `${idemp}-${suffix}` },
      );

    let session: Stripe.Checkout.Session;
    const preferred = PREFERRED[data.method];
    try {
      session = preferred ? await create(preferred, preferred.join("-")) : await create(undefined, "auto");
    } catch {
      try {
        session = await create(undefined, "auto-fallback");
      } catch {
        session = await create(["card"], "card");
      }
    }

    if (!session.url) {
      return { ok: false as const, code: "no_url" as const };
    }
    return { ok: true as const, url: session.url, mode };
  });

export async function assertDepositPaidForUser(sessionId: string, userId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Zahlung nicht bestätigt.");
  const stripe = await stripeClient(key);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") throw new Error("Zahlung nicht bestätigt.");
  if (!session.metadata?.userId || session.metadata.userId !== userId) {
    throw new Error("Zahlung nicht bestätigt.");
  }
  const band = findBand(String(session.metadata.sizeId ?? ""));
  const split = splitAmount(band.totalCents);
  if (session.amount_total !== split.depositCents) throw new Error("Zahlung nicht bestätigt.");
  return {
    id: session.id,
    depositCents: split.depositCents,
    restCents: split.restCents,
    totalCents: split.totalCents,
    mode: stripeMode(key),
  };
}

export const retrieveCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const id =
      typeof input === "object" && input && "sessionId" in input
        ? String((input as { sessionId: unknown }).sessionId)
        : "";
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) {
      throw new Error("Ungültige Sitzung");
    }
    return { sessionId: id };
  })
  .handler(async ({ data, context }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const mode = stripeMode(key);
    if (!key) return { ok: false as const, code: "not_configured" as const };

    const stripe = await stripeClient(key);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ["payment_intent.payment_method"],
    });

    if (session.payment_status !== "paid") {
      return { ok: false as const, code: "unpaid" as const };
    }

    const band = findBand(String(session.metadata?.sizeId ?? "m"));
    const split = splitAmount(band.totalCents);
    if (session.amount_total !== split.depositCents) {
      return { ok: false as const, code: "unpaid" as const };
    }
    if (!session.metadata?.userId || session.metadata.userId !== context.userId) {
      return { ok: false as const, code: "wrong_user" as const };
    }
    const pi = session.payment_intent;
    const intent = typeof pi === "object" && pi && !("deleted" in pi && pi.deleted) ? pi : null;
    const pmRaw =
      intent && "payment_method" in intent ? intent.payment_method : null;
    const pm =
      pmRaw && typeof pmRaw === "object" && "type" in pmRaw
        ? (pmRaw as Stripe.PaymentMethod)
        : null;
    const type = pm?.type ?? session.payment_method_types?.[0] ?? "card";

    let method: PayMethod = "card";
    let methodLabel = "Karte";
    let last4: string | undefined;
    let cardBrand: string | undefined;

    if (pm?.card) {
      last4 = pm.card.last4 ?? undefined;
      cardBrand = pm.card.brand ?? undefined;
      const wallet = pm.card.wallet?.type;
      if (wallet) {
        method = "wallet";
        methodLabel =
          wallet === "apple_pay"
            ? "Apple Pay"
            : wallet === "google_pay"
              ? "Google Pay"
              : "Wallet";
      } else {
        methodLabel = cardBrand ? `Karte · ${cardBrand}` : "Karte";
      }
    } else if (type === "paypal") {
      method = "paypal";
      methodLabel = "PayPal";
    } else if (type === "sepa_debit") {
      method = "sepa";
      methodLabel = "SEPA-Lastschrift";
      last4 = pm?.sepa_debit?.last4 ?? undefined;
    } else if (type === "klarna") {
      method = "klarna";
      methodLabel = "Klarna";
    } else if (type === "link") {
      method = "wallet";
      methodLabel = "Stripe Link";
    }

    return {
      ok: true as const,
      mode,
      payment: {
        id: session.id,
        createdAt: new Date((session.created ?? 0) * 1000).toISOString(),
        sizeId: band.id,
        sizeLabel: band.label,
        locationSlug: session.metadata?.locationSlug || null,
        date: session.metadata?.date || "",
        totalCents: split.totalCents,
        depositCents: session.amount_total ?? split.depositCents,
        restCents: split.restCents,
        method,
        methodLabel,
        status: "paid" as const,
        provider: "stripe" as const,
        stripeMode: mode,
        last4,
        cardBrand,
        email: session.customer_email ?? session.customer_details?.email ?? "",
      },
    };
  });

export const createProCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { origin: string; email: string; sku: BillingSku } => {
    const i = input as { origin?: string; email?: string; sku?: string };
    const origin = String(i.origin ?? "");
    if (!allowedOrigin(origin)) throw new Error("Unzulässige Herkunft");
    const email = String(i.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error("Bitte eine gültige E-Mail angeben.");
    }
    const sku: BillingSku =
      i.sku === "scan" || i.sku === "month" || i.sku === "year" ? i.sku : "year";
    return { origin, email, sku };
  })
  .handler(async ({ context, data }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const mode = stripeMode(key);
    if (!key || mode === "off") {
      return { ok: false as const, code: "not_configured" as const };
    }
    const stripe = await stripeClient(key);
    const scan = data.sku === "scan";
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: scan ? "payment" : "subscription",
      locale: "de",
      customer_creation: "if_required",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      saved_payment_method_options: { payment_method_save: "disabled" },
      allow_promotion_codes: false,
      success_url: `${data.origin}/pro/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/pro/abbruch`,
      custom_text: {
        submit: {
          message: scan
            ? "Einzel-Scan 0,50 € · Einmalzahlung · kein Abonnement. Kein Behandlungsvertrag, keine Diagnose, keine Garantie."
            : data.sku === "month"
              ? "PRO 3,99 € pro Monat · Automatische Verlängerung, sofern nicht gekündigt. Kein Behandlungsvertrag, keine Diagnose, keine Garantie."
              : "PRO 22,00 € pro Jahr · Automatische Verlängerung, sofern nicht gekündigt. Kein Behandlungsvertrag, keine Diagnose, keine Garantie.",
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: scan
            ? {
                currency: "eur",
                unit_amount: skuCents("scan"),
                product_data: {
                  name: skuLabel("scan"),
                  description:
                    "Genau ein Online-KI-Scan. Wird nach erfolgreichem Scan verbraucht. Kein Abo.",
                },
              }
            : {
                currency: "eur",
                unit_amount: skuCents(data.sku),
                recurring: { interval: data.sku === "month" ? "month" : "year" },
                product_data: {
                  name: skuLabel(data.sku),
                  description:
                    "Unbegrenzte KI-Scans und PRO-Funktionen während des aktiven Abos. Kein Behandlungsvertrag.",
                },
              },
        },
      ],
      metadata: {
        kind: scan ? "scan" : "pro",
        plan: data.sku,
        userId: context.userId,
      },
    };
    if (scan) params.submit_type = "pay";
    else {
      params.subscription_data = {
        metadata: { kind: "pro", plan: data.sku, userId: context.userId },
      };
    }
    if (data.email) params.customer_email = data.email;
    const session = await stripe.checkout.sessions.create(params, {
      idempotencyKey: proIdempotencyKey(context.userId, data.sku),
    });
    if (!session.url) return { ok: false as const, code: "no_url" as const };
    return { ok: true as const, url: session.url, mode };
  });

export const retrieveProCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const id =
      typeof input === "object" && input && "sessionId" in input
        ? String((input as { sessionId: unknown }).sessionId)
        : "";
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) {
      throw new Error("Ungültige Sitzung");
    }
    return { sessionId: id };
  })
  .handler(async ({ context, data }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const mode = stripeMode(key);
    if (!key) return { ok: false as const, code: "not_configured" as const };
    const stripe = await stripeClient(key);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ["subscription"],
    });
    if (session.metadata?.userId !== context.userId) {
      return { ok: false as const, code: "wrong_user" as const };
    }
    const skuFromMeta: BillingSku | null =
      session.metadata?.plan === "scan" || session.metadata?.kind === "scan"
        ? "scan"
        : session.metadata?.plan === "month" || session.metadata?.plan === "year"
          ? session.metadata.plan
          : null;
    if (!skuFromMeta || session.amount_total !== skuCents(skuFromMeta)) {
      return { ok: false as const, code: "unpaid" as const };
    }
    if (session.payment_status !== "paid") {
      return { ok: false as const, code: "unpaid" as const };
    }
    if (skuFromMeta === "scan") {
      const out = await fulfillStripeSession({
        userId: context.userId,
        sku: "scan",
        sessionId: session.id,
        paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
        customerId: typeof session.customer === "string" ? session.customer : null,
        amountCents: session.amount_total ?? skuCents("scan"),
      });
      return {
        ok: true as const,
        mode,
        kind: "scan" as const,
        credits: out.result === "already" ? 0 : 1,
        until: null,
        plan: null,
      };
    }
    const plan = skuFromMeta;
    const subRaw = session.subscription;
    const sub =
      subRaw && typeof subRaw === "object" && "id" in subRaw
        ? (subRaw as Stripe.Subscription)
        : null;
    const periodEnd = subscriptionPeriodEnd(sub);
    await fulfillStripeSession({
      userId: context.userId,
      sku: plan,
      sessionId: session.id,
      paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
      subscriptionId: sub?.id ?? (typeof subRaw === "string" ? subRaw : null),
      customerId: typeof session.customer === "string" ? session.customer : null,
      amountCents: session.amount_total ?? skuCents(plan),
      expiresAt: periodEnd,
      cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    });
    return {
      ok: true as const,
      mode,
      kind: "pro" as const,
      until: periodEnd ? periodEnd.toISOString() : null,
      plan,
      credits: 0,
    };
  });
