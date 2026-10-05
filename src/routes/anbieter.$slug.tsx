import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SourceTag } from "@/components/source-tag";
import { Disclaimer } from "@/components/disclaimer";
import { findProvider, mapsUrl } from "@/lib/providers";
import { BRAND } from "@/lib/brand";
import { DEPOSIT_PERCENT } from "@/lib/pricing";

export const Route = createFileRoute("/anbieter/$slug")({
  component: AnbieterDetail,
});

function AnbieterDetail() {
  const { slug } = Route.useParams();
  const p = findProvider(slug);
  if (!p) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Standort nicht gefunden</h1>
        <Button asChild className="rounded-xl">
          <Link to="/anbieter">Zur Übersicht</Link>
        </Button>
      </div>
    );
  }

  const karlsruhe = p.slug === "karlsruhe";

  return (
    <div className="fade-up space-y-6">
      {karlsruhe ? (
        <img
          src="/images/kaiserstrasse-hq.webp"
          alt=""
          className="h-52 w-full rounded-2xl object-cover md:h-80"
        />
      ) : null}
      <SourceTag kind="anbieter" />
      <p className="kicker text-primary">{p.city}</p>
      <h1 className="font-display text-3xl">{p.name}</h1>
      <p className="text-sm text-muted-foreground">{p.briefingNote}</p>
      <p className="text-xs text-muted-foreground">Stand der Information: {p.updated}</p>

      <dl className="space-y-3 rounded-2xl bg-card p-5 text-sm shadow-[var(--shadow-border)]">
        <Row k="Adresse" v={`${p.street}, ${p.zip} ${p.city}`} />
        <Row k="Telefon" v={p.phoneDisplay} />
        <Row k="Öffnungszeiten" v={p.hours} />
        <Row k="Laser" v={p.laser} />
        {p.rating ? (
          <Row
            k="Bewertung"
            v={`${p.rating.value} bei ${p.rating.count} Rezensionen · ${p.rating.source}`}
          />
        ) : null}
        <Row k="Leistungen" v={p.services.join(", ")} />
        <Row
          k="Anzahlung"
          v={`${DEPOSIT_PERCENT} % des Sitzungsrichtwerts, Rest vor Ort. Unverbindlich.`}
        />
      </dl>

      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link
          to="/zahlung"
          onClick={() => sessionStorage.setItem("eo-z-slug", p.slug)}
        >
          {DEPOSIT_PERCENT} % Anzahlung
        </Link>
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <a href={p.website} target="_blank" rel="noreferrer">
            Termin anfragen
          </a>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={p.phoneHref}>Anrufen</a>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={mapsUrl(p)} target="_blank" rel="noreferrer">
            Route
          </a>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={p.booking} target="_blank" rel="noreferrer">
            Termin
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Buchung läuft über die Standortseite von {BRAND.name}, nicht über diese App.
        Die Anzahlung in der App geht über Stripe; sie ist kein Behandlungsvertrag.
      </p>
      {karlsruhe ? (
        <img
          src="/images/qr.webp"
          alt="QR-Code Filiale Karlsruhe"
          className="mx-auto w-40 rounded-xl"
        />
      ) : null}
      <Disclaimer compact />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5">{v}</dd>
    </div>
  );
}
