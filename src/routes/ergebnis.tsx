import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { SourceTag } from "@/components/source-tag";
import { PageIntro } from "@/components/page-intro";
import { DepositSplit } from "@/components/deposit-split";
import {
  AGE_LABEL,
  EMPTY_CHECK,
  KIND_LABEL,
  ORIGIN_LABEL,
  REGION_LABEL,
  SIZE_LABEL,
  estimateFrom,
  loadCheck,
  type CheckAnswers,
} from "@/lib/check";
import { DEPOSIT_PERCENT, findBand } from "@/lib/pricing";
import { RequireAuth } from "@/components/require-auth";
import { newId, scoreFromCheck } from "@/lib/tattoo";
import { upsertTattoo } from "@/lib/tattoo-api";

export const Route = createFileRoute("/ergebnis")({
  component: ErgebnisPage,
  head: () => ({ meta: [{ title: "Einschätzung · ENDLICH OHNE" }] }),
});

function ErgebnisPage() {
  return (
    <RequireAuth>
      <ErgebnisInner />
    </RequireAuth>
  );
}

function ErgebnisInner() {
  const navigate = useNavigate();
  const [a, setA] = useState<CheckAnswers>(EMPTY_CHECK);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  useEffect(() => {
    setA(loadCheck());
  }, []);
  const complete = Boolean(a.kind && a.size && a.colors.length && a.age && a.origin && a.region);
  const est = useMemo(() => estimateFrom(a), [a]);
  const band = findBand(a.size);

  if (!complete) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Noch unvollständig</h1>
        <p className="text-sm text-muted-foreground">
          Der Check ist nicht fertig. Ohne Angaben gibt es keine Einschätzung.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/check">Check fortsetzen</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-up space-y-8">
      <PageIntro
        tag={<SourceTag kind="algorithmisch" />}
        kicker="Unverbindlich"
        title="Deine erste Einschätzung"
      >
        Auf Basis deiner Angaben könnte die Entfernung eher zu einer Behandlung
        mit mehreren Sitzungen passen. Das ist keine Diagnose.
      </PageIntro>

      <div className="grid grid-cols-1 gap-3">
        <section className="rounded-2xl bg-hero p-5 text-hero-foreground">
          <p className="kicker text-accent">Mögliche Sitzungen</p>
          <p className="mt-2 font-display text-3xl">{est.sessionsLabel}</p>
          <p className="mt-3 text-sm text-hero-foreground/75">
            Die tatsächliche Anzahl hängt unter anderem von Pigmentfarbe,
            Pigmentdichte, Tiefe, Hauttyp, Körperregion, Alter des Tattoos und
            individueller Reaktion ab. Niemals als Garantie zu verstehen.
          </p>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="kicker text-primary">Beispielpreise / Richtwerte</p>
          <p className="mt-2 font-display text-2xl">{est.priceLabel}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Beispielhafte Behandlungskosten können – abhängig von Größe und Aufwand
            – etwa im Bereich von 80 € bis 600 € pro Behandlung liegen. Das sind
            keine verbindlichen Angebote.
          </p>
          <p className="mt-3 text-sm font-medium">
            Die Gesamtkosten können erst nach individueller Einschätzung seriös
            bestimmt werden.
          </p>
        </section>
      </div>

      <section>
        <p className="kicker text-primary">Je Sitzung</p>
        <h2 className="mt-2 font-display text-2xl">
          {DEPOSIT_PERCENT} % Anzahlung, Rest vor Ort
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Am Beispiel deiner Flächenangabe ({SIZE_LABEL[a.size!]}).
        </p>
        <div className="mt-4">
          <DepositSplit totalCents={band.totalCents} />
        </div>
      </section>

      <img
        src="/images/laser-hq.webp"
        alt=""
        width={1200}
        height={800}
        className="h-44 w-full rounded-2xl object-cover"
        loading="lazy"
        decoding="async"
      />

      <section>
        <h2 className="font-display text-2xl">Berücksichtigte Faktoren</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {est.factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          {a.kind ? KIND_LABEL[a.kind] : ""} · {a.size ? SIZE_LABEL[a.size] : ""} ·{" "}
          {a.colors.join(", ")} · {a.age ? AGE_LABEL[a.age] : ""} ·{" "}
          {a.origin ? ORIGIN_LABEL[a.origin] : ""} · {a.region ? REGION_LABEL[a.region] : ""}
        </p>
      </section>

      <ul className="space-y-2 text-sm text-muted-foreground">
        {est.caveats.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <Disclaimer />

      <div className="flex flex-col gap-3">
        <Button
          className="min-h-12 rounded-xl"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setSaveErr(null);
            try {
              const scored = scoreFromCheck(a);
              const id = newId("t");
              await upsertTattoo({
                data: {
                  id,
                  name: a.region ? `Tattoo ${REGION_LABEL[a.region]}` : "Tattoo aus Check",
                  kind: a.kind ?? "tattoo",
                  bodyLocation: a.region ? REGION_LABEL[a.region] : "",
                  sizeKey: a.size ?? "",
                  widthCm: a.widthCm,
                  heightCm: a.heightCm,
                  colors: a.colors,
                  originGuess: a.origin ?? "",
                  ...scored,
                  analysisJson: "{}",
                  progress: 0,
                  journalWhy: "",
                  source: "check",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              });
              await navigate({ to: "/akte/$id", params: { id } });
            } catch (e) {
              setSaveErr(e instanceof Error ? e.message : "Konnte nicht speichern.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Speichert…" : "In die Akte übernehmen"}
        </Button>
        {saveErr ? <p className="text-sm text-destructive">{saveErr}</p> : null}
        <Button asChild className="min-h-12 rounded-xl" variant="secondary">
          <Link
            to="/zahlung"
            onClick={() => {
              if (a.size) sessionStorage.setItem("eo-z-size", a.size);
            }}
          >
            {DEPOSIT_PERCENT} % Anzahlung
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-12 rounded-xl">
          <Link to="/anbieter">Professionelle Beratung finden</Link>
        </Button>
        <Button asChild variant="ghost" className="min-h-12 rounded-xl">
          <Link to="/check">Angaben ändern</Link>
        </Button>
      </div>
    </div>
  );
}
