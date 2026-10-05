import { useCallback, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BeforeAfter({
  before,
  after,
  beforeLabel = "Vorher",
  afterLabel = "Nachher",
  className,
  priority = false,
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  priority?: boolean;
}) {
  const [v, setV] = useState(52);
  const stage = useRef<HTMLDivElement>(null);

  const fromX = useCallback((clientX: number) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / Math.max(1, r.width)) * 100;
    setV(Math.min(96, Math.max(4, pct)));
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={stage}
        className="relative aspect-[3/4] touch-none overflow-hidden rounded-2xl bg-hero select-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          fromX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromX(e.clientX);
        }}
        role="slider"
        aria-label="Vorher-Nachher-Vergleich"
        aria-valuemin={4}
        aria-valuemax={96}
        aria-valuenow={Math.round(v)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setV((x) => Math.max(4, x - 4));
          if (e.key === "ArrowRight") setV((x) => Math.min(96, x + 4));
        }}
      >
        <img
          src={after}
          alt={afterLabel}
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          loading={priority ? "eager" : "lazy"}
        />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - v}% 0 0)` }}>
          <img
            src={before}
            alt={beforeLabel}
            className="absolute inset-0 size-full object-cover"
            draggable={false}
            loading={priority ? "eager" : "lazy"}
          />
        </div>
        <div
          className="absolute inset-y-0 z-10 w-11 -translate-x-1/2"
          style={{ left: `${v}%` }}
          aria-hidden
        >
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-hero-foreground" />
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-hero-foreground text-hero shadow-[var(--shadow-border)]">
            <ChevronsLeftRight className="size-5" strokeWidth={2} />
          </span>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-hero/70 px-2.5 py-1 text-xs font-medium text-hero-foreground">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-hero/70 px-2.5 py-1 text-xs font-medium text-hero-foreground">
          {afterLabel}
        </span>
      </div>
      <label className="block text-xs text-muted-foreground">
        Ziehen zum Vergleichen
        <input
          type="range"
          min={4}
          max={96}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          className="mt-1 h-11 w-full accent-primary"
        />
      </label>
    </div>
  );
}
