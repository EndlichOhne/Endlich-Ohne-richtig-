import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { RequireAuth } from "@/components/require-auth";
import { BRAND } from "@/lib/brand";
import { listMyResults } from "@/lib/gallery-api";
import {
  LOCATION_LABEL,
  MOD_LABEL,
  STATUS_LABEL,
  type GalleryResult,
} from "@/lib/gallery";

export const Route = createFileRoute("/ergebnisse/meine")({
  component: MeinePage,
  head: () => ({ meta: [{ title: `Meine Einreichungen · ${BRAND.name}` }] }),
});

function MeinePage() {
  return (
    <RequireAuth>
      <MeineInner />
    </RequireAuth>
  );
}

function MeineInner() {
  const [items, setItems] = useState<GalleryResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void listMyResults()
      .then(setItems)
      .catch(() => setErr("Einreichungen konnten nicht geladen werden."));
  }, []);

  return (
    <div className="fade-up space-y-6 pb-8">
      <PageIntro kicker="Galerie" title="Meine Einreichungen">
        Öffentlich nur nach Prüfung. Bis dahin siehst du den Status nur hier.
      </PageIntro>
      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link to="/ergebnisse/teilen">Neues Ergebnis einreichen</Link>
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {items === null && !err ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : null}
      {items && items.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-5 text-sm shadow-[var(--shadow-border)]">
          Noch keine Einreichung. Du kannst Vorher/Aktuell teilen – Prüfung durch die Praxis.
        </p>
      ) : null}
      <div className="space-y-3">
        {(items ?? []).map((r) => (
          <article key={r.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div className="flex gap-3">
              <img
                src={r.currentUrl}
                alt=""
                className="size-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{LOCATION_LABEL[r.bodyLocation]}</p>
                <p className="text-sm text-muted-foreground">
                  {STATUS_LABEL[r.progressStatus]} · {r.sessionCount} Sitzungen
                </p>
                <p className="mt-1 text-sm">
                  {r.moderationStatus === "review" || r.moderationStatus === "submitted"
                    ? "Dein Ergebnis wird derzeit überprüft."
                    : MOD_LABEL[r.moderationStatus]}
                </p>
                {r.moderationStatus === "rejected" && r.rejectReason ? (
                  <p className="mt-1 text-xs text-destructive">{r.rejectReason}</p>
                ) : null}
              </div>
            </div>
            {r.moderationStatus === "published" ? (
              <Button asChild variant="outline" className="mt-3 min-h-11 w-full rounded-xl">
                <Link to="/ergebnisse/$id" params={{ id: r.id }}>
                  In der Galerie ansehen
                </Link>
              </Button>
            ) : null}
          </article>
        ))}
      </div>
      <Button asChild variant="ghost" className="min-h-11 w-full rounded-xl">
        <Link to="/ergebnisse">Zur Galerie</Link>
      </Button>
      <Disclaimer compact />
    </div>
  );
}
