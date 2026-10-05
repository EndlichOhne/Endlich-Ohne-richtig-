import { createFileRoute } from "@tanstack/react-router";
import { H, LegalPage, P } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/datenschutz")({
  component: DatenschutzPage,
  head: () => ({ meta: [{ title: "Datenschutz · ENDLICH OHNE" }] }),
});

function DatenschutzPage() {
  return (
    <LegalPage kicker="Entwurf" title="Datenschutzerklärung">
      <H>Verantwortlicher</H>
      <P>
        {BRAND.praxis}, {BRAND.street}, {BRAND.zip} {BRAND.city}, {BRAND.email}.
        Datenschutzkontakt: {BRAND.dsb}. Stand: {BRAND.updated}.
      </P>
      <H>Grundsatz</H>
      <P>
        Privacy by Default: Check-Antworten, Fotos und optionale Standortdaten
        bleiben auf dem Gerät. Konto, Termine und Zahlungsbelege (ohne
        Kartennummer) liegen nach Anmeldung auf dem Server, jeweils nur für
        dein Konto. Kein Analytics, kein Marketing-Pixel, keine Google-Fonts vom
        Google-Server in dieser Version. Schriftarten werden lokal ausgeliefert.
      </P>
      <H>Rechtsgrundlagen</H>
      <P>
        Vertrag / vorvertragliche Schritte (Art. 6 Abs. 1 lit. b DSGVO) für
        Konto, Planer und Anzahlung. Einwilligung (Art. 6 Abs. 1 lit. a) für
        optionale Funktionen (Standort, Erinnerungen, Personalisierung, KI-Foto,
        öffentliche Galerie). Berechtigtes Interesse (Art. 6 Abs. 1 lit. f)
        höchstens für technisch nötige Server-Logs – Details Hosting prüfen.
        Gesundheitsbezogene Angaben und Hautfotos: Art. 9 Abs. 2 lit. a
        (ausdrückliche Einwilligung), soweit sie überhaupt verarbeitet werden.
      </P>
      <H>Hosting / Server-Logs</H>
      <P>
        Beim Abruf der Website können technisch erforderliche Server-Logs des
        Hosters anfallen (IP, Zeitpunkt, User-Agent). Details: [Platzhalter Hosting].
        AVV mit dem Hoster vor Go-Live.
      </P>
      <H>Konto</H>
      <P>
        Bei Registrierung oder Anmeldung (E-Mail/Passwort, Google oder X): Name,
        E-Mail, Authentifizierungsdaten sowie von dir angelegte Akte-Metadaten
        (ohne Foto). Zweck: Bereitstellung von Planer, Belegen und Tattoo-Akte,
        Altersgrenze 18 (App/Konto; Behandlung vor Ort gesondert). Nach
        E-Mail/Passwort-Registrierung senden wir einmalig einen Bestätigungscode
        an die angegebene Adresse (kein Newsletter). Wegwerf-Adressen werden
        abgelehnt. Speicherdauer: bis Kontolöschung. Kontolöschung: Profil →
        Konto und Serverdaten löschen. Sitzungen bei Stripe bleiben beim
        Zahlungsdienst. Google- oder X-Anmeldung übermittelt Identitätsdaten an
        den jeweiligen Anbieter (möglicher Drittlandtransfer, AVV /
        Standardvertragsklauseln – rechtliche Prüfung).
      </P>
      <H>Lokal gespeichert (technisch erforderlich)</H>
      <P>
        Einwilligungsstatus, Check-Antworten (ohne Foto), selbst angelegte
        Termine, Stripe-Zahlungsbelege (ohne Kartennummer) und der optionale
        Hinweis „App installieren“ – im Speicher dieses Geräts, Zweck: Funktion
        der App (TDDDG: technisch notwendig). Löschung: Profil → Einwilligungen
        widerrufen.
      </P>
      <H>Cookies / Tracking</H>
      <P>
        Keine Statistik- oder Marketing-Cookies. Technisch erforderlich sind der
        lokale Einwilligungsstatus und, nach Anmeldung, Session-Cookies des
        Authentifizierungsdienstes. Ein Marketing-Opt-in ist unnötig, solange
        keine Tracker geladen werden. Der Schnellstart „Ich akzeptiere alles“
        setzt nur die Pflichtangaben; Standort, Erinnerungen und Personalisierung
        bleiben aus, bis du sie selbst setzt.
      </P>
      <H>3D-Körpermodell</H>
      <P>
        Das Modell ist ein generisches Mannequin ohne Personenbezug. Die
        Regionswahl wird nur lokal im Check gespeichert, nicht als 3D-Scan und
        nicht mit dem Konto verknüpft.
      </P>
      <H>Standort</H>
      <P>
        Nur nach optionaler Einwilligung, nur im Browser zur Entfernungsanzeige,
        ohne Server-Speicherung.
      </P>
      <H>Foto</H>
      <P>
        Fotos für Check, Scanner, Journal und Fortschritt bleiben auf diesem Gerät
        (IndexedDB / Arbeitsspeicher). Kein Upload in die ENDLICH-OHNE-Datenbank,
        keine Nutzung für Training durch uns. Optional: einmalige Übermittlung an
        den KI-Dienst xAI zur Schätzung, nur nach gesonderter Einwilligung im
        Scanner. Die KI-Antwort (Score, Faktoren, Text) kann im Konto gespeichert
        werden, das Bild selbst nicht. Löschung der lokalen Fotos: Profil →
        Einwilligungen widerrufen.
      </P>
      <H>Ergebnisgalerie</H>
      <P>
        Die Seite „Echte Ergebnisse“ zeigt veröffentlichte Vorher-/Nachher-Bilder
        nur nach ausdrücklicher Einwilligung (Art. 9 Abs. 2 lit. a DSGVO) und
        Prüfung durch die Praxis. Beispiel-/Demo-Einträge sind gekennzeichnet und
        keine echten Kundenversprechen, keine typischen Ergebnisse. Nutzer-Uploads
        liegen serverseitig (komprimiert), getrennt von den privaten Akte-Fotos
        auf dem Gerät. Status: Entwurf, eingereicht, in Prüfung, veröffentlicht,
        abgelehnt. Ablehnung mit Grund. Löschung: über die Praxis / Kontolöschung.
        Keine Veröffentlichung ohne aktive Zustimmung.
      </P>
      <H>KI-Dienst (xAI)</H>
      <P>
        Bei Scanner und „Frag die Tattoo-KI“ werden eingegebene Texte bzw. das
        Foto einmalig an xAI (Drittland, AVV / Standardvertragsklauseln – rechtliche
        Prüfung) übermittelt. Zweck: unverbindliche Schätzung / Erklärung. Keine
        Diagnose. Speicherdauer beim Anbieter: dessen Datenschutz. Rechtsgrundlage:
        Einwilligung. Abschaltbar, indem die Funktion nicht genutzt wird.
      </P>
      <H>Externe Dienste beim Klick</H>
      <P>
        Telefon-App, Anbieter-Website, Google Maps (Kartenanbieter, möglicher
        Drittlandtransfer – rechtliche Prüfung / AVV erforderlich). Kein
        vorab geladenes Karten-iframe.
      </P>
      <H>Anzahlung / Stripe</H>
      <P>
        Zahlungen laufen über Stripe Payments Europe Ltd. bzw. das verbundene
        Unternehmen als eigenständigen Verantwortlichen oder als
        Auftragsverarbeiter (AVV / DPA von Stripe, rechtliche Einordnung prüfen).
        Die App übermittelt an Stripe nur: Betrag in Euro, gewählte
        Flächenkategorie, optionale Standort-ID, optionales Datum, E-Mail für die
        Quittung. Keine Check-Antworten, keine Fotos, keine Kartennummer, kein CVC,
        keine vollständige IBAN. Stripe führt 3-D Secure aus und speichert die
        Zahlungsdaten nach eigenen Regeln (PCI-DSS). In der App bleibt lokal nur
        der Beleg: Stripe-Sitzung, Betrag, Zahlungsart, ggf. letzte vier Ziffern,
        maskierte E-Mail. Löschung des lokalen Belegs: Profil → Einwilligungen
        widerrufen. Die Zahlung bei Stripe bleibt davon unberührt (Widerruf über
        die Praxis / Stripe). Server-Logs des Webhooks enthalten keine
        Primärkontonummern. Hinweise von Stripe:{" "}
        <a href="https://stripe.com/de/privacy" rel="noreferrer" target="_blank">
          Datenschutz
        </a>
        {" · "}
        <a href="https://stripe.com/legal/dpa" rel="noreferrer" target="_blank">
          Auftragsverarbeitung
        </a>
        .
      </P>
      <H>KI-Tattoo-Vorschau</H>
      <P>
        Optional, nur nach ausdrücklicher Einwilligung und mit Konto: Ein Foto
        wird einmalig an den KI-Dienst (xAI / Grok Imagine) zur Bildbearbeitung
        gesendet, damit eine Simulation „Haut ohne Tattoo“ entstehen kann. Wir
        speichern das Foto nicht in unserer Datenbank. Gespeichert wird nur, ob
        der kostenlose Test in deinem Konto bereits genutzt wurde. Das Ergebnis
        bleibt in der Sitzung auf dem Gerät, bis du es selbst speicherst. Kein
        Training durch uns. Die Bearbeitung ist eine digitale Simulation, keine
        Vorhersage einer echten Laserbehandlung.
      </P>
      <H>Speicherdauer, Rechte</H>
      <P>
        Lokale Daten bis Widerruf oder Geräte-Löschung. Auskunft, Berichtigung,
        Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch,
        Einwilligung widerrufen: {BRAND.email} / {BRAND.dsb}. Beschwerde bei einer
        Aufsichtsbehörde, für Karlsruhe typischerweise: Der Landesbeauftragte für
        den Datenschutz und die Informationsfreiheit Baden-Württemberg (LfDI).
      </P>
      <H>Besondere Kategorien</H>
      <P>
        Check-Angaben und Hautfotos können Gesundheitsbezug haben (Art. 9 DSGVO).
        Deshalb keine Cloud-Spiegelung der privaten Akte-Fotos in dieser Version.
        Öffentliche Galerie nur mit extra Einwilligung und Prüfung. Rechtliche
        Prüfung vor Go-Live erforderlich.
      </P>
    </LegalPage>
  );
}
