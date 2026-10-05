import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { ResultCard } from "@/components/result-card";
import { BRAND } from "@/lib/brand";
import { listPublishedResults } from "@/lib/gallery-api";
import {
  EMPTY_FILTERS,
  FILTER_COLOR,
  FILTER_LOCATION,
  FILTER_SESSIONS,
  FILTER_SIZE,
  FILTER_STATUS,
  matchesFilters,
  type GalleryFilters,
  type GalleryResult,
} from "@/lib/gallery";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/ergebnisse/")({
  component: ErgebnissePage,
  head: () => ({ meta: [{ title: `Echte Ergebnisse · ${BRAND.name}` }] }),
});

function ChipRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-kicker text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-3.5 text-sm font-medium",
              value === o.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground shadow-[var(--shadow-border)]",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErgebnissePage() {
  const { t } = useI18n();
  const [items, setItems] = useState<GalleryResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filters, setFilters] = useState<GalleryFilters>(EMPTY_FILTERS);

  useEffect(() => {
    void listPublishedResults()
      .then(setItems)
      .catch(() => setErr(t("gallery.loadFail")));
  }, []);

  const shown = useMemo(
    () => (items ?? []).filter((r) => matchesFilters(r, filters)),
    [items, filters],
  );
  const active = Object.values(filters).some((v) => v !== "all");

  return (
    <div className="fade-up space-y-8 pb-8">
      <PageIntro kicker={t("gallery.kicker")} title={t("gallery.title")}>
        {t("gallery.subtitle")} {t("gallery.disclaimer")}
      </PageIntro>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="min-h-12 flex-1 rounded-xl">
          <Link to="/ergebnisse/teilen">{t("gallery.share")}</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-12 flex-1 rounded-xl">
          <Link to="/ergebnisse/meine">{t("gallery.mine")}</Link>
        </Button>
      </div>

      <details className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] md:p-5" open>
        <summary className="min-h-12 cursor-pointer list-none text-sm font-medium">
          {t("gallery.filter")}
        </summary>
        <div className="mt-4 space-y-4">
        <ChipRow
          label={t("gallery.color")}
          value={filters.color}
          options={FILTER_COLOR.map((o) => ({
            ...o,
            label: o.id === "all" ? t("filter.all") : t(`gcolor.${o.id}`),
          }))}
          onChange={(color) => setFilters((f) => ({ ...f, color }))}
        />
        <ChipRow
          label={t("gallery.sizeF")}
          value={filters.size}
          options={FILTER_SIZE.map((o) => ({
            ...o,
            label: o.id === "all" ? t("filter.all") : t(`gsize.${o.id}`),
          }))}
          onChange={(size) => setFilters((f) => ({ ...f, size }))}
        />
        <ChipRow
          label={t("gallery.place")}
          value={filters.location}
          options={FILTER_LOCATION.map((o) => ({
            ...o,
            label: o.id === "all" ? t("filter.all") : t(`loc.${o.id}`),
          }))}
          onChange={(location) => setFilters((f) => ({ ...f, location }))}
        />
        <ChipRow
          label={t("gallery.sessions")}
          value={filters.sessions}
          options={FILTER_SESSIONS.map((o) => ({
            ...o,
            label: o.id === "all" ? t("filter.all") : o.label,
          }))}
          onChange={(sessions) => setFilters((f) => ({ ...f, sessions }))}
        />
        <ChipRow
          label={t("gallery.status")}
          value={filters.status}
          options={FILTER_STATUS.map((o) => ({
            ...o,
            label: o.id === "all" ? t("filter.all") : t(`progress.${o.id === "done" ? "done" : o.id}`),
          }))}
          onChange={(status) => setFilters((f) => ({ ...f, status }))}
        />
        {active ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full rounded-xl"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Filter zurücksetzen
          </Button>
        ) : null}
        </div>
      </details>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      {items === null && !err ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-[28rem] animate-pulse rounded-2xl bg-muted" />
          <div className="h-[28rem] animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : shown.length === 0 ? (
        <section className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl">Noch keine veröffentlichten Ergebnisse</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {active
              ? "Keine Treffer für diese Filter. Andere Kombination versuchen."
              : "Sei eine der Ersten, die ihre Tattoo-Removal-Reise dokumentieren."}
          </p>
          <Button asChild className="mt-5 min-h-12 rounded-xl">
            <Link to="/ergebnisse/teilen">Meinen Fortschritt teilen</Link>
          </Button>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {shown.map((r, i) => (
            <ResultCard key={r.id} result={r} priority={i < 2} />
          ))}
        </div>
      )}

      <SignedOut>
        <p className="text-xs text-muted-foreground">
          Einreichen braucht ein Konto. Ansehen ist ohne Anmeldung möglich.
        </p>
      </SignedOut>
      <SignedIn>
        <p className="text-xs text-muted-foreground">
          Öffentliche Bilder nur nach Einwilligung und Prüfung durch die Praxis.
        </p>
      </SignedIn>
      <Disclaimer compact />
    </div>
  );
}
