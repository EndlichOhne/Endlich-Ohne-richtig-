export const DESK_STATUSES = [
  "planned",
  "confirmed",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type DeskStatus = (typeof DESK_STATUSES)[number];
export type PayStatus = "OPEN" | "PARTIAL" | "PAID" | "CANCELLED";

const NEXT: Record<DeskStatus, readonly DeskStatus[]> = {
  planned: ["confirmed", "cancelled", "no_show"],
  confirmed: ["arrived", "cancelled", "no_show"],
  arrived: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const ACTION_STATUS = {
  confirm: "confirmed",
  arrive: "arrived",
  start: "in_progress",
  complete: "completed",
  cancel: "cancelled",
  noshow: "no_show",
} as const;

export type DeskAction = keyof typeof ACTION_STATUS | "note" | "pay" | "quote" | "admin" | "assign";

const STAFF = new Set<DeskAction>(["confirm", "arrive", "cancel", "noshow", "pay", "quote"]);
const DOCTOR = new Set<DeskAction>([...STAFF, "start", "complete", "note"]);

export function isDeskStatus(value: string): value is DeskStatus {
  return (DESK_STATUSES as readonly string[]).includes(value);
}

export function actionToStatus(action: string): DeskStatus | null {
  return ACTION_STATUS[action as keyof typeof ACTION_STATUS] ?? null;
}

export function canAdvanceStatus(from: string, to: string) {
  if (!isDeskStatus(from) || !isDeskStatus(to)) return false;
  return NEXT[from].includes(to);
}

/** Staff is not an admin. A claimed role is ignored by the caller. */
export function roleAllowsAction(role: string, action: DeskAction) {
  if (role === "admin" || role === "doctor") {
    if (role === "doctor") return DOCTOR.has(action);
    return true;
  }
  if (role === "staff") return STAFF.has(action);
  return false;
}

export function berlinDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(now);
}

export const STATUS_LABEL: Record<string, string> = {
  planned: "Geplant",
  confirmed: "Bestätigt",
  arrived: "Angekommen",
  in_progress: "Behandlung läuft",
  completed: "Abgeschlossen",
  cancelled: "Abgesagt",
  no_show: "Nicht erschienen",
};

export function euro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function clock(value: string) {
  const time = value.split("T")[1];
  return time ? time.slice(0, 5) : value;
}

export function paymentStatusFromAmounts(input: {
  depositCents: number;
  restCents: number;
  paidCents: number;
  cancelled: boolean;
}): PayStatus {
  if (input.cancelled) return "CANCELLED";
  const due = input.depositCents + input.restCents;
  if (due <= 0 || input.paidCents <= 0) return "OPEN";
  if (input.paidCents >= due) return "PAID";
  return "PARTIAL";
}

export function quoteAllowed(depositCents: number, restCents: number, alreadyPaid: number) {
  if (!Number.isInteger(depositCents) || !Number.isInteger(restCents)) return false;
  if (depositCents < 0 || restCents < 0) return false;
  const due = depositCents + restCents;
  if (due <= 0 || due > 500_000) return false;
  return due >= alreadyPaid;
}

/**
 * The client may send a payment status. It is ignored.
 * Stripe is never marked paid on this path.
 */
export function applyManualPayment(input: {
  depositCents: number;
  restCents: number;
  paidCents: number;
  addCents: number;
  method: string;
  claimedStatus?: unknown;
}):
  | { ok: true; paidCents: number; status: PayStatus }
  | { ok: false; reason: "stripe" | "method" | "amount" | "no-quote" | "over" } {
  void input.claimedStatus;
  if (input.method === "stripe") return { ok: false, reason: "stripe" };
  if (input.method !== "cash" && input.method !== "card" && input.method !== "transfer") {
    return { ok: false, reason: "method" };
  }
  if (!Number.isInteger(input.addCents) || input.addCents <= 0 || input.addCents > 500_000) {
    return { ok: false, reason: "amount" };
  }
  const due = input.depositCents + input.restCents;
  if (due <= 0) return { ok: false, reason: "no-quote" };
  const paidCents = input.paidCents + input.addCents;
  if (paidCents > due) return { ok: false, reason: "over" };
  return {
    ok: true,
    paidCents,
    status: paymentStatusFromAmounts({
      depositCents: input.depositCents,
      restCents: input.restCents,
      paidCents,
      cancelled: false,
    }),
  };
}
