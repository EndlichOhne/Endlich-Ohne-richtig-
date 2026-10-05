import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createProCheckout } from "@/lib/checkout";
import { activateProPreview, getProStatus } from "@/lib/pro-api";
import {
  PRO_MONTH_LABEL,
  PRO_TEASER_KEY,
  PRO_YEAR_BADGE,
  PRO_YEAR_LABEL,
  PRO_YEAR_SAVE,
  SCAN_PRICE_LABEL,
  type BillingSku,
} from "@/lib/pro";
import { cn } from "@/lib/utils";

export function ScanPaywall({
  compact = false,
  onActivated,
}: {
  compact?: boolean;
  onActivated?: () => void;
}) {
  const { user } = useCurrentUserState();
  const [busy, setBusy] = useState<BillingSku | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function buy(sku: BillingSku) {
    if (!user) {
      window.location.assign("/login");
      return;
    }
    setBusy(sku);
    setErr(null);
    try {
      const status = await getProStatus();
      if (status.stripeReady) {
        const res = await createProCheckout({
          data: {
            origin: window.location.origin,
            email: user.primaryEmail ?? "",
            sku,
          },
        });
        if (!res.ok) {
          setErr("Stripe ist hier nicht angebunden.");
          return;
        }
        window.location.assign(res.url);
        return;
      }
      const granted = await activateProPreview({ data: { sku } });
      try {
        if (granted.kind === "pro") localStorage.setItem(PRO_TEASER_KEY, "1");
      } catch {
        /* ignore */
      }
      onActivated?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Zahlung nicht gestartet.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Header compact={compact} />
      <Options busy={busy} disabled={Boolean(busy)} onClick={(sku) => void buy(sku)} />
      {!user ? (
        <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
          <Link to="/login">Anmelden oder registrieren</Link>
        </Button>
      ) : null}
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}

function Header({ compact }: { compact: boolean }) {
  return (
    <div>
      <p className="kicker text-primary">Bezahlen</p>
      <h2 className={cn("mt-2 font-display", compact ? "text-2xl" : "text-3xl")}>
        Wähle deine Option
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Bezahle nur für einzelne Scans oder erhalte mit Pro unbegrenzten Zugriff.
        Nach der Bestätigung gilt der Kauf. Keine automatische Erstattung bei
        Fehlklick oder Unzufriedenheit mit dem Ergebnis.
      </p>
    </div>
  );
}

function Options({
  busy,
  disabled,
  onClick,
}: {
  busy: BillingSku | null;
  disabled: boolean;
  onClick: (sku: BillingSku) => void;
}) {
  return (
    <div className="grid gap-3">
      <OptionCard
        kicker="Einzel-Scan"
        price={SCAN_PRICE_LABEL}
        hint="0,50 € · Einmalzahlung · Kein Abonnement"
        cta="Scan für 0,50 € kaufen"
        busy={busy === "scan"}
        disabled={disabled}
        onClick={() => onClick("scan")}
      />
      <OptionCard
        kicker="Pro Monatlich"
        price={PRO_MONTH_LABEL}
        hint="3,99 € pro Monat · Automatische Verlängerung, sofern nicht gekündigt"
        cta="Monatlich abonnieren"
        busy={busy === "month"}
        disabled={disabled}
        onClick={() => onClick("month")}
      />
      <OptionCard
        kicker={`★ ${PRO_YEAR_BADGE}`}
        price={PRO_YEAR_LABEL}
        hint={`22,00 € pro Jahr · Automatische Verlängerung, sofern nicht gekündigt · ${PRO_YEAR_SAVE}`}
        cta="Jahresabo wählen"
        featured
        busy={busy === "year"}
        disabled={disabled}
        onClick={() => onClick("year")}
      />
    </div>
  );
}

function OptionCard({
  kicker,
  price,
  hint,
  cta,
  featured,
  busy,
  disabled,
  onClick,
}: {
  kicker: string;
  price: string;
  hint: string;
  cta: string;
  featured?: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <section
      className={
        featured
          ? "rounded-2xl bg-hero p-5 text-hero-foreground shadow-[var(--shadow-border)]"
          : "rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]"
      }
    >
      <p className={featured ? "kicker text-accent" : "kicker text-primary"}>{kicker}</p>
      <p className="mt-2 font-display text-3xl">{price}</p>
      <p
        className={
          featured ? "mt-1 text-sm text-hero-foreground/70" : "mt-1 text-sm text-muted-foreground"
        }
      >
        {hint}
      </p>
      <Button
        className={
          featured
            ? "mt-4 min-h-12 w-full rounded-xl bg-hero-foreground text-hero hover:bg-hero-foreground/90"
            : "mt-4 min-h-12 w-full rounded-xl"
        }
        disabled={disabled}
        onClick={onClick}
      >
        {busy ? "Weiter…" : cta}
      </Button>
    </section>
  );
}
