import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { SourceTag } from "@/components/source-tag";
import { RequireAuth } from "@/components/require-auth";
import { ConsentCheck } from "@/components/consent-check";
import { PhotoInput } from "@/components/photo-input";
import { ScoreCard } from "@/components/score-card";
import { BRAND } from "@/lib/brand";
import { analyzeTattooPhoto, getAiUsage, type ScanResult } from "@/lib/ai-tattoo";
import { upsertTattoo } from "@/lib/tattoo-api";
import { COST_DISCLAIMER, costPlan, newId, type TattooRecord } from "@/lib/tattoo";
import { savePhotoForTattoo } from "@/lib/tattoo-photos";
import { analyzePhotoLocal } from "@/lib/photo-score";
import { euro } from "@/lib/pricing";
import { isLimitError } from "@/lib/premium";
import { KiStatus } from "@/components/ki-status";
import { PreviewPromo } from "@/components/preview-promo";
import { ScanPaywall } from "@/components/scan-paywall";

export const Route = createFileRoute("/scanner")({
  component: ScannerPage,
  head: () => ({ meta: [{ title: `KI-Scanner · ${BRAND.name}` }] }),
});

function recFromScan(r: ScanResult, local: boolean): TattooRecord {
  const id = newId("t");
  return {
    id,
    name: r.region ? `Tattoo ${r.region}` : "Neues Tattoo",
    kind: "tattoo",
    bodyLocation: r.region,
    sizeKey: r.sizeKey,
    widthCm: "",
    heightCm: "",
    colors: r.colors,
    originGuess: r.originGuess,
    difficulty: r.difficulty,
    sessionsLow: r.sessionsLow,
    sessionsHigh: r.sessionsHigh,
    sessionCostLow: r.sessionCostLow,
    sessionCostHigh: r.sessionCostHigh,
    intensity: r.intensity,
    complexity: r.complexity,
    colorLevel: r.colorLevel,
    sizeLevel: r.sizeLevel,
    whyText: r.why,
    factors: r.factors,
    analysisJson: JSON.stringify({ ...r, local }),
    progress: 0,
    journalWhy: "",
    source: "scan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function ScannerPage() {
  return (
    <RequireAuth>
      <ScannerInner />
    </RequireAuth>
  );
}

function ScannerInner() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [ki, setKi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<TattooRecord | null>(null);
  const [localNote, setLocalNote] = useState(false);
  const [usage, setUsage] = useState<{
    scans: number;
    isPro?: boolean;
    online?: boolean;
    scanCredits?: number;
    canScan?: boolean;
  } | null>(null);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    void getAiUsage().then(setUsage).catch(() => undefined);
  }, []);

  async function scan() {
    if (!photo) {
      setErr("Bitte lade ein Tattoo-Foto hoch.");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine && ki) {
      setErr("Keine Internetverbindung. Du kannst ohne Online-KI auf dem Gerät schätzen.");
    }
    setBusy(true);
    setErr(null);
    setLocalNote(false);
    setPaywall(false);
    try {
      if (ki) {
        if (usage && !usage.isPro && !usage.canScan) {
          setPaywall(true);
          setErr("Für die Online-KI bitte eine Option wählen.");
          return;
        }
        const res = await analyzeTattooPhoto({ data: { image: photo, hint } });
        if (res.ok) {
          setDraft(recFromScan(res.result, false));
          setUsage((u) =>
            u
              ? {
                  ...u,
                  scans: u.scans + 1,
                  scanCredits: u.isPro ? u.scanCredits : Math.max(0, (u.scanCredits ?? 1) - 1),
                  canScan: Boolean(u.isPro || (u.scanCredits ?? 1) - 1 > 0),
                }
              : u,
          );
          return;
        }
        if (res.code === "limit" || res.code === "paywall") {
          setPaywall(true);
          setErr(res.error);
          return;
        }
        if (res.code === "photo") {
          setErr(res.error);
          return;
        }
      }
      const local = await analyzePhotoLocal(photo, hint);
      if (local.photoQuality === "poor") {
        setErr(local.photoQualityNote);
        return;
      }
      setDraft(recFromScan(local, true));
      setLocalNote(true);
    } catch {
      setErr("Die Analyse ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr(null);
    try {
      await upsertTattoo({ data: draft });
      if (photo) await savePhotoForTattoo(draft.id, "base", photo, Boolean(usage?.isPro));
      await navigate({ to: "/akte/$id", params: { id: draft.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  const plan = draft ? costPlan(draft) : null;

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<KiStatus online={usage ? Boolean(usage.online) : null} />}
        kicker="Scanner"
        title="Tattoo einschätzen"
      >
        Foto aufnehmen oder hochladen. Online-KI (Grok) liest Farben und Aufwand –
        nur nach deiner Einwilligung. Sonst Schätzung auf diesem Gerät. Keine
        Diagnose, keine Garantie.
      </PageIntro>

      <PreviewPromo />

      {usage?.isPro ? (
        <p className="text-xs text-muted-foreground">
          PRO · unbegrenzte Scans. Fotos bleiben auf dem Gerät.
        </p>
      ) : usage ? (
        <p className="text-xs text-muted-foreground">
          {usage.scanCredits
            ? `Scan-Guthaben: ${usage.scanCredits}. Fotos bleiben auf dem Gerät.`
            : "Kein Scan-Guthaben. Online-KI: 0,50 € pro Scan oder PRO. Fotos bleiben auf dem Gerät."}
        </p>
      ) : null}

      {!draft ? (
        <>
          {photo ? (
            <img src={photo} alt="Vorschau, nur lokal" className="max-h-72 w-full rounded-2xl object-cover" />
          ) : null}
          <PhotoInput onReady={setPhoto} />
          <div>
            <Label htmlFor="hint">Hinweis (optional)</Label>
            <Input
              id="hint"
              className="mt-2"
              placeholder="z. B. Unterarm, 8 Jahre alt"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
          </div>
          <ConsentCheck
            id="ki-scan"
            checked={ki}
            onChange={setKi}
            label="Online-KI (Grok) nutzen – Foto einmalig an xAI senden."
            hint="Kein Training durch ENDLICH OHNE. Kein Speichern des Fotos auf unserem Server. Ohne Haken bleibt die Schätzung auf dem Gerät."
          />
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          {paywall || (err && isLimitError(err)) ? (
            <ScanPaywall
              compact
              onActivated={() => {
                setPaywall(false);
                setErr(null);
                void getAiUsage().then(setUsage).catch(() => undefined);
              }}
            />
          ) : null}
          <Button className="min-h-12 w-full rounded-xl" disabled={busy || !photo} onClick={() => void scan()}>
            {busy ? "Online-KI analysiert…" : ki ? "Mit Online-KI einschätzen" : "Auf dem Gerät schätzen"}
          </Button>
        </>
      ) : (
        <>
          {photo ? (
            <img src={photo} alt="" className="max-h-56 w-full rounded-2xl object-cover" />
          ) : null}
          {localNote ? (
            <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
              <SourceTag kind="algorithmisch" className="mb-2" />
              <span className="mt-2 block">
                Online-KI war nicht erreichbar oder nicht gewählt. Einschätzung über
                Fotoanalyse auf dem Gerät – unverbindlich, keine Diagnose.
              </span>
            </p>
          ) : (
            <SourceTag kind="ki" />
          )}
          <ScoreCard tattoo={draft} />
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="kicker text-primary">Warum diese Einschätzung</p>
            <p className="mt-2 text-sm">{draft.whyText}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {draft.factors.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="kicker text-primary">Kostenplaner</p>
            <p className="mt-2 font-display text-2xl">
              {draft.sessionsLow}–{draft.sessionsHigh} Sitzungen
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {draft.sessionCostLow}–{draft.sessionCostHigh} € pro Sitzung (Richtwert)
            </p>
            <div className="mt-4 grid gap-2">
              {plan
                ? Object.values(plan).map((p) => (
                    <div key={p.label} className="flex items-center justify-between rounded-xl bg-muted px-3 py-3 text-sm">
                      <span>
                        {p.label}
                        <span className="mt-0.5 block text-xs text-muted-foreground">{p.hint}</span>
                      </span>
                      <span className="text-right tabular-nums">
                        {p.sessions} × {p.per} €
                        <span className="mt-0.5 block font-medium">{euro(p.total * 100)}</span>
                      </span>
                    </div>
                  ))
                : null}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{COST_DISCLAIMER}</p>
          </section>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <Button className="min-h-12 w-full rounded-xl" disabled={busy} onClick={() => void save()}>
            In die Akte übernehmen
          </Button>
          <Button variant="outline" className="min-h-12 w-full rounded-xl" onClick={() => { setDraft(null); setLocalNote(false); }}>
            Anderes Foto
          </Button>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Ohne Foto bleibt der <Link to="/check" className="underline">Frage-Check</Link> nutzbar.
      </p>
      <Disclaimer compact />
    </div>
  );
}
