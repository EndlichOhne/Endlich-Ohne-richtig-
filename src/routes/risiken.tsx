import { createFileRoute } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { SourceTag } from "@/components/source-tag";
import { PageIntro } from "@/components/page-intro";

export const Route = createFileRoute("/risiken")({
  component: RisikenPage,
  head: () => ({ meta: [{ title: "Risiken · ENDLICH OHNE" }] }),
});

const ITEMS = [
  "Hautreizungen",
  "Rötungen",
  "Schwellungen",
  "Blasenbildung",
  "Pigmentveränderungen",
  "Narbenbildung",
  "unvollständige Entfernung",
  "Farbveränderungen",
];

function RisikenPage() {
  return (
    <div className="fade-up space-y-6">
      <img
        src="/images/wand.jpg"
        alt=""
        className="h-40 w-full rounded-2xl object-cover"
      />
      <PageIntro
        tag={<SourceTag kind="allgemein" />}
        kicker="Sicherheit"
        title="Risiken und Sicherheit"
      >
        Eine Laserbehandlung kann unter anderem mit folgenden Risiken verbunden
        sein. Die Liste ist nicht vollständig.
      </PageIntro>
      <ul className="grid grid-cols-1 gap-2">
        {ITEMS.map((i) => (
          <li key={i} className="rounded-xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]">
            {i}
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium">
        Die konkrete Risikobewertung gehört in die professionelle Beratung. Keine
        Diagnose, kein Heilversprechen, keine Garantie auf vollständige Entfernung.
      </p>
      <p className="text-sm text-muted-foreground">
        Professionelle medizinische Beratung ist erforderlich, bevor ein Verfahren
        gewählt wird.
      </p>
      <Disclaimer />
    </div>
  );
}
