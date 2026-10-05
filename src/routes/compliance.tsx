import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDraftBanner } from "@/components/legal-draft-banner";
import { STORE } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/compliance")({
  component: CompliancePage,
  head: () => ({ meta: [{ title: "Launch-Checkliste · ENDLICH OHNE" }] }),
});

const TECH = [
  "Kein Tracking ohne Einwilligung (aktuell: keine Tracker, keine Google-Fonts vom CDN).",
  "Fotos nicht hochgeladen, lokal verwerfbar (außer Galerie nach Extra-Einwilligung).",
  "Standort nur opt-in, nicht serverseitig.",
  "Check-Daten nur localStorage, löschbar.",
  "Konto: Planer und Belege je user_id, Kontolöschung vorhanden.",
  "Anzahlungen über Stripe (PCI, 3-D Secure). Keine PAN/CVC/IBAN in der App.",
  "Tattoo-Akte, KI-Scanner (xAI, Einwilligung), Fotos lokal.",
  "Capacitor-Konfiguration (de.endlichohne.app) als Entwurf.",
  "Keine API-Keys im Client.",
  "Externe Links mit rel=noreferrer. Karten erst beim Klick.",
  "Disclaimer auf Home, Ergebnis, Risiken, Galerie.",
  "Anbieter ohne erfundene Öffnungszeiten/Preise.",
  "PWA: Home-Bildschirm auf iOS, Android, iPad und Desktop.",
  "Safe Area für Notch und Home-Indicator, viewport-fit=cover.",
  "App-Symbol 1024×1024 und Play-Feature-Grafik vorbereitet.",
  "Schnellstart setzt nur Pflichtangaben; Optionales bleibt aus.",
];

const LEGAL = [
  "Impressum mit echten Betreiberdaten (HRB, USt-IdNr., Vertretung, Kammer ergänzen)",
  "AGB und Datenschutz durch Anwalt/DSB (jetzt inkl. Konto, Galerie, Art. 9)",
  "AVV Hosting, Maps, Stripe, Auth-Hosting, xAI",
  "Markenrechte ENDLICH OHNE / Domain / Stores",
  "Bildrechte, HWG/Heilversprechen, Vorher/Nachher nicht als typisch darstellen",
  "App-Store- und Play-Datenschutzlabels",
  "Widerrufsbelehrung für Anzahlungen (Entwurf)",
  "Echter Zahlungsdienst (PSP), PCI, Widerrufsbelehrung für Anzahlungen",
  "Altersfreigabe 18+ (App/Konto), Behandlung vor Ort gesondert prüfen, Support-URL, Privacy-URL",
  "Apple Developer / Google Play Konto der Praxis, AGB der Stores",
  "Native Hülle: Capacitor auf einem Mac, Review-Risiko Guideline 4.2",
];

function CompliancePage() {
  return (
    <div className="fade-up space-y-6">
      <h1 className="font-display text-4xl">Launch-Checkliste</h1>
      <LegalDraftBanner />
      <section>
        <h2 className="font-display text-2xl">Technisch umgesetzt</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {TECH.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl">Anwalt / Datenschutz prüfen</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {LEGAL.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-3 text-sm">
        <h2 className="font-display text-2xl text-foreground">Store (Entwurf)</h2>
        <p className="text-muted-foreground">
          Native Einreichung nur mit Entwicklerkonto der Praxis. Bis dahin:{" "}
          <Link to="/installieren" className="text-primary underline">
            App aufs Handy
          </Link>
          .
        </p>
        <dl className="space-y-2 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <Row k="Name" v={STORE.name} />
          <Row k="Untertitel" v={STORE.subtitle} />
          <Row k="Kurz" v={STORE.short} />
          <Row k="Keywords" v={STORE.keywords} />
          <Row k="Kategorie" v={STORE.category} />
          <Row k="Alter" v={STORE.age} />
          <Row k="Support" v={STORE.support} />
          <Row k="Privacy-URL" v={STORE.privacyUrl} />
        </dl>
        <h3 className="font-display text-xl">Beschreibung</h3>
        <p className="whitespace-pre-line text-muted-foreground">{STORE.description}</p>
        <h3 className="font-display text-xl">Neu in dieser Version</h3>
        <p className="text-muted-foreground">{STORE.whatsNew}</p>
        <h3 className="font-display text-xl">Datenschutzlabel (Entwurf)</h3>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {STORE.privacyLabels.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <h3 className="font-display text-xl">Assets</h3>
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={BRAND.profile}
            alt="App-Symbol 1024"
            className="size-24 rounded-2xl"
            width={1024}
            height={1024}
          />
          <img
            src="/store/play-feature.png"
            alt="Play Feature Graphic"
            className="h-20 w-auto rounded-lg"
            width={1024}
            height={500}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Screenshots: iPhone 6,9″ 1320×2868, iPad 12,9″ 2064×2752, Android
          1080×1920. Ohne Heilversprechen, ohne erfundene Preise in den
          Bildern.
        </p>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs tracking-kicker text-muted-foreground uppercase">
        {k}
      </dt>
      <dd className="mt-1">{v}</dd>
    </div>
  );
}
