import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SourceTag } from "@/components/source-tag";
import { PageIntro } from "@/components/page-intro";
import { useConsent } from "@/lib/consent-store";
import { PROVIDERS, haversineKm, mapsUrl } from "@/lib/providers";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anbieter/")({
  component: AnbieterList,
  head: () => ({ meta: [{ title: `Standorte · ${BRAND.name}` }] }),
});

const QUICK = [
  "Karlsruhe",
  "Berlin",
  "München",
  "Hamburg",
  "Köln",
  "Frankfurt",
  "Stuttgart",
];

function AnbieterList() {
  const { consent, setPartial } = useConsent();
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(80);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  const list = useMemo(() => {
    return PROVIDERS.filter((p) => {
      const q = city.trim().toLowerCase();
      if (q && !`${p.city} ${p.zip} ${p.name}`.toLowerCase().includes(q)) {
        return false;
      }
      if (here) {
        const km = haversineKm(here.lat, here.lng, p.lat, p.lng);
        if (km > radius) return false;
      }
      return true;
    })
      .map((p) => ({
        ...p,
        km: here ? haversineKm(here.lat, here.lng, p.lat, p.lng) : null,
      }))
      .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }, [city, here, radius]);

  const featured = !city.trim() && !here;

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<SourceTag kind="anbieter" />}
        kicker="Netzwerk"
        title="Standorte"
      >
        {PROVIDERS.length} Filialen laut {BRAND.site.replace("https://", "")}.
        Stand {BRAND.updated}. Keine erfundenen Bewertungen oder Öffnungszeiten.
      </PageIntro>

      <div className="space-y-3">
        <Input
          placeholder="Stadt oder PLZ"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Stadt suchen"
        />
        <div className="flex flex-wrap gap-2">
          {QUICK.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={cn(
                "min-h-11 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
                city === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {here ? (
          <label className="block text-sm text-muted-foreground">
            Radius: {radius} km
            <input
              type="range"
              min={10}
              max={400}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </label>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => {
            if (!consent.location) {
              setGeoErr("Standort ist optional. Bitte zuerst unter Mehr erlauben.");
              return;
            }
            if (!navigator.geolocation) {
              setGeoErr("Standort ist auf diesem Gerät nicht verfügbar.");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoErr(null);
              },
              () => setGeoErr("Standort wurde verweigert oder ist nicht verfügbar."),
              { enableHighAccuracy: false, timeout: 8000 },
            );
          }}
        >
          In meiner Nähe
        </Button>
        {geoErr ? <p className="text-sm text-destructive">{geoErr}</p> : null}
      </div>

      {featured ? (
        <Link
          to="/anbieter/$slug"
          params={{ slug: "karlsruhe" }}
          className="block overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]"
        >
          <img
            src="/images/kaiserstrasse-hq.webp"
            alt=""
            className="h-40 w-full object-cover md:h-56"
          />
          <span className="block p-4">
            <span className="kicker text-primary">Filiale im Briefing</span>
            <span className="mt-2 block font-display text-2xl">Karlsruhe</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {BRAND.street}, {BRAND.zip} · {BRAND.praxis}
            </span>
          </span>
        </Link>
      ) : null}

      {list.length === 0 ? (
        <p className="rounded-xl bg-muted p-4 text-sm">
          Kein Standort in diesem Radius. Suche erweitern oder Stadtname prüfen.
        </p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {list.map((p) => (
            <li key={p.slug}>
              <Link
                to="/anbieter/$slug"
                params={{ slug: p.slug }}
                className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium">{p.city}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {p.street}, {p.zip}
                    {p.km != null ? ` · ca. ${p.km.toFixed(0)} km` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {here ? (
        <a
          className="text-xs text-muted-foreground underline"
          href={mapsUrl(list[0] ?? PROVIDERS[0])}
          target="_blank"
          rel="noreferrer"
        >
          Karte extern öffnen
        </a>
      ) : null}

      {!consent.location ? (
        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => setPartial({ location: true })}
        >
          Standort-Einwilligung jetzt erteilen
        </button>
      ) : null}
    </div>
  );
}
