import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { ConsentCheck } from "@/components/consent-check";
import { PhotoInput } from "@/components/photo-input";
import { RequireAuth } from "@/components/require-auth";
import { Choice, ChoiceGrid } from "@/components/choice-grid";
import { BRAND } from "@/lib/brand";
import { submitGalleryResult } from "@/lib/gallery-api";
import {
  GALLERY_COLORS,
  GALLERY_DISCLAIMER,
  LOCATION_LABEL,
  SIZE_LABEL,
  STATUS_LABEL,
  type GalleryLocation,
  type GallerySize,
  type ProgressStatus,
} from "@/lib/gallery";
import { cropFocus } from "@/lib/tattoo-photos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ergebnisse/teilen")({
  component: TeilenPage,
  head: () => ({ meta: [{ title: `Ergebnis teilen · ${BRAND.name}` }] }),
});

const LOCS = Object.keys(LOCATION_LABEL) as GalleryLocation[];
const SIZES = Object.keys(SIZE_LABEL) as GallerySize[];
const STATS = Object.keys(STATUS_LABEL) as ProgressStatus[];

function TeilenPage() {
  return (
    <RequireAuth>
      <TeilenInner />
    </RequireAuth>
  );
}

function TeilenInner() {
  const navigate = useNavigate();
  const [before, setBefore] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [extra, setExtra] = useState<{ url: string; session: string }[]>([]);
  const [loc, setLoc] = useState<GalleryLocation | null>(null);
  const [size, setSize] = useState<GallerySize | null>(null);
  const [sizeLabel, setSizeLabel] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [sessions, setSessions] = useState("6");
  const [status, setStatus] = useState<ProgressStatus | null>(null);
  const [desc, setDesc] = useState("");
  const [anon, setAnon] = useState(true);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleColor(c: string) {
    setColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c].slice(0, 6)));
  }

  async function maybeCrop(url: string) {
    if (!anon) return url;
    try {
      return await cropFocus(url);
    } catch {
      return url;
    }
  }

  async function submit() {
    if (!before || !current || !loc || !size || !status || colors.length === 0) {
      setErr("Bitte Fotos, Stelle, Größe, Farben und Status angeben.");
      return;
    }
    if (!c1 || !c2) {
      setErr("Ohne Einwilligung wird nichts veröffentlicht.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const b = await maybeCrop(before);
      const c = await maybeCrop(current);
      const timeline = [];
      for (const e of extra) {
        if (!e.url) continue;
        timeline.push({
          imageUrl: await maybeCrop(e.url),
          sessionNumber: Number(e.session) || 0,
        });
      }
      await submitGalleryResult({
        data: {
          beforeUrl: b,
          currentUrl: c,
          bodyLocation: loc,
          sizeKey: size,
          sizeLabel: sizeLabel.trim(),
          colors,
          sessionCount: Number(sessions) || 1,
          progressStatus: status,
          description: desc.trim(),
          anonymize: anon,
          consentPublish: true,
          consentReview: true,
          timeline,
        },
      });
      await navigate({ to: "/ergebnisse/meine" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Einreichen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up space-y-8 pb-8">
      <PageIntro kicker="Teilen" title="Mein Ergebnis teilen">
        Vorher- und aktuelles Foto. Veröffentlichung erst nach Prüfung durch die
        Praxis. Keine Garantie, keine Diagnose.
      </PageIntro>

      <section className="space-y-3">
        <h2 className="font-display text-xl">1. Vorher-Foto</h2>
        {before ? <img src={before} alt="Vorher" className="max-h-56 w-full rounded-2xl object-cover" /> : null}
        <PhotoInput onReady={setBefore} label="Vorher-Foto wählen" />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">2. Aktuelles Foto</h2>
        {current ? <img src={current} alt="Aktuell" className="max-h-56 w-full rounded-2xl object-cover" /> : null}
        <PhotoInput onReady={setCurrent} label="Aktuelles Foto wählen" />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">3. Körperstelle</h2>
        <ChoiceGrid className="grid-cols-2">
          {LOCS.map((k) => (
            <Choice key={k} selected={loc === k} onClick={() => setLoc(k)}>
              {LOCATION_LABEL[k]}
            </Choice>
          ))}
        </ChoiceGrid>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">4. Größe</h2>
        <ChoiceGrid className="grid-cols-3">
          {SIZES.map((k) => (
            <Choice key={k} selected={size === k} onClick={() => setSize(k)}>
              {SIZE_LABEL[k]}
            </Choice>
          ))}
        </ChoiceGrid>
        <div>
          <Label htmlFor="cm">Maß optional</Label>
          <Input
            id="cm"
            className="mt-2"
            placeholder="z. B. 8 × 6 cm"
            value={sizeLabel}
            onChange={(e) => setSizeLabel(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">5. Farben</h2>
        <div className="flex flex-wrap gap-2">
          {GALLERY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleColor(c)}
              className={cn(
                "min-h-11 rounded-full px-3.5 text-sm font-medium",
                colors.includes(c) ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">6. Dokumentierte Sitzungen</h2>
        <Input
          type="number"
          min={1}
          max={30}
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">7. Status</h2>
        <ChoiceGrid>
          {STATS.map((k) => (
            <Choice key={k} selected={status === k} onClick={() => setStatus(k)}>
              {STATUS_LABEL[k]}
            </Choice>
          ))}
        </ChoiceGrid>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">8. Beschreibung optional</h2>
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Kurz, ohne Diagnose. Keine Namen."
          className="min-h-24"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Weitere Fortschrittsfotos</h2>
        {extra.map((e, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
            {e.url ? <img src={e.url} alt="" className="max-h-40 w-full rounded-xl object-cover" /> : null}
            <PhotoInput
              label={`Foto ${i + 1}`}
              onReady={(url) =>
                setExtra((prev) => prev.map((p, idx) => (idx === i ? { ...p, url } : p)))
              }
            />
            <Input
              placeholder="Sitzungsnummer"
              value={e.session}
              onChange={(ev) =>
                setExtra((prev) => prev.map((p, idx) => (idx === i ? { ...p, session: ev.target.value } : p)))
              }
            />
          </div>
        ))}
        {extra.length < 4 ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full rounded-xl"
            onClick={() => setExtra((p) => [...p, { url: "", session: "" }])}
          >
            Foto hinzufügen
          </Button>
        ) : null}
      </section>

      <ConsentCheck
        id="anon"
        checked={anon}
        onChange={setAnon}
        label="Bilder anonymisieren (Zuschnitt auf das Motiv)."
        hint="Kein automatisches Gesichtserkennen in dieser Version. Zuschneiden reduziert Umfeld."
      />
      <ConsentCheck
        id="c1"
        checked={c1}
        onChange={setC1}
        required
        label="Ich bestätige, dass ich die Rechte an diesen Bildern habe und mit der Veröffentlichung in der ENDLICH-OHNE-Ergebnisgalerie einverstanden bin."
      />
      <ConsentCheck
        id="c2"
        checked={c2}
        onChange={setC2}
        required
        label="Meine Bilder können vor der Veröffentlichung überprüft werden."
      />

      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <Button className="min-h-12 w-full rounded-xl" disabled={busy} onClick={() => void submit()}>
        {busy ? "Wird eingereicht…" : "Zur Prüfung senden"}
      </Button>
      <p className="text-xs text-muted-foreground">{GALLERY_DISCLAIMER}</p>
      <Button asChild variant="ghost" className="min-h-11 w-full rounded-xl">
        <Link to="/ergebnisse">Abbrechen</Link>
      </Button>
      <Disclaimer compact />
    </div>
  );
}
