import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  Landmark,
  LoaderCircle,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Choice, ChoiceGrid } from "@/components/choice-grid";
import { DepositSplit } from "@/components/deposit-split";
import { Disclaimer } from "@/components/disclaimer";
import { PageIntro } from "@/components/page-intro";
import { SourceTag } from "@/components/source-tag";
import { ConsentCheck } from "@/components/consent-check";
import { loadCheck } from "@/lib/check";
import { METHOD_HINT, METHOD_LABEL, emailOk, type PayMethod } from "@/lib/payments";
import { createCheckout, getPayConfig } from "@/lib/checkout";
import { inspectEmail } from "@/lib/verify-api";
import { DEPOSIT_PERCENT, SESSION_BANDS, euro, findBand, splitAmount } from "@/lib/pricing";
import { PROVIDERS } from "@/lib/providers";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/zahlung/")({
  component: ZahlungPage,
  head: () => ({ meta: [{ title: `Anzahlung · ${BRAND.name}` }] }),
});

const METHODS: { id: PayMethod; icon: typeof CreditCard }[] = [
  { id: "card", icon: CreditCard },
  { id: "wallet", icon: Smartphone },
  { id: "paypal", icon: Wallet },
  { id: "sepa", icon: Landmark },
  { id: "klarna", icon: Wallet },
];

const CARD_BRANDS = [
  "Visa",
  "Mastercard",
  "American Express",
  "UnionPay",
  "Apple Pay",
  "Google Pay",
  "PayPal",
  "SEPA",
  "Klarna",
];

function readPrefill() {
  if (typeof window === "undefined") {
    return { size: undefined as string | undefined, slug: "" };
  }
  const q = new URLSearchParams(window.location.search);
  const size =
    q.get("size") || sessionStorage.getItem("eo-z-size") || loadCheck().size || undefined;
  const slug = q.get("slug") || sessionStorage.getItem("eo-z-slug") || "";
  sessionStorage.removeItem("eo-z-size");
  sessionStorage.removeItem("eo-z-slug");
  return { size, slug };
}

function ZahlungPage() {
  return (
    <RequireAuth>
      <ZahlungInner />
    </RequireAuth>
  );
}

