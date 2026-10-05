import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceTag } from "@/components/source-tag";
import { PageIntro } from "@/components/page-intro";
import { DepositSplit } from "@/components/deposit-split";
import { loadPlan, savePlan, type PlanItem } from "@/lib/planner";
import { loadPayments, type Payment } from "@/lib/payments";
import { DEPOSIT_PERCENT, euro } from "@/lib/pricing";
import { useConsent } from "@/lib/consent-store";
import { RequireAuth } from "@/components/require-auth";
import { listPlanItems, listReceipts, replacePlanItems } from "@/lib/account";

export const Route = createFileRoute("/planer")({
  component: PlanerPage,
  head: () => ({ meta: [{ title: "Termine · ENDLICH OHNE" }] }),
});

const PHASES = [
  { t: "Behandlung 1", d: `${DEPOSIT_PERCENT} % Anzahlung, Rest vor Ort` },
  { t: "Heilungsphase", d: "Abstand legt der Betrieb fest" },
  { t: "Behandlung 2", d: `${DEPOSIT_PERCENT} % Anzahlung, Rest vor Ort` },
  { t: "Heilungsphase", d: "Abstand legt der Betrieb fest" },
  { t: "Behandlung 3", d: `${DEPOSIT_PERCENT} % Anzahlung, Rest vor Ort` },
];

function PlanerPage() {
  return (
    <RequireAuth>
      <PlanerInner />
    </RequireAuth>
  );
}

function PlanerInner() {
  const { consent } = useConsent();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [title, setTitle] = useState("Behandlung");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    void listPlanItems()
      .then((rows) => {
        setItems(rows);
        savePlan(rows);
      })
      .catch(() => setItems(loadPlan()));
    void listReceipts()
      .then((rows) => {
        setPays(rows);
      })
      .catch(() => setPays(loadPayments()));
  }, []);

  function persist(next: PlanItem[]) {
    setItems(next);
    savePlan(next);
    void replacePlanItems({ data: next }).catch(() => undefined);
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<SourceTag kind="nutzer" />}
        kicker="In deinem Konto"
        title="Sitzungsplaner"
      >
        {DEPOSIT_PERCENT} % Anzahlung je Sitzung, {100 - DEPOSIT_PERCENT} % vor Ort.
        Termine liegen in deinem Konto. Keine medizinische Anweisung.
      </PageIntro>

      <DepositSplit totalCents={24000} compact />

      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link to="/zahlung">
          {DEPOSIT_PERCENT} % Anzahlung zahlen
        </Link>
      </Button>

      <ol className="space-y-2">
        {PHASES.map((l, i) => (
          <li
            key={`${l.t}-${i}`}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-primary">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-medium">{l.t}</span>
              <span className="text-xs text-muted-foreground">{l.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Schema zur Orientierung – keine Vorgabe für deine Behandlung.
      </p>

      {pays.length > 0 ? (
        <section className="space-y-2">
          <p className="kicker text-primary">Anzahlungen</p>
          <ul className="space-y-2">
            {pays.map((p) => (
              <li key={p.id}>
                <Link
                  to="/zahlung/$id"
                  params={{ id: p.id }}
                  className="block rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
                >
                  <span className="block font-medium tabular-nums">
                    {euro(p.depositCents)}{" "}
                    {p.status === "paid" ? "bezahlt" : "offen"}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {p.sizeLabel}
                    {p.locationName ? ` · ${p.locationName}` : ""} · Rest{" "}
                    {euro(p.restCents)} vor Ort
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form
        className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!date) return;
          persist([
            ...items,
            { id: crypto.randomUUID(), title: title.trim() || "Termin", date, note },
          ]);
          setNote("");
        }}
      >
        <p className="kicker text-primary">Termin merken</p>
        <div>
          <Label htmlFor="pt">Titel</Label>
          <Input id="pt" className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pd">Datum</Label>
          <Input
            id="pd"
            type="date"
            className="mt-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="pn">Notiz</Label>
          <Input id="pn" className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button type="submit" className="w-full rounded-xl">
          Termin merken
        </Button>
      </form>

      {consent.notifications ? (
        <p className="text-xs text-muted-foreground">
          Erinnerungen sind vorgemerkt, ein Push-Dienst ist in dieser Version nicht
          aktiv (kein Firebase, kein APNs).
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Optionale Erinnerungen kannst du unter Profil einschalten – derzeit ohne
          Push-Versand.
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          Noch keine eigenen Termine auf diesem Gerät.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]"
            >
              <span>
                <span className="block font-medium">{it.title}</span>
                <span className="text-sm text-muted-foreground">
                  {it.date}
                  {it.note ? ` · ${it.note}` : ""}
                </span>
                {it.depositCents != null ? (
                  <span className="mt-1 block text-xs text-primary">
                    Anzahlung {euro(it.depositCents)} · Rest {euro(it.restCents ?? 0)}
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => persist(items.filter((x) => x.id !== it.id))}
              >
                Entfernen
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
