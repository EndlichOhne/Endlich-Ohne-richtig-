import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { SourceTag } from "@/components/source-tag";
import { RequireAuth } from "@/components/require-auth";
import { ConsentCheck } from "@/components/consent-check";
import { PhotoInput } from "@/components/photo-input";
import { BeforeAfter } from "@/components/before-after";
import { MaskDraw } from "@/components/mask-draw";
import { KiStatus } from "@/components/ki-status";
import { BRAND } from "@/lib/brand";
import { getPreviewAccess, runPreview, type PreviewAccess } from "@/lib/preview-api";
import { simulateRemoval } from "@/lib/preview-local";
import { ScanPaywall } from "@/components/scan-paywall";
import { isLimitError } from "@/lib/premium";

export const Route = createFileRoute("/vorschau")({
  component: VorschauPage,
  head: () => ({ meta: [{ title: `KI-Vorschau · ${BRAND.name}` }] }),
});

const SIM_NOTE =
  "Das Ergebnis ist eine KI-generierte Simulation. Keine Garantie, kein typisches Ergebnis, keine Aussage darüber, wie die Haut nach einer echten Laserbehandlung aussieht.";

function VorschauPage() {
  return (
    <RequireAuth>
      <VorschauInner />
    </RequireAuth>
  );
}

