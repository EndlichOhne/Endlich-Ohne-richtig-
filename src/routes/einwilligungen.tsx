import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConsentCheck } from "@/components/consent-check";
import { LegalDraftBanner } from "@/components/legal-draft-banner";
import { PageIntro } from "@/components/page-intro";
import { useConsent } from "@/lib/consent-store";

export const Route = createFileRoute("/einwilligungen")({
  component: EinwilligungenPage,
  head: () => ({ meta: [{ title: "Einwilligungen · ENDLICH OHNE" }] }),
});

function EinwilligungenPage() {
  const { consent, setPartial, withdraw } = useConsent();
  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="Daten" title="Einwilligungen">
        Pflichtangaben sind nötig, um die App zu nutzen. Optionales bleibt
        einzeln widerrufbar. „Ich akzeptiere alles“ setzt nur die Pflicht –
        Standort, Erinnerungen und Personalisierung bleiben aus, bis du sie hier
        setzt. Protokoll: Version {consent.version}
        {consent.acceptedAt ? ` · ${consent.acceptedAt}` : ""}.
      </PageIntro>
      <LegalDraftBanner />
      <div className="space-y-3">
        <ConsentCheck
          id="e-agb"
          checked={consent.agb}
          onChange={() => {}}
          required
          label="Nutzungsbedingungen (Pflicht, bereits erteilt)"
          hint="Widerruf beendet die Nutzung und löscht lokale App-Daten."
        />
        <ConsentCheck
          id="e-loc"
          checked={consent.location}
          onChange={(v) => setPartial({ location: v })}
          label="Standort zur Anbietersuche"
        />
        <ConsentCheck
          id="e-push"
          checked={consent.notifications}
          onChange={(v) => setPartial({ notifications: v })}
          label="Erinnerungen (ohne Push-Dienst)"
        />
        <ConsentCheck
          id="e-pers"
          checked={consent.personalized}
          onChange={(v) => setPartial({ personalized: v })}
          label="Personalisierte Hinweise aus dem Check"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl"
        onClick={withdraw}
      >
        Alle Einwilligungen widerrufen und lokale Daten löschen
      </Button>
    </div>
  );
}