function ZahlungInner() {
  const [sizeId, setSizeId] = useState<(typeof SESSION_BANDS)[number]["id"]>("m");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PayMethod>("card");
  const [ackPrice, setAckPrice] = useState(false);
  const [ackAgb, setAckAgb] = useState(false);
  const [ackWiderruf, setAckWiderruf] = useState(false);
  const [ackStripe, setAckStripe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"live" | "test" | "off">("off");

  useEffect(() => {
    const p = readPrefill();
    setSizeId(findBand(p.size).id);
    setSlug(p.slug);
    void getPayConfig().then((c) => {
      setReady(c.ready);
      setMode(c.mode);
    });
  }, []);

  const band = findBand(sizeId);
  const split = useMemo(() => splitAmount(band.totalCents), [band.totalCents]);
  const location = PROVIDERS.find((p) => p.slug === slug) ?? null;
  const booking = location ?? PROVIDERS.find((p) => p.slug === "karlsruhe") ?? PROVIDERS[0];
  const canPay =
    ackPrice && ackAgb && ackWiderruf && ackStripe && emailOk(email) && !busy;

  async function submit() {
    if (!canPay) return;
    setBusy(true);
    setErr(null);
    try {
      const check = await inspectEmail({ data: { email: email.trim() } });
      if (!check.ok) {
        setErr(check.error);
        setBusy(false);
        return;
      }
      const res = await createCheckout({
        data: {
          sizeId: band.id,
          locationSlug: location?.slug ?? "",
          date,
          email: email.trim(),
          method,
          origin: window.location.origin,
          idempotencyKey: crypto.randomUUID(),
        },
      });
      if (!res.ok) {
        setErr(
          res.code === "not_configured"
            ? "Die sichere Kasse (Stripe) der Praxis ist noch nicht verbunden. Es wird kein Betrag eingezogen und keine Kartennummer erfasst."
            : "Die Kasse konnte nicht geöffnet werden. Bitte später erneut versuchen.",
        );
        setBusy(false);
        return;
      }
      window.location.assign(res.url);
    } catch {
      setErr("Zahlung konnte nicht gestartet werden. Keine Kartendaten wurden übertragen.");
      setBusy(false);
    }
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<SourceTag kind="allgemein" />}
        kicker={`${DEPOSIT_PERCENT} % voraus`}
        title="Anzahlung zur Sitzung"
      >
        {DEPOSIT_PERCENT} % des Sitzungsrichtwerts jetzt, {100 - DEPOSIT_PERCENT} % vor
        Ort nach Beratung. Kartennummer, CVC und IBAN bleiben bei Stripe – nicht in
        dieser App, nicht auf unseren Servern.
      </PageIntro>

      <p className="flex items-start gap-3 rounded-2xl bg-card px-4 py-4 text-sm shadow-[var(--shadow-border)]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          Gehostete Stripe-Kasse (PCI DSS, SAQ A). 3-D Secure / Strong Customer
          Authentication. TLS. Keine Speicherung der Primärkontonummer. Check,
          Fotos und Gesundheitsangaben werden nicht mitgeschickt.
        </span>
      </p>

      <ul className="flex flex-wrap gap-1.5">
        {CARD_BRANDS.map((b) => (
          <li
            key={b}
            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {b}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Visa-, Mastercard- und American-Express-Debit (viele Girokarten) laufen als
        Karte. Apple Pay und Google Pay erscheinen automatisch auf dem Gerät.
        PayPal, SEPA und Klarna, soweit das Praxis-Konto sie bei Stripe
        freigeschaltet hat.
      </p>

      {mode === "test" ? (
        <p className="rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">
          Stripe-Testmodus: es fließt kein echtes Geld an die Praxis.
        </p>
      ) : null}

      <section>
        <p className="kicker text-primary">Fläche</p>
        <ChoiceGrid className="mt-3">
          {SESSION_BANDS.map((b) => (
            <Choice key={b.id} selected={sizeId === b.id} onClick={() => setSizeId(b.id)}>
              <span className="block">{b.label}</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {euro(b.totalCents)} Richtwert · {b.hint}
              </span>
            </Choice>
          ))}
        </ChoiceGrid>
      </section>

      <DepositSplit totalCents={band.totalCents} />

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="kicker text-primary">Termin (optional)</p>
        <div>
          <Label htmlFor="pay-loc">Standort</Label>
          <select
            id="pay-loc"
            className="mt-2 flex h-11 w-full rounded-md bg-muted px-3 text-base text-foreground shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          >
            <option value="">Noch offen</option>
            {PROVIDERS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="day">Datum</Label>
          <Input
            id="day"
            type="date"
            className="mt-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
        <Label htmlFor="mail">E-Mail für Quittung und Widerruf</Label>
        <Input
          id="mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          className="mt-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Echte Adresse für Stripe-Beleg und Widerruf. Kein Newsletter.
        </p>
      </section>

      <section>
        <p className="kicker text-primary">Zahlungsart bei Stripe</p>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const selected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-16 flex-col items-start rounded-xl bg-card px-4 py-3 text-left shadow-[var(--shadow-border)]",
                  selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <Icon className="size-4 text-primary" />
                <span className="mt-2 text-sm font-medium">
                  {m.id === "card"
                    ? "Karte"
                    : m.id === "wallet"
                      ? "Apple / Google"
                      : m.id === "paypal"
                        ? "PayPal"
                        : m.id === "sepa"
                          ? "Lastschrift"
                          : "Klarna"}
                </span>
                <span className="text-xs text-muted-foreground">{METHOD_HINT[m.id]}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{METHOD_LABEL[method]}</p>
      </section>

      <div className="space-y-3">
        <ConsentCheck
          id="pay-price"
          checked={ackPrice}
          onChange={setAckPrice}
          required
          label={`${euro(split.depositCents)} sind ${DEPOSIT_PERCENT} % eines unverbindlichen Richtwerts, kein Behandlungsvertrag, keine Garantie.`}
          hint={`${euro(split.restCents)} bleiben für die Sitzung vor Ort – der Praxispreis kann abweichen, Differenz wird verrechnet oder erstattet.`}
        />
        <ConsentCheck
          id="pay-agb"
          checked={ackAgb}
          onChange={setAckAgb}
          required
          label="Ich akzeptiere die Nutzungsbedingungen (Entwurf), Abschnitt Anzahlung."
          hint="Details unter AGB."
        />
        <ConsentCheck
          id="pay-w"
          checked={ackWiderruf}
          onChange={setAckWiderruf}
          required
          label="Ich habe die Widerrufsbelehrung zur Anzahlung gelesen."
          hint="14 Tage, Entwurf – rechtliche Prüfung."
        />
        <ConsentCheck
          id="pay-st"
          checked={ackStripe}
          onChange={setAckStripe}
          required
          label="Ich willige ein, dass Stripe die Zahlung verarbeitet (kein Karten- oder IBAN-Speicher in dieser App)."
          hint="Datenschutz, Auftragsverarbeitung durch Stripe. Keine Check- oder Fotodaten."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        <Link to="/agb" className="underline">
          AGB
        </Link>
        {" · "}
        <Link to="/widerruf" className="underline">
          Widerruf
        </Link>
        {" · "}
        <Link to="/datenschutz" className="underline">
          Datenschutz
        </Link>
      </p>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      {ready === false ? (
        <div className="space-y-3 rounded-2xl bg-muted px-4 py-4 text-sm">
          <p>
            Die Stripe-Kasse der Praxis ist in dieser Umgebung noch nicht hinterlegt.
            Es werden keine Kartendaten abgefragt – das ist Absicht (PCI). Offizieller
            Termin über die Standortseite, nicht über ein fremdes Händlerkonto.
          </p>
          <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
            <a href={booking.booking} target="_blank" rel="noreferrer">
              Offiziellen Termin · {booking.city}
            </a>
          </Button>
        </div>
      ) : null}

      <Button
        className="min-h-12 w-full rounded-xl"
        disabled={!canPay || ready === false}
        onClick={() => void submit()}
      >
        {busy ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Weiter zur sicheren Kasse
          </>
        ) : (
          <>
            <Lock className="size-4" />
            {euro(split.depositCents)} sicher bei Stripe zahlen
          </>
        )}
      </Button>
      <Disclaimer compact />
    </div>
  );
}