function VorschauInner() {
  const [access, setAccess] = useState<PreviewAccess | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [mask, setMask] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [via, setVia] = useState<"ki" | "local" | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showMask, setShowMask] = useState(false);
  const [locked, setLocked] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    void getPreviewAccess()
      .then((a) => {
        setAccess(a);
        setLocked(!a.canRun);
      })
      .catch(() => setAccess(null));
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  async function run() {
    if (!photo) {
      setErr("Bitte zuerst ein Foto aufnehmen oder hochladen.");
      return;
    }
    if (!consent) {
      setErr("Bitte die Einwilligung zur KI-Bearbeitung setzen.");
      return;
    }
    if (access && !access.canRun) {
      setLocked(true);
      return;
    }
    setBusy(true);
    setErr(null);
    setAfter(null);
    setVia(null);
    const steps = ["Tattoo wird erkannt…", "Hautstruktur wird angeglichen…", "Vorschau wird aufgebaut…"];
    let i = 0;
    setPhase(steps[0]);
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      i = (i + 1) % steps.length;
      setPhase(steps[i]);
    }, 1400);
    try {
      const res = await runPreview({ data: { image: photo, mask: mask ?? undefined, consent: true } });
      if (res.ok) {
        setAfter(res.image);
        setVia("ki");
        setAccess((a) =>
          a
            ? { ...a, canRun: a.isPro, freeUsed: a.isPro ? a.freeUsed : true, freeLeft: a.isPro ? a.freeLeft : 0 }
            : a,
        );
        return;
      }
      if (res.code === "pro") {
        setLocked(true);
        setErr(res.error);
        return;
      }
      const local = await simulateRemoval(photo, mask);
      setAfter(local);
      setVia("local");
      setErr(res.error);
    } catch (e) {
      try {
        if (photo) {
          const local = await simulateRemoval(photo, mask);
          setAfter(local);
          setVia("local");
        }
      } catch {
        setErr(e instanceof Error ? e.message : "Vorschau fehlgeschlagen.");
      }
    } finally {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      setPhase("");
      setBusy(false);
    }
  }

  function reset() {
    setPhoto(null);
    setMask(null);
    setAfter(null);
    setVia(null);
    setErr(null);
    setShowMask(false);
  }

  async function save() {
    if (!after) return;
    const a = document.createElement("a");
    a.href = after;
    a.download = "endlich-ohne-vorschau.jpg";
    a.click();
  }

  async function share() {
    if (!after || !navigator.share) return;
    try {
      const blob = await (await fetch(after)).blob();
      const file = new File([blob], "endlich-ohne-vorschau.jpg", { type: blob.type || "image/jpeg" });
      await navigator.share({
        title: "ENDLICH OHNE Vorschau",
        text: SIM_NOTE,
        files: [file],
      });
    } catch {
      /* user cancel */
    }
  }

  if (locked) {
    return (
      <div className="fade-up space-y-6">
        <PageIntro kicker="PRO" title="KI-Entfernungsvorschau">
          Erstelle mit unserer KI eine realistische Vorschau, wie deine Haut ohne
          Tattoo aussehen könnte.
        </PageIntro>
        <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="kicker text-primary">Einmal getestet</p>
          <h2 className="mt-2 font-display text-2xl">Weiter mit PRO</h2>
          <p className="mt-2 mb-5 text-sm text-muted-foreground">
            Der kostenlose Test ist in diesem Konto gespeichert — auch nach Neuinstallation.
            PRO schaltet weitere Vorschauen frei. Keine Diagnose, keine Garantie.
          </p>
          <ScanPaywall compact />
        </section>
        <Disclaimer compact />
      </div>
    );
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<KiStatus online={access ? access.online : null} />}
        kicker="KI-Vorschau"
        title="Haut ohne Tattoo"
      >
        Foto aufnehmen, Tattoo erkennen lassen, realistische Simulation erzeugen.
        Einmal kostenlos in diesem Konto, danach PRO. {SIM_NOTE}
      </PageIntro>

      {access?.isPro ? (
        <p className="text-xs text-muted-foreground">PRO · weitere Vorschauen in diesem Konto.</p>
      ) : access ? (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
          Kostenloser Test: {access.freeLeft === 1 ? "1 Vorschau in diesem Konto" : "bereits genutzt"}.
          Nicht über Neuinstallation erneut verfügbar.
        </p>
      ) : null}

      {after && photo ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {via === "ki" ? <SourceTag kind="ki" /> : <SourceTag kind="algorithmisch" />}
            <SourceTag kind="allgemein" />
          </div>
          <BeforeAfter before={photo} after={after} beforeLabel="Mit Tattoo" afterLabel="Simulation" priority />
          <p className="text-xs text-muted-foreground">{SIM_NOTE}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" className="min-h-12 rounded-xl" onClick={() => void save()}>
              Speichern
            </Button>
            {"share" in navigator ? (
              <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={() => void share()}>
                Teilen
              </Button>
            ) : (
              <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={reset}>
                Neues Foto
              </Button>
            )}
          </div>
          <Button type="button" variant="outline" className="min-h-12 w-full rounded-xl" onClick={reset}>
            Andere Aufnahme
          </Button>
        </>
      ) : (
        <>
          {photo ? (
            showMask ? (
              <MaskDraw photo={photo} onMask={setMask} />
            ) : (
              <img src={photo} alt="Aufnahme, nur in dieser Sitzung" className="max-h-80 w-full rounded-2xl object-cover" />
            )
          ) : null}
          <PhotoInput onReady={(url) => { setPhoto(url); setAfter(null); setMask(null); }} />
          {photo ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full rounded-xl"
              onClick={() => setShowMask((v) => !v)}
            >
              {showMask ? "Markierung ausblenden" : "Tattoo selbst markieren"}
            </Button>
          ) : null}

          <ConsentCheck
            id="preview-ki"
            required
            checked={consent}
            onChange={setConsent}
            label="Ich willige ein, dass dieses Foto einmalig an den KI-Dienst zur Bildbearbeitung gesendet wird."
            hint="Nicht in unserer Datenbank, nicht zum Training durch uns. Das Ergebnis bleibt in dieser Sitzung auf dem Gerät, bis du es speicherst. Du kannst die Einwilligung verweigern — dann startet keine Online-Vorschau."
          />

          <Button className="min-h-12 w-full rounded-xl" disabled={busy || !photo} onClick={() => void run()}>
            {busy ? phase || "KI-Vorschau erstellen…" : "KI-Vorschau erstellen"}
          </Button>
        </>
      )}

      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {err && isLimitError(err) ? (
        <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
          <Link to="/pro">PRO ansehen</Link>
        </Button>
      ) : null}
      {via === "local" ? (
        <p className="text-xs text-muted-foreground">
          Online-KI war gerade nicht erreichbar. Angezeigt ist eine grobe Simulation auf dem Gerät — kein KI-Studioergebnis.
        </p>
      ) : null}

      <section className="rounded-2xl bg-card p-5 text-sm shadow-[var(--shadow-border)]">
        <p className="kicker text-primary">Ablauf</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Foto wählen oder Kamera</li>
          <li>Optional den Bereich markieren</li>
          <li>Einwilligung setzen</li>
          <li>Vorschau erzeugen und Slider vergleichen</li>
        </ol>
      </section>
      <Disclaimer compact />
    </div>
  );
}
