import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { BeforeAfter } from "@/components/before-after";
import { SourceTag } from "@/components/source-tag";
import { BRAND } from "@/lib/brand";
import { getGalleryResult } from "@/lib/gallery-api";
import {
  GALLERY_DISCLAIMER,
  LOCATION_LABEL,
  SIZE_LABEL,
  STATUS_LABEL,
  shotLabel,
  type GalleryResult,
  type TimelineShot,
} from "@/lib/gallery";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ergebnisse/$id")({
  component: ErgebnisDetailPage,
  head: ({ params }) => ({
    meta: [{ title: `Tattoo-Reise · ${params.id} · ${BRAND.name}` }],
  }),
});

function ErgebnisDetailPage() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<GalleryResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void getGalleryResult({ data: { id } }).then((res) => {
      if (!live) return;
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setItem(res.result);
      setLeft(res.result.timeline[0]?.id ?? null);
      setRight(res.result.timeline[res.result.timeline.length - 1]?.id ?? null);
    });
    return () => {
      live = false;
    };
  }, [id]);

  const shots = item?.timeline ?? [];
  const a = useMemo(() => shots.find((s) => s.id === left) ?? shots[0], [shots, left]);
  const b = useMemo(
    () => shots.find((s) => s.id === right) ?? shots[shots.length - 1],
    [shots, right],
  );

  if (err) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Nicht verfügbar</h1>
        <p className="text-sm text-muted-foreground">{err}</p>
        <Button asChild className="rounded-xl">
          <Link to="/ergebnisse">Zur Galerie</Link>
        </Button>
      </div>
    );
  }

  if (!item || !a || !b) {
    return <div className="h-[32rem] animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="fade-up space-y-8 pb-8">
      <PageIntro
        tag={item.isDemo ? <SourceTag kind="demo" /> : <SourceTag kind="nutzer" />}
        kicker="Tattoo Removal Journey"
        title={LOCATION_LABEL[item.bodyLocation]}
      >
        {item.description || "Dokumentierter Verlauf – unverbindlich, keine Garantie."}
      </PageIntro>

      <BeforeAfter
        before={a.imageUrl}
        after={b.imageUrl}
        beforeLabel={shotLabel(a)}
        afterLabel={shotLabel(b)}
        priority
      />

      <section className="grid gap-3 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <Row k="Körperstelle" v={LOCATION_LABEL[item.bodyLocation]} />
        <Row k="Größe" v={item.sizeLabel || SIZE_LABEL[item.sizeKey]} />
        <Row k="Farben" v={item.colors.join(", ") || "–"} />
        <Row k="Dokumentierte Sitzungen" v={String(item.sessionCount)} />
        <Row k="Status" v={STATUS_LABEL[item.progressStatus]} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Zeitverlauf</h2>
        <ol className="space-y-4">
          {shots.map((s, i) => (
            <li key={s.id} className="grid grid-cols-[auto_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span className="size-2.5 rounded-full bg-primary" />
                {i < shots.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
              </div>
              <div className={cn("pb-4", i === shots.length - 1 && "pb-0")}>
                <p className="text-sm font-medium">{shotLabel(s)}</p>
                <img
                  src={s.imageUrl}
                  alt={shotLabel(s)}
                  className="mt-2 max-h-64 w-full rounded-xl object-cover"
                  loading="lazy"
                />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {shots.length >= 2 ? (
        <section className="space-y-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl">Bildvergleich</h2>
          <p className="text-sm text-muted-foreground">Zwei Aufnahmen wählen – der Slider oben folgt.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ShotPick label="Bild A" shots={shots} value={a.id} onChange={setLeft} />
            <ShotPick label="Bild B" shots={shots} value={b.id} onChange={setRight} />
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">{GALLERY_DISCLAIMER}</p>
      <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
        <Link to="/ergebnisse">Alle Ergebnisse</Link>
      </Button>
      <Disclaimer compact />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function ShotPick({
  label,
  shots,
  value,
  onChange,
}: {
  label: string;
  shots: TimelineShot[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-kicker text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 grid gap-2">
        {shots.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "min-h-11 rounded-xl px-3 text-left text-sm",
              value === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {shotLabel(s)}
          </button>
        ))}
      </div>
    </div>
  );
}
