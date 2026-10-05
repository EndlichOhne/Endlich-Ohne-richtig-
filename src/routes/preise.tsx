import { createFileRoute, Link } from "@tanstack/react-router";
import { SourceTag } from "@/components/source-tag";
import { Disclaimer } from "@/components/disclaimer";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { DepositSplit } from "@/components/deposit-split";
import { DEPOSIT_PERCENT, SESSION_BANDS, euro, splitAmount } from "@/lib/pricing";

export const Route = createFileRoute("/preise")({
  component: PreisePage,
  head: () => ({ meta: [{ title: "Preise · ENDLICH OHNE" }] }),
});

const ITEMS = [
  {
    t: "Tattooentfernung",
    d: "Richtwert 80–600 € pro Sitzung, abhängig von Größe und Aufwand.",
    img: "/images/tattoo.webp",
  },
  {
    t: "PMU / Microblading",
    d: "Abhängig von Fläche, Pigment und Verfahren. Nicht pauschal bezifferbar.",
    img: "/images/pmu.webp",
  },
  {
    t: "Cover-up-Aufhellung",
    d: "Abhängig von Größe und gewünschtem Ergebnis. Ziel ist oft nicht die komplette Entfernung.",
    img: "/images/coverup-arm.webp",
  },
];

function PreisePage() {
  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<SourceTag kind="allgemein" />}
        kicker="Unverbindlich"
        title="Beispielpreise / Richtwerte"
      >
        Keine verbindlichen Angebote. Pro Sitzung {DEPOSIT_PERCENT} % Anzahlung
        über Stripe, {` ${100 - DEPOSIT_PERCENT} %`} vor Ort – Richtwert, kein
        Behandlungsvertrag.
      </PageIntro>

      <DepositSplit totalCents={24000} />

      <ul className="space-y-2">
        {SESSION_BANDS.map((b) => {
          const s = splitAmount(b.totalCents);
          return (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <span>
                <span className="block text-sm font-medium">{b.label}</span>
                <span className="text-xs text-muted-foreground">{b.hint}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-medium tabular-nums">{euro(b.totalCents)}</span>
                <span className="text-xs text-primary tabular-nums">
                  {euro(s.depositCents)} jetzt
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link to="/zahlung">
          {DEPOSIT_PERCENT} % Anzahlung zahlen
        </Link>
      </Button>

      <ul className="space-y-3">
        {ITEMS.map((it) => (
          <li
            key={it.t}
            className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]"
          >
            <img src={it.img} alt="" className="h-32 w-full object-cover" />
            <div className="p-4">
              <p className="font-medium">{it.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium">
        Gesamtkosten = nicht Sitzungen × Beispielpreis. Erst nach individueller
        Einschätzung seriös bestimmbar.
      </p>
      <Disclaimer />
    </div>
  );
}
