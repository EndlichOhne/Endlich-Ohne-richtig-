import { createFileRoute } from "@tanstack/react-router";
import { H, LegalPage, P } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";
import { DEPOSIT_PERCENT } from "@/lib/pricing";

export const Route = createFileRoute("/widerruf")({
  component: WiderrufPage,
  head: () => ({ meta: [{ title: `Widerruf · ${BRAND.name}` }] }),
});

function WiderrufPage() {
  return (
    <LegalPage kicker="Entwurf" title="Widerrufsbelehrung">
      <P>
        Für Verbraucherinnen und Verbraucher gilt – soweit das Fernabsatzrecht
        die Anzahlung in der App erfasst – folgendes Widerrufsrecht. Der
        Behandlungsvertrag entsteht nicht durch die App-Zahlung, sondern erst in
        der Praxis. Rechtliche Prüfung vor Veröffentlichung erforderlich.
      </P>
      <H>Widerrufsrecht</H>
      <P>
        Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
        Vertrag (Anzahlung auf einen Sitzungsrichtwert) zu widerrufen. Die
        Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses
        (Zahlungseingang bei Stripe).
      </P>
      <P>
        Um Ihr Widerrufsrecht auszuüben, müssen Sie uns,
        {` ${BRAND.praxis}, ${BRAND.street}, ${BRAND.zip} ${BRAND.city}, ${BRAND.email}, ${BRAND.phoneDisplay}, `}
        mittels einer eindeutigen Erklärung (z. B. E-Mail) über Ihren Entschluss
        informieren. Sie können das Muster-Widerrufsformular unten verwenden, das
        ist nicht vorgeschrieben.
      </P>
      <P>
        Zur Wahrung der Frist reicht die rechtzeitige Absendung vor Ablauf der
        Frist.
      </P>
      <H>Folgen des Widerrufs</H>
      <P>
        Wir erstatten alle Zahlungen unverzüglich, spätestens binnen vierzehn
        Tagen ab Zugang des Widerrufs, über dasselbe Zahlungsmittel, sofern nichts
        anderes vereinbart ist. Es entstehen Ihnen dafür keine Entgelte. Die
        Erstattung erfolgt über Stripe.
      </P>
      <P>
        Die {DEPOSIT_PERCENT} %-Anzahlung ist ein Richtwert. Sie begründet keine
        Behandlungspflicht und kein Heilversprechen. Wurde in der Praxis bereits
        eine Sitzung durchgeführt, gelten die dortigen Bedingungen; ein
        Widerruf kann dann eingeschränkt sein, wenn die Dienstleistung mit Ihrer
        ausdrücklichen Zustimmung vollständig erbracht wurde.
      </P>
      <H>Muster-Widerrufsformular</H>
      <P>
        An {BRAND.praxis}, {BRAND.street}, {BRAND.zip} {BRAND.city}, {BRAND.email}:
      </P>
      <P>
        Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über
        die Anzahlung einer Laser-Sitzung (Richtwert) in der App ENDLICH OHNE.
        Bestellt am / erhalten am: … Name: … Anschrift: … Stripe-Beleg / E-Mail: …
        Datum: … Unterschrift (nur bei Papier): …
      </P>
    </LegalPage>
  );
}
