import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { RequireAuth } from "@/components/require-auth";
import { BRAND } from "@/lib/brand";
import {
  listMyPurchases,
  restorePurchases,
  reviewPurchaseClaim,
  type BillingTx,
} from "@/lib/billing";
import { skuLabel } from "@/lib/pro";
import { formatShortDate } from "@/lib/tattoo";

export const Route = createFileRoute("/kaeufe")({
  component: KaeufePage,
  head: () => ({ meta: [{ title: `Käufe · ${BRAND.name}` }] }),
});

function KaeufePage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const [items, setItems] = useState<BillingTx[] | null>(null);
  const [credits, setCredits] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [reason, setReason] = useState<"duplicate" | "accidental" | "scan_failed" | "other">(
    "scan_failed",
  );
  const [note, setNote] = useState("");

  async function reload() {
    const res = await listMyPurchases();
    setItems(res.items);
    setCredits(res.credits);
  }

  useEffect(() => {
    void reload().catch(() => setMsg("Käufe konnten nicht geladen werden."));
  }, []);

  async function restore() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await restorePurchases();
      setCredits(res.credits);
      await reload();
      setMsg(
        res.applied
          ? `${res.applied} bezahlte Käufe wurden nachgetragen. Keine neuen Guthaben ohne Zahlung.`
          : `Keine zusätzlichen Käufe. Bereits vorhandene: ${res.already}. Abgelaufene Abos werden nicht verlängert.`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Wiederherstellen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await reviewPurchaseClaim({ data: { reason, message: note } });
      setCredits(res.credits ?? credits);
      await reload();
      setMsg(`${res.title} ${res.body}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Prüfung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="Konto" title="Käufe wiederherstellen">
        Nur nachweislich bezahlte und gültige Käufe. Keine neuen kostenlosen Scans, kein
        Extra-Guthaben, keine Verlängerung abgelaufener Abos, keine Reaktivierung verbrauchter
        Einzel-Scans.
      </PageIntro>

      <p className="text-sm text-muted-foreground">
        Scan-Guthaben aktuell: {credits}. Verbrauchte Scans bleiben verbraucht.
      </p>

      <Button className="min-h-12 w-full rounded-xl" disabled={busy} onClick={() => void restore()}>
        {busy ? "Prüfe Zahlungsdaten…" : "Käufe wiederherstellen"}
      </Button>

      <section className="space-y-3">
        {(items ?? []).length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm">Noch keine Transaktionen.</p>
        ) : (
          (items ?? []).map((t) => (
            <article key={t.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
              <p className="kicker text-primary">{skuLabel(t.sku)}</p>
              <p className="mt-1 text-sm">
                {(t.amountCents / 100).toFixed(2).replace(".", ",")} € · {t.status} · {t.fulfillment}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatShortDate(t.createdAt)}
                {t.stripeSessionId ? ` · ${t.stripeSessionId.slice(0, 18)}…` : ""}
              </p>
            </article>
          ))
        )}
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Kauf prüfen</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Rückerstattungen oder Gutschriften erfolgen nicht allein aufgrund einer Behauptung.
          Die App prüft Transaktions-ID, Zahlungsstatus und Scan-Protokolle. Keine automatische
          Gelderstattung.
        </p>
        <label className="mt-4 block text-sm font-medium" htmlFor="claim-reason">
          Grund
        </label>
        <select
          id="claim-reason"
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
        >
          <option value="duplicate">Doppelte Zahlung</option>
          <option value="accidental">Aus Versehen gekauft</option>
          <option value="scan_failed">Scan hat nicht funktioniert</option>
          <option value="other">Sonstiges</option>
        </select>
        <label className="mt-4 block text-sm font-medium" htmlFor="claim-note">
          Nachricht (optional, ändert die Entscheidung nicht)
        </label>
        <textarea
          id="claim-note"
          className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm"
          maxLength={400}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          variant="outline"
          className="mt-4 min-h-12 w-full rounded-xl"
          disabled={busy}
          onClick={() => void claim()}
        >
          Anhand der Daten prüfen
        </Button>
      </section>

      {msg ? <p className="text-sm">{msg}</p> : null}

      <p className="text-xs text-muted-foreground">
        Gesetzliche Rechte und Regeln des Zahlungsanbieters bleiben unberührt. Sie werden nicht
        durch eine automatische App-Gutschrift ersetzt. Siehe{" "}
        <Link to="/widerruf" className="underline">
          Widerruf
        </Link>
        .
      </p>
      <Disclaimer compact />
    </div>
  );
}
