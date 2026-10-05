import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ScanSearch, Bot, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandFilm } from "@/components/brand-film";
import { Disclaimer } from "@/components/disclaimer";
import { LegalDraftBanner } from "@/components/legal-draft-banner";
import { ScanPaywall } from "@/components/scan-paywall";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { BRAND } from "@/lib/brand";
import { FREE_LIMITS } from "@/lib/premium";
import {
  PRO_MONTH_LABEL,
  PRO_PRICE_HINT,
  PRO_YEAR_LABEL,
} from "@/lib/pro";
import { getProStatus, type ProStatus } from "@/lib/pro-api";
import { formatShortDate } from "@/lib/tattoo";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/pro")({
  component: ProPage,
  head: () => ({ meta: [{ title: `PRO · ${BRAND.name}` }] }),
});

function ProPage() {
  const { t } = useI18n();
  const feats = [
    { icon: Sparkles, title: t("pro.feat1"), body: t("home.previewLead") },
    { icon: ScanSearch, title: t("pro.feat2"), body: t("scanner.title") },
    { icon: Bot, title: t("pro.feat3"), body: t("assistant.title") },
    { icon: FolderOpen, title: t("pro.feat4"), body: t("home.akteTitle") },
  ];
  return (
    <div className="fade-up space-y-6">
      <BrandFilm className="min-h-[22rem] md:min-h-[28rem]" priority>
        <p className="kicker mt-8 text-accent">PRO</p>
        <h1 className="mt-3 max-w-lg font-display text-3xl leading-tight md:text-5xl">
          {t("pro.hero")}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-hero-foreground/80">
          {t("pro.heroLead", { price: `${PRO_MONTH_LABEL} oder ${PRO_YEAR_LABEL}` })}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="min-h-12 rounded-xl">
            <Link to="/vorschau">{t("home.previewCta")}</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="min-h-12 rounded-xl bg-hero-foreground text-hero hover:bg-hero-foreground/90"
          >
            <a href="#pro-pay">{t("pro.cta")}</a>
          </Button>
        </div>
      </BrandFilm>

      <SignedIn>
        <div id="pro-pay">
          <ProStatusBlock />
        </div>
      </SignedIn>
      <SignedOut>
        <section id="pro-pay" className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <ScanPaywall />
        </section>
      </SignedOut>

      <div className="grid gap-3 sm:grid-cols-2">
        {feats.map((f) => (
          <article key={f.title} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <f.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-xl">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="kicker text-primary">Free</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>{FREE_LIMITS.tattoos} Tattoos</li>
            <li>Einzel-Scan 0,50 € · kein Abo</li>
            <li>{FREE_LIMITS.chatsPerMonth} KI-Fragen / Monat</li>
            <li>{t("pro.freeBadge")}</li>
          </ul>
        </section>
        <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="kicker text-primary">PRO</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>{t("pro.feat1")}</li>
            <li>{t("pro.feat2")}</li>
            <li>{t("pro.feat3")}</li>
            <li>{t("pro.feat4")}</li>
          </ul>
        </section>
      </div>

      <LegalDraftBanner />
      <p className="text-xs text-muted-foreground">
        {PRO_PRICE_HINT} Widerruf binnen 14 Tagen, soweit gesetzlich vorgesehen. Siehe{" "}
        <Link to="/widerruf" className="underline">
          Widerruf
        </Link>
        . Zahlung nur über Stripe – keine Kartennummer in der App. Abo kündbar zum Periodenende.
      </p>
      <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
        <Link to="/kaeufe">Käufe wiederherstellen</Link>
      </Button>
      <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
        <Link to="/zahlung">25 % Anzahlung für Sitzungen</Link>
      </Button>
      <Disclaimer compact />
    </div>
  );
}

function ProStatusBlock() {
  const [status, setStatus] = useState<ProStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    setStatus(await getProStatus());
  }

  useEffect(() => {
    void reload().catch(() => setErr("Status nicht geladen."));
  }, []);

  if (!status) {
    return (
      <div className="space-y-2">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </div>
    );
  }

  if (status.isPro) {
    return (
      <section className="rounded-2xl bg-hero p-5 text-hero-foreground">
        <p className="kicker text-accent">PRO aktiv</p>
        <h2 className="mt-2 font-display text-2xl">
          {status.plan === "month" ? PRO_MONTH_LABEL : PRO_YEAR_LABEL}
        </h2>
        <p className="mt-2 text-sm text-hero-foreground/75">
          Unbegrenzte Scans
          {status.until ? ` · bis ${formatShortDate(status.until)}` : ""}.
          {status.cancelAtPeriodEnd ? " Kündigung zum Periodenende vorgemerkt." : ""}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {status.scanCredits > 0 ? (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
          Scan-Guthaben: {status.scanCredits}{" "}
          {status.scanCredits === 1 ? "Scan" : "Scans"}.
        </p>
      ) : null}
      <ScanPaywall onActivated={() => void reload()} />
    </div>
  );
}
