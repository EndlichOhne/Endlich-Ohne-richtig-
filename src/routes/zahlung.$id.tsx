import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DepositSplit } from "@/components/deposit-split";
import { PageIntro } from "@/components/page-intro";
import { SourceTag } from "@/components/source-tag";
import { Disclaimer } from "@/components/disclaimer";
import { findPayment, type Payment } from "@/lib/payments";
import { DEPOSIT_PERCENT, euro } from "@/lib/pricing";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/zahlung/$id")({
  component: ReceiptPage,
  head: () => ({ meta: [{ title: `Beleg · ${BRAND.name}` }] }),
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const [p, setP] = useState<Payment | null | undefined>(undefined);

  useEffect(() => {
    setP(findPayment(id) ?? null);
  }, [id]);

  if (p === undefined) {
    return <p className="text-sm text-muted-foreground">Beleg wird geladen.</p>;
  }

  if (!p) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Beleg nicht gefunden</h1>
        <p className="text-sm text-muted-foreground">
          Der Beleg liegt nur auf diesem Gerät (Stripe-Sitzung). Nach Löschen der
          App-Daten ist er lokal weg – die Zahlung bleibt bei Stripe.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/zahlung">Neue Anzahlung</Link>
        </Button>
      </div>
    );
  }

  const paid = p.status === "paid";

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<SourceTag kind="nutzer" />}
        kicker={paid ? "Bezahlt über Stripe" : "Offen"}
        title={paid ? "Anzahlung eingegangen" : "Anzahlung"}
      >
        {DEPOSIT_PERCENT} % über den Zahlungsdienst Stripe.
        {` ${100 - DEPOSIT_PERCENT} %`} bleiben für die Sitzung vor Ort. Keine
        Diagnose, keine Garantie.
      </PageIntro>

      <section className="rounded-2xl bg-hero p-5 text-hero-foreground">
        <p className="kicker text-accent">Anzahlung {DEPOSIT_PERCENT} %</p>
        <p className="mt-2 font-display text-4xl tabular-nums">{euro(p.depositCents)}</p>
        <p className="mt-3 text-sm text-hero-foreground/75">Beleg {p.id}</p>
        {p.stripeMode === "test" ? (
          <p className="mt-2 text-xs text-hero-foreground/70">Stripe-Testmodus</p>
        ) : null}
      </section>

      <DepositSplit totalCents={p.totalCents} />

      <dl className="space-y-3 rounded-2xl bg-card p-5 text-sm shadow-[var(--shadow-border)]">
        <Row k="Status" v={paid ? "bezahlt" : p.status} />
        <Row k="Fläche" v={p.sizeLabel} />
        <Row k="Zahlungsart" v={p.methodLabel} />
        {p.cardBrand && p.last4 ? (
          <Row k="Karte" v={`${p.cardBrand} ·••• ${p.last4}`} />
        ) : p.last4 ? (
          <Row k="Konto" v={`•••• ${p.last4}`} />
        ) : null}
        {p.emailMasked ? <Row k="Quittung" v={p.emailMasked} /> : null}
        <Row k="Standort" v={p.locationName ?? "noch offen"} />
        <Row k="Datum" v={p.date || "noch offen"} />
        <Row k="Rest vor Ort" v={euro(p.restCents)} />
        <Row k="Dienst" v="Stripe (PCI, 3-D Secure)" />
      </dl>

      <p className="text-xs text-muted-foreground">
        Verbindlich für die Behandlung wird der Betrag erst nach Einschätzung in
        der Praxis. Widerruf der Anzahlung: siehe Widerrufsbelehrung (Entwurf).
      </p>
      <Disclaimer compact />

      <div className="flex flex-col gap-3">
        <Button asChild className="min-h-12 rounded-xl">
          <Link to="/planer">Zum Sitzungsplaner</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-12 rounded-xl">
          <Link to="/widerruf">Widerruf</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
