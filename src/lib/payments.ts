import { isPlausibleEmail } from "@/lib/email";

export const PAYMENTS_KEY = "eo-payments";

export type PayMethod = "card" | "paypal" | "sepa" | "klarna" | "wallet";

export type PaymentStatus = "paid" | "pending" | "canceled";

export type Payment = {
  id: string;
  createdAt: string;
  sizeId: string;
  sizeLabel: string;
  locationSlug: string | null;
  locationName: string | null;
  date: string;
  totalCents: number;
  depositCents: number;
  restCents: number;
  method: PayMethod;
  methodLabel: string;
  status: PaymentStatus;
  provider: "stripe";
  stripeMode: "live" | "test" | "off";
  last4?: string;
  cardBrand?: string;
  emailMasked?: string;
};

export const METHOD_LABEL: Record<PayMethod, string> = {
  card: "Karte (Visa, Mastercard, American Express)",
  paypal: "PayPal",
  sepa: "SEPA-Lastschrift",
  klarna: "Klarna",
  wallet: "Apple Pay / Google Pay",
};

export const METHOD_HINT: Record<PayMethod, string> = {
  card: "3-D Secure bei Stripe",
  paypal: "Weiterleitung zu PayPal",
  sepa: "Lastschriftmandat bei Stripe",
  klarna: "Kauf auf Rechnung, wenn verfügbar",
  wallet: "Gerät bestätigt, keine Nummer in der App",
};

export function loadPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Payment[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.id === "string" && typeof p.depositCents === "number")
      .map((p) => ({
        ...p,
        status: p.status ?? "pending",
        provider: p.provider ?? "stripe",
        stripeMode: p.stripeMode ?? "off",
        methodLabel: p.methodLabel ?? "Zahlung",
      }));
  } catch {
    return [];
  }
}

export function savePayments(items: Payment[]) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(items));
}

export function findPayment(id: string) {
  return loadPayments().find((p) => p.id === id);
}

export function addPayment(p: Payment) {
  const rest = loadPayments().filter((x) => x.id !== p.id);
  savePayments([p, ...rest]);
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return undefined;
  const keep = user.slice(0, 1);
  return `${keep}***@${domain}`;
}

export function emailOk(value: string) {
  return isPlausibleEmail(value);
}
