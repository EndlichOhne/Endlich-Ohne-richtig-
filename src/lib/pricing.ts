export const DEPOSIT_PERCENT = 25;

export type SessionBand = {
  id: "xs" | "s" | "m" | "l" | "xl";
  label: string;
  totalCents: number;
  hint: string;
};

export const SESSION_BANDS: SessionBand[] = [
  { id: "xs", label: "sehr klein", totalCents: 12000, hint: "z. B. kleiner Schriftzug" },
  { id: "s", label: "klein", totalCents: 16000, hint: "z. B. Symbol" },
  { id: "m", label: "mittel", totalCents: 24000, hint: "z. B. Unterarm" },
  { id: "l", label: "groß", totalCents: 36000, hint: "z. B. Oberarm / Wade" },
  { id: "xl", label: "sehr groß", totalCents: 48000, hint: "z. B. Rücken / Bein" },
];

export function findBand(id: string | null | undefined) {
  return SESSION_BANDS.find((b) => b.id === id) ?? SESSION_BANDS[2];
}

export function splitAmount(totalCents: number) {
  const depositCents = Math.round((totalCents * DEPOSIT_PERCENT) / 100);
  return {
    totalCents,
    depositCents,
    restCents: totalCents - depositCents,
    percent: DEPOSIT_PERCENT,
  };
}

export function euro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
