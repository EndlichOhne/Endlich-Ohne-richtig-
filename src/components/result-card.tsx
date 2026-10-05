import { Link } from "@tanstack/react-router";
import { BeforeAfter } from "@/components/before-after";
import { SourceTag } from "@/components/source-tag";
import {
  GALLERY_DISCLAIMER,
  LOCATION_LABEL,
  SIZE_LABEL,
  STATUS_LABEL,
  type GalleryResult,
} from "@/lib/gallery";

export function ResultCard({ result, priority = false }: { result: GalleryResult; priority?: boolean }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
      <BeforeAfter
        before={result.beforeUrl}
        after={result.currentUrl}
        afterLabel="Aktuell"
        priority={priority}
        className="p-3 pb-0"
      />
      <div className="space-y-3 p-5 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {result.isDemo ? <SourceTag kind="demo" /> : <SourceTag kind="nutzer" />}
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {STATUS_LABEL[result.progressStatus]}
          </span>
        </div>
        <div>
          <p className="kicker text-primary">Vorher / Nachher</p>
          <h2 className="mt-1 font-display text-2xl">{LOCATION_LABEL[result.bodyLocation]}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.colors.join(", ") || "Farbe nicht angegeben"}
            {result.sizeLabel ? ` · ${result.sizeLabel}` : ` · ${SIZE_LABEL[result.sizeKey]}`}
            {` · ${result.sessionCount} Sitzungen`}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{GALLERY_DISCLAIMER}</p>
        <Link
          to="/ergebnisse/$id"
          params={{ id: result.id }}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Verlauf ansehen
        </Link>
      </div>
    </article>
  );
}
