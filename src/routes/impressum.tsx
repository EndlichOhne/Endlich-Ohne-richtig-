import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, P, H } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/impressum")({
  component: ImpressumPage,
  head: () => ({ meta: [{ title: `Impressum · ${BRAND.name}` }] }),
});

function ImpressumPage() {
  return (
    <LegalPage kicker="Angaben laut Briefing" title="Impressum">
      <P>
        Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG) und – soweit
        heilberuflich einschlägig – berufsrechtlichen Pflichtangaben. Fehlende
        Register- und Kammerdaten sind nicht erfunden.
      </P>
      <H>Verantwortlich für die Filiale Karlsruhe</H>
      <P>{BRAND.praxis}</P>
      <P>
        {BRAND.street}, {BRAND.zip} {BRAND.city}
      </P>
      <P>
        Tel. {BRAND.phoneDisplay} · {BRAND.email}
      </P>
      <H>Zentrale Marke</H>
      <P>{BRAND.zentrale}</P>
      <P>Datenschutzbeauftragte: {BRAND.dsb}</P>
      <P>Website: {BRAND.site}</P>
      <H>Inhaltlich verantwortlich (§ 18 Abs. 2 MStV)</H>
      <P>
        {BRAND.praxis}, {BRAND.street}, {BRAND.zip} {BRAND.city}
      </P>
      <H>Berufsrechtliche Angaben</H>
      <P>
        Berufsbezeichnung (soweit zutreffend): Arzt / Ärztin. Staat der
        Approbation, zuständige Ärztekammer und geltende Berufsordnung: nicht im
        Briefing hinterlegt – vor Veröffentlichung durch die Praxis ergänzen
        (in Baden-Württemberg typischerweise Landesärztekammer Baden-Württemberg
        und deren Berufsordnung).
      </P>
      <H>Nicht im Briefing enthalten</H>
      <P>Handelsregister / Registergericht: nicht hinterlegt</P>
      <P>USt-IdNr.: nicht hinterlegt</P>
      <P>Vertretungsberechtigte der GmbH: nicht hinterlegt</P>
      <P>
        Rechtliche Prüfung erforderlich. Keine weiteren Firmendaten erfunden.
      </P>
    </LegalPage>
  );
}
