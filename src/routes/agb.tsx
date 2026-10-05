import { createFileRoute } from "@tanstack/react-router";
import { H, LegalPage, P } from "@/components/legal-page";
import { DEPOSIT_PERCENT } from "@/lib/pricing";

export const Route = createFileRoute("/agb")({
  component: AgbPage,
  head: () => ({ meta: [{ title: "AGB · ENDLICH OHNE" }] }),
});

function AgbPage() {
  return (
    <LegalPage kicker="Entwurf" title="Nutzungsbedingungen">
      <H>1. Zweck</H>
      <P>
        ENDLICH OHNE ist eine Informations- und Orientierungs-App zu Tattoo-,
        PMU- und Microblading-Entfernung sowie Cover-up-Aufhellung. Sie vermittelt
        keine Behandlungen und stellt keine medizinische Beratung dar.
      </P>
      <H>2. Keine medizinische Beratung</H>
      <P>
        Inhalte, der Tattoo-Check, das 3D-Körpermodell und Preis-/Sitzungsspannen
        sind unverbindlich. Das Modell dient nur der Regionswahl. Keine Diagnose,
        kein Heilversprechen, keine Garantie vollständiger Entfernung.
      </P>
      <H>3. Anbieterinformationen</H>
      <P>
        Angaben zu Betrieben stammen aus dem jeweiligen Briefing bzw. der
        genannten Quelle. Keine Garantie auf Vollständigkeit, Aktualität oder
        Richtigkeit. Stand wird ausgewiesen.
      </P>
      <H>4. Dritte und Buchungen</H>
      <P>
        Links zu Websites, Karten, Telefon und Buchung führen zu Dritten. Es
        kommt kein Vertrag mit ENDLICH OHNE über die Behandlung zustande.
      </P>
      <H>5. Preise</H>
      <P>
        Angezeigte Beträge sind Beispielpreise / Richtwerte, keine Angebote im
        Rechtssinne.
      </P>
      <H>6. Anzahlung</H>
      <P>
        Das Modell „{DEPOSIT_PERCENT} % Anzahlung, {100 - DEPOSIT_PERCENT} % bei
        der Sitzung vor Ort“ ist eine Orientierung am Sitzungsrichtwert. Die in
        der App gezahlte Anzahlung wird über den Zahlungsdienst Stripe
        entgegengenommen (Karten, Apple Pay, Google Pay, PayPal, SEPA-Lastschrift,
        Klarna – soweit Stripe sie für das Händlerkonto freigeschaltet hat). Es
        entsteht kein Behandlungsvertrag und kein Heilversprechen. Der endgültige
        Sitzungspreis wird erst in der Praxis festgelegt; zu viel gezahlte Beträge
        werden verrechnet oder erstattet. Kartendaten werden nicht in der App
        gespeichert. Widerruf: gesonderte Belehrung. Rechtliche Prüfung
        erforderlich.
      </P>
      <H>7. Haftung</H>
      <P>
        Haftungsbeschränkungen nur im gesetzlich zulässigen Rahmen. Rechtliche
        Prüfung erforderlich, bevor dieser Abschnitt veröffentlicht wird.
      </P>
      <H>8. Nutzerpflichten</H>
      <P>
        Keine missbräuchliche Nutzung, kein Upload rechtswidriger Inhalte. Private
        Akte-Fotos bleiben lokal und dürfen nur die eigene Pigmentierung zeigen.
        Für die öffentliche Ergebnisgalerie gelten zusätzlich: eigene Rechte am
        Bild, ausdrückliche Einwilligung zur Veröffentlichung und Prüfung durch
        die Praxis. Demo-/Beispielbilder sind gekennzeichnet, keine echten
        Kundenergebnisse und kein Heilversprechen.
      </P>
      <H>9. Konto</H>
      <P>
        Check, Planer und Anzahlung setzen ein Nutzerkonto voraus (E-Mail/Passwort
        oder Google/X). Das Konto speichert Termine, Zahlungsbelege ohne
        Kartennummer und Metadaten der Tattoo-Akte (ohne Fotos). Check-Antworten
        und Fotos werden in dieser Version nicht serverseitig gespeichert. Die
        Registrierung und der Check sind ab 18 Jahren zulässig. Ob eine
        Behandlung vor Ort möglich ist, entscheidet die Praxis nach ärztlicher
        und gesetzlicher Vorgabe, nicht die App. Ein Konto kann unter Profil gelöscht werden; Zahlungen bei Stripe
        bleiben davon unberührt (Widerruf gesondert). Rechtliche Prüfung
        erforderlich.
      </P>
      <H>10. KI-Scanner, Akte, Journal</H>
      <P>
        KI-Auswertungen, Scores, Kostenplaner, Simulationen und der Assistent sind
        unverbindliche Schätzungen. Keine Diagnose, kein Heilversprechen, keine
        Garantie. Die visuelle Simulation ist gekennzeichnet und kann stark von
        realen Ergebnissen abweichen. Die Akte ist eine private Dokumentation des
        Nutzers, keine Patientenakte der Praxis. Fotos bleiben lokal; die
        einmalige KI-Analyse eines Fotos erfolgt nur nach Einwilligung.
        Die Galerie „Echte Ergebnisse“ zeigt nur geprüfte oder als Beispiel/Demo
        gekennzeichnete Bilder – keine Garantie, keine Diagnose.
        Rechtliche Prüfung erforderlich.
      </P>
      <H>11. Änderungen, IP, Recht</H>
      <P>
        Inhalte der App sind geistiges Eigentum der jeweiligen Rechteinhaber.
        Anwendbares Recht und Gerichtsstand: rechtliche Prüfung erforderlich
        (üblicherweise Recht der Bundesrepublik Deutschland, soweit zulässig).
      </P>
    </LegalPage>
  );
}
