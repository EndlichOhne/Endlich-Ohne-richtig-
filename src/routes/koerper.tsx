import { lazy, Suspense, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { SourceTag } from "@/components/source-tag";
import { Disclaimer } from "@/components/disclaimer";
import { RequireAuth } from "@/components/require-auth";
import { loadCheck, saveCheck, REGION_LABEL, type Region } from "@/lib/check";
import { BRAND } from "@/lib/brand";

const BodyExplorer = lazy(() =>
  import("@/components/body-scene").then((m) => ({ default: m.BodyExplorer })),
);

export const Route = createFileRoute("/koerper")({
  component: KoerperPage,
  head: () => ({ meta: [{ title: `3D-Körper · ${BRAND.name}` }] }),
});

function KoerperPage() {
  return (
    <RequireAuth>
      <KoerperInner />
    </RequireAuth>
  );
}

function KoerperInner() {
  const [region, setRegion] = useState<Region | null>(() => loadCheck().region);

  function pick(next: Region) {
    setRegion(next);
    saveCheck({ ...loadCheck(), region: next });
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        tag={<SourceTag kind="allgemein" />}
        kicker="3D"
        title="Region am Körper markieren"
      >
        Tippe auf das Modell oder drehe es mit dem Finger. Das ist
        Orientierung, keine anatomische Diagnose. Die Auswahl bleibt lokal im
        Check.
      </PageIntro>
      <Suspense fallback={<div className="h-[22rem] rounded-2xl bg-hero" />}>
        <BodyExplorer selected={region} onSelect={pick} />
      </Suspense>
      {region ? (
        <p className="text-sm">
          Gewählt: <span className="font-medium">{REGION_LABEL[region]}</span>
        </p>
      ) : null}
      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link to="/check">Im Check weiter</Link>
      </Button>
      <Disclaimer compact />
    </div>
  );
}
