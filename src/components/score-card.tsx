import { cn } from "@/lib/utils";
import {
  BAND_LABEL,
  LEVEL_LABEL,
  scoreBand,
  type Level,
  type TattooRecord,
} from "@/lib/tattoo";

function Dot({ band }: { band: ReturnType<typeof scoreBand> }) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 rounded-full",
        band === "easy" && "bg-primary",
        band === "mid" && "bg-draft",
        band === "hard" && "bg-destructive",
      )}
      aria-hidden
    />
  );
}

function Row({ k, v, level }: { k: string; v: string; level?: Level }) {
  const band = level === "low" ? "easy" : level === "high" ? "hard" : "mid";
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="inline-flex items-center gap-2 font-medium">
        {level ? <Dot band={band} /> : null}
        {v}
      </span>
    </div>
  );
}

export function ScoreCard({ tattoo }: { tattoo: Pick<TattooRecord, "difficulty" | "sizeLevel" | "colorLevel" | "intensity" | "complexity"> }) {
  const band = scoreBand(tattoo.difficulty);
  return (
    <section className="rounded-2xl bg-hero p-5 text-hero-foreground">
      <p className="kicker text-accent">Removal Score</p>
      <p className="mt-2 font-display text-5xl tabular-nums">
        {tattoo.difficulty.toFixed(1)}
        <span className="text-2xl text-hero-foreground/50"> / 10</span>
      </p>
      <p className="mt-2 inline-flex items-center gap-2 text-sm">
        <Dot band={band} />
        {BAND_LABEL[band]}
      </p>
      <div className="mt-5 divide-y divide-hero-foreground/10">
        <Row k="Größe" v={LEVEL_LABEL[tattoo.sizeLevel]} level={tattoo.sizeLevel} />
        <Row k="Farben" v={LEVEL_LABEL[tattoo.colorLevel]} level={tattoo.colorLevel} />
        <Row k="Pigmentintensität" v={LEVEL_LABEL[tattoo.intensity]} level={tattoo.intensity} />
        <Row k="Komplexität" v={LEVEL_LABEL[tattoo.complexity]} level={tattoo.complexity} />
        <Row k="Entfernung" v={BAND_LABEL[band]} />
      </div>
      <p className="mt-4 text-xs text-hero-foreground/60">
        Algorithmische bzw. KI-Schätzung – keine Diagnose, keine Garantie.
      </p>
    </section>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="tabular-nums font-medium">{v} %</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
