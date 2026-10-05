import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AR, EN, RU, TR } from "@/lib/locales";

export type Locale = "de" | "en" | "tr" | "ru" | "ar";
export const LOCALES: Locale[] = ["de", "en", "tr", "ru", "ar"];
export const LOCALE_KEY = "eo-locale";
export const DEFAULT_LOCALE: Locale = "de";

const DE: Record<string, string> = {
  "nav.home": "Home",
  "nav.file": "Akte",
  "nav.check": "Check",
  "nav.appointments": "Termine",
  "nav.more": "Mehr",
  "nav.main": "Hauptnavigation",
  "nav.call": "Anrufen {phone}",
  "nav.account": "Konto",
  "nav.signIn": "Anmelden",

  "consent.welcome": "Willkommen",
  "splash.loading": "App wird geladen",
  "consent.body":
    "Jede Zustimmung muss einzeln bestätigt werden. Ohne ausdrückliche 18+-Bestätigung bleibt die App geschlossen. Keine Diagnose, keine Garantie.",
  "consent.accept": "App betreten",
  "consent.agbCheck": "Ich akzeptiere die AGB.",
  "consent.privacyCheck": "Ich akzeptiere die Datenschutzerklärung.",
  "consent.medicalCheck":
    "Ich habe den medizinischen Hinweis gelesen: keine Diagnose, kein Heilversprechen, keine Garantie.",
  "consent.age18": "Ich bestätige, dass ich mindestens 18 Jahre alt bin.",
  "consent.agb": "AGB",
  "consent.privacy": "Datenschutz",
  "consent.notes": "Hinweise",
  "consent.imprint": "Impressum",
  "consent.foot":
    "Standort und Erinnerungen bleiben aus. Widerruf unter Profil. Texte sind Entwürfe.",

  "disclaimer.full":
    "Diese App dient ausschließlich der allgemeinen Information und Orientierung. Sie ersetzt keine ärztliche Untersuchung, professionelle Beratung oder individuelle Behandlungsempfehlung. Angaben zu Kosten, Sitzungsanzahl und Behandlungserfolg sind unverbindliche Richtwerte und können individuell erheblich abweichen. Vorher-/Nachher-Bilder sind keine typischen Ergebnisse und keine Garantie.",

  "legal.draft":
    "Entwurf – keine Rechtsberatung. Vor Veröffentlichung durch eine:n qualifizierte:n Rechtsanwält:in bzw. Datenschutzexpert:in prüfen lassen. Rechtliche Prüfung erforderlich.",
  "legal.translationNote":
    "Übersetzungen dienen der Orientierung. Rechtlich maßgeblich ist die deutsche Fassung.",

  "brand.tagline": "Ärztliche Laser-Tattooentfernung",
  "brand.hero": "Tattoo entfernen. Informiert entscheiden.",
  "home.lead":
    "Erste Einschätzung zu Aufwand, möglichen Sitzungen und Kosten – individuell und unverbindlich. Keine Diagnose, keine Garantie.",
  "home.start": "Meine Einschätzung starten",
  "home.find": "Standort finden",
  "home.needAccount": "Check, 3D-Körper, Planer und Anzahlung: bitte",
  "home.signIn": "anmelden oder registrieren",
  "home.stayLocal": "Check-Antworten bleiben auf dem Gerät.",
  "home.kind.tattoo": "Tattoo entfernen",
  "home.kind.pmu": "PMU entfernen",
  "home.kind.microblading": "Microblading",
  "home.kind.coverup": "Cover-up vorbereiten",
  "home.step1.t": "Laserimpuls",
  "home.step1.d": "Kurzes Licht trifft das Pigment.",
  "home.step2.t": "Zerlegung",
  "home.step2.d": "Farbe bricht in kleinere Partikel.",
  "home.step3.t": "Abbau",
  "home.step3.d": "Der Körper transportiert Stück für Stück ab.",
  "home.step4.t": "Heilung",
  "home.step4.d": "Die Haut braucht Ruhe – ohne Zeitdruck.",
  "home.strip.praxis": "Praxis",
  "home.strip.laser": "Laser",
  "home.strip.tattoo": "Tattoo",
  "home.strip.pmu": "PMU",
  "home.galleryKicker": "Galerie",
  "home.galleryTitle": "Echte Ergebnisse",
  "home.galleryLead":
    "Vorher/Nachher mit Slider. Derzeit Beispiele – keine typischen Ergebnisse.",
  "home.galleryCta": "Galerie ansehen",
  "home.faq": "Häufige Fragen",
  "home.faq1.q": "Wie viele Sitzungen brauche ich?",
  "home.faq1.a":
    "Das hängt unter anderem von Farbe, Dichte, Tiefe, Region und Haut ab. Der Check liefert nur algorithmische Richtwerte – keine Diagnose und keine Garantie.",
  "home.faq2.q": "Was kostet eine Behandlung?",
  "home.faq2.a":
    "Beispielhafte Richtwerte liegen oft zwischen 80 € und 600 € pro Sitzung. Pro Sitzung kannst du 25 % als Anzahlung über Stripe zahlen, 75 % bleiben für den Termin vor Ort. Verbindliche Preise entstehen erst in der Beratung.",
  "home.faq3.q": "Wie funktioniert die 25 %-Anzahlung?",
  "home.faq3.a":
    "Du wählst einen Sitzungsrichtwert. 25 % zahlst du über Stripe (Karte, Apple Pay, Google Pay, PayPal, Lastschrift oder Klarna – ohne Kartennummer in der App). 75 % sind bei der Sitzung fällig. Kein Behandlungsvertrag, keine Garantie. Widerruf: 14 Tage (Entwurf).",
  "home.faq4.q": "Läuft die App auf meinem Handy?",
  "home.faq4.a":
    "Ja. iPhone, iPad und Android: über Safari oder Chrome auf den Startbildschirm legen. Unter Mehr → App aufs Handy steht die Kurzanleitung.",
  "home.faq5.q": "Kann jede Farbe entfernt werden?",
  "home.faq5.a":
    "Dunkle Pigmente sprechen oft besser an. Gelb, Weiß, Grün und Hauttöne gelten häufig als hartnäckiger. Vollständige Entfernung ist nicht garantiert.",
  "home.faq6.q": "Ist die App eine medizinische Beratung?",
  "home.faq6.a":
    "Nein. ENDLICH OHNE informiert und orientiert. Untersuchung, Freigabe und Nachsorge gehören in den Fachbetrieb.",

  "pro.teaserTitle": "Sieh deine Haut ohne Tattoo",
  "pro.teaserBody":
    "Eine KI-Vorschau kostenlos in diesem Konto. Danach unbegrenzte Scans mit PRO – 3,99 € / Monat oder 22 € / Jahr. Einzel-Scan 0,50 €. Simulation, keine Diagnose.",
  "pro.teaserCta": "PRO ansehen",
  "pro.teaserClose": "Hinweis schließen",

  "mehr.title": "Profil",
  "mehr.lead":
    "Konto für Planer und Belege. Check und Fotos bleiben auf dem Gerät – keine Gesundheitsdaten auf dem Server.",
  "mehr.account": "Konto",
  "mehr.signOut": "Abmelden",
  "mehr.needAccount": "Ohne Konto kein Check, kein Planer, keine Anzahlung.",
  "mehr.signIn": "Anmelden oder registrieren",
  "mehr.delete": "Konto und gespeicherte Termine/Belege unwiderruflich löschen?",
  "mehr.language": "Sprache",
  "mehr.group.app": "App",
  "mehr.group.orient": "Orientierung",
  "mehr.group.data": "Daten",
  "mehr.group.legal": "Rechtliches",
  "mehr.link.akte": "Meine Akte",
  "mehr.link.scanner": "KI-Scanner",
  "mehr.link.preview": "KI-Entfernungsvorschau",
  "mehr.link.assistant": "Online-KI (Grok)",
  "mehr.link.results": "Echte Ergebnisse",
  "mehr.link.reminders": "Erinnerungen",
  "mehr.link.install": "Auf iPhone, iPad und Android",
  "mehr.link.body": "3D-Körper",
  "mehr.link.pro": "PRO",
  "mehr.link.praxis": "Praxiszugang",
  "mehr.link.purchases": "Käufe wiederherstellen",
  "mehr.link.wissen": "Wissen",
  "mehr.link.prices": "Beispielpreise",
  "mehr.link.pay": "25 % Anzahlung",
  "mehr.link.sites": "Standorte",
  "mehr.link.risks": "Risiken",
  "mehr.link.consents": "Einwilligungen",
  "mehr.link.review": "Galerie prüfen",
  "mehr.link.medical": "Medizinischer Hinweis",
  "mehr.link.withdraw": "Widerruf Anzahlung",
  "mehr.link.terms": "Nutzungsbedingungen",
  "mehr.link.privacy": "Datenschutz",
  "mehr.link.imprint": "Impressum",
  "mehr.link.launch": "Launch-Checkliste",

  "check.kicker": "Check",
  "check.title": "Unverbindliche Einschätzung",
  "check.lead": "Algorithmische Orientierung, keine Diagnose.",
  "check.submit": "Einschätzung zeigen",
  "check.what": "Was möchtest du entfernen?",
  "check.region": "Körperstelle",
  "check.size": "Größe",
  "check.colors": "Farben",
  "check.age": "Alter der Arbeit",
  "check.origin": "Herkunft",
  "check.result": "Richtwert",
  "check.sessions": "{low}–{high} Sitzungen",
  "kind.tattoo": "Tattoo",
  "kind.pmu": "Permanent Make-up",
  "kind.microblading": "Microblading",
  "kind.coverup": "Cover-up-Aufhellung",
  "size.xs": "sehr klein",
  "size.s": "klein",
  "size.m": "mittel",
  "size.l": "groß",
  "size.xl": "sehr groß",
  "age.under6": "unter 6 Monate",
  "age.6to12": "6–12 Monate",
  "age.1to3": "1–3 Jahre",
  "age.3to5": "3–5 Jahre",
  "age.over5": "über 5 Jahre",
  "origin.pro": "professionelles Tattoo",
  "origin.amateur": "Amateur-/Laientattoo",
  "origin.unknown": "unbekannt",
  "region.arm": "Arm",
  "region.forearm": "Unterarm",
  "region.hand": "Hand",
  "region.shoulder": "Schulter",
  "region.chest": "Brust",
  "region.back": "Rücken",
  "region.belly": "Bauch",
  "region.hip": "Hüfte",
  "region.leg": "Bein",
  "region.foot": "Fuß",
  "region.face": "Gesicht",
  "region.brows": "Augenbrauen",
  "region.lips": "Lippen",
  "region.other": "andere",
  "color.Schwarz": "Schwarz",
  "color.Dunkelblau": "Dunkelblau",
  "color.Blau": "Blau",
  "color.Rot": "Rot",
  "color.Orange": "Orange",
  "color.Gelb": "Gelb",
  "color.Grün": "Grün",
  "color.Türkis": "Türkis",
  "color.Violett": "Violett",
  "color.Weiß": "Weiß",
  "color.Hautfarbe": "Hautfarbe",
  "color.andere": "andere",

  "gallery.kicker": "Galerie",
  "gallery.title": "Echte Ergebnisse",
  "gallery.subtitle":
    "Entdecke dokumentierte Fortschritte auf dem Weg zur Tattoo-Entfernung.",
  "gallery.demo": "Beispiel / Demo",
  "gallery.disclaimer":
    "Jede Tattoo-Entfernung ist individuell. Sitzungszahl, Dauer und Ergebnis können stark abweichen. Abgebildete Verläufe sind keine typischen Ergebnisse, kein Heilversprechen und keine Garantie.",
  "gallery.filter": "Filter",
  "gallery.submit": "Eigenes Ergebnis teilen",
  "gallery.empty": "Keine Treffer. Filter zurücksetzen oder später wiederkommen.",
  "loc.arm": "Arm",
  "loc.hand": "Hand",
  "loc.leg": "Bein",
  "loc.shoulder": "Schulter",
  "loc.back": "Rücken",
  "loc.chest": "Brust",
  "loc.neck": "Hals",
  "loc.other": "Sonstige",
  "progress.treating": "in Behandlung",
  "progress.faded": "aufgehellt",
  "progress.done": "weit fortgeschritten",

  "auth.callout":
    "Check, Planer und Anzahlung brauchen ein Konto. Gesundheitsangaben bleiben auf dem Gerät.",
  "auth.signIn": "Anmelden oder registrieren",
  "login.title": "Anmelden",
  "login.register": "Registrieren",
  "login.email": "E-Mail",
  "login.password": "Passwort",
  "login.submit": "Weiter",
  "login.verify": "Bitte E-Mail bestätigen",

  "install.banner": "App aufs Handy legen",
  "install.close": "Schließen",

  "ki.online": "Online-KI verbunden",
  "ki.offline": "Online-KI gerade nicht erreichbar",
  "assistant.title": "Online-KI",
  "assistant.placeholder": "Frage zur Laser-Tattooentfernung…",
  "assistant.send": "Senden",
  "scanner.title": "KI-Scanner",
  "scanner.cta": "Foto analysieren",

  "prices.kicker": "Orientierung",
  "prices.title": "Beispielpreise",
  "prices.lead":
    "Richtwerte pro Sitzung, keine Angebote. 25 % Anzahlung, 75 % vor Ort.",

  "sites.kicker": "Standorte",
  "sites.call": "Anrufen",

  "wissen.kicker": "Wissen",
  "wissen.title": "Häufige Fragen",

  "lang.de": "Deutsch",
  "lang.en": "English",
  "lang.tr": "Türkçe",
  "lang.ru": "Русский",
  "lang.ar": "العربية",
  "lang.choose": "Sprache",
};

Object.assign(DE, {
  "home.signedIn": "Angemeldet. Planer und Belege liegen in deinem Konto.",
  "home.statSites": "Standorte",
  "home.statMed": "ärztlich",
  "home.statLed": "geleitet",
  "home.statWithout": "ohne",
  "home.statPromise": "Heilversprechen",
  "home.accountKicker": "Konto",
  "home.accountTitle": "Anmelden, dann einschätzen",
  "home.accountLead": "Registrierung ab 18. Check bleibt lokal. Planer und Belege im Konto.",
  "home.register": "Registrieren",
  "home.akteKicker": "Akte",
  "home.akteTitle": "Fortschritt dokumentieren",
  "home.akteLead": "Scanner, Passport, Journal und KI-Schätzung – ohne Diagnose.",
  "home.toAkte": "Zur Akte",
  "home.kiScan": "KI-Scan",
  "home.kiKicker": "Online-KI",
  "home.kiTitle": "Frag Grok zur Entfernung",
  "home.kiLead": "Echte Online-KI zu Faktoren, Ablauf und Doku. Keine Diagnose.",
  "home.askNow": "Jetzt fragen",
  "home.studioKicker": "3D-Studio",
  "home.studioTitle": "Körper am Modell markieren",
  "home.studioLead": "Drehbares Mannequin mit Laser-Scan. Tippe eine Region an – nur Orientierung für den Check, keine anatomische Diagnose.",
  "home.mark3d": "In 3D markieren",
  "home.genericModel": "Generisches Modell · keine Personendaten",
  "home.services": "Leistungen",
  "home.treatments": "Behandlungen",
  "home.insight": "Einblick",
  "home.fromPraxis": "Aus der Praxis",
  "home.process": "Ablauf",
  "home.howLaser": "Wie der Laser arbeitet",
  "home.step": "Schritt {n}",
  "home.moreWissen": "Mehr im Wissensbereich",
  "home.branch": "Filiale Karlsruhe",
  "home.viewSite": "Standort ansehen",
  "home.orient": "Orientierung",
  "home.next": "Nächster Schritt",
  "home.nextTitle": "Erste Einschätzung, unverbindlich",
  "home.nextLead": "In wenigen Angaben zu möglichen Sitzungen und Richtwerten. Check und Fotos bleiben auf dem Gerät. Planer und Belege liegen im Konto. Keine Diagnose.",
  "home.startCheck": "Check starten",
  "home.appPhone": "App aufs Handy",
  "hint.tattoo": "Körper-Pigment",
  "hint.pmu": "oft Gesicht",
  "hint.microblading": "oft Brauen",
  "hint.coverup": "aufhellen, nicht löschen",
  "tag.allgemein": "Leitfaden · keine Diagnose",
  "tag.algorithmisch": "Algorithmische Einschätzung",
  "tag.ki": "Online-KI · Grok",
  "tag.anbieter": "Anbieterangabe",
  "tag.nutzer": "Eingereicht · geprüft",
  "tag.briefing": "Briefing – Prüfung offen",
  "tag.werbung": "Werbung",
  "tag.demo": "Beispiel / Demo",
  "install.ios": "Auf iPhone und iPad: zum Home-Bildschirm",
  "install.android": "Auf Android: App aufs Handy legen",
  "install.desktop": "Als App installieren – Handy, Tablet, Desktop",
  "install.do": "Installieren",
  "install.guide": "Anleitung",
  "mehr.deleteBtn": "Konto und Serverdaten löschen",
  "mehr.deleteFail": "Löschen fehlgeschlagen. Bitte später erneut.",
  "mehr.deleteNote": "Stripe-Zahlungen bleiben beim Zahlungsdienst (Widerruf gesondert). Check auf dem Gerät löscht du über Einwilligungen.",
  "legal.kicker": "Entwurf",
  "legal.agb": "Nutzungsbedingungen",
  "legal.privacy": "Datenschutz",
  "legal.imprint": "Impressum",
  "legal.notes": "Medizinischer Hinweis",
  "legal.withdraw": "Widerruf",
  "filter.all": "Alle",
  "gcolor.black": "Schwarz",
  "gcolor.grey": "Schwarz/Grau",
  "gcolor.color": "Bunt",
  "gcolor.red": "Rot",
  "gcolor.blue": "Blau",
  "gcolor.green": "Grün",
  "gsize.s": "Klein",
  "gsize.m": "Mittel",
  "gsize.l": "Groß",
  "check.sizeQ": "Wie groß ist die behandelte Fläche?",
  "check.width": "Breite in cm (optional)",
  "check.height": "Höhe in cm (optional)",
  "check.colorsQ": "Welche Farben enthält das Tattoo?",
  "check.multi": "Mehrfachauswahl.",
  "gallery.share": "Meinen Fortschritt teilen",
  "gallery.mine": "Meine Einreichungen",
  "gallery.color": "Tattoo-Farbe",
  "gallery.sizeF": "Größe",
  "gallery.place": "Körperstelle",
  "gallery.sessions": "Sitzungen",
  "gallery.status": "Status",
  "gallery.loadFail": "Galerie konnte nicht geladen werden.",
  "ki.checking": "KI wird geprüft…",
  "ki.guide": "Leitfaden aktiv",
  "wissen.kicker2": "Sachlich",
  "wissen.lead": "Ohne Heilversprechen. Kein Ersatz für die Beratung vor Ort.",
  "notes.lead":
    "Die Check-Texte sind Orientierung, keine Diagnose vom Foto und keine Freigabe zur Behandlung. Vorher-/Nachher-Bilder in der Galerie sind individuell; Demos sind gekennzeichnet und kein Versprechen für dein Ergebnis.",
  "home.previewKicker": "Neu · KI",
  "home.previewTitle": "Sieh deine Haut ohne Tattoo",
  "home.previewLead":
    "Foto hochladen. Die KI erzeugt eine realistische Vorschau. Einmal kostenlos in diesem Konto – danach PRO. Simulation, keine Garantie.",
  "home.previewCta": "Vorschau testen",
  "preview.kicker": "KI-Vorschau",
  "preview.title": "Haut ohne Tattoo",
  "preview.cta": "KI-Vorschau erstellen",
  "preview.free": "Kostenloser Test: 1 Vorschau in diesem Konto. Nicht durch Neuinstallation zurücksetzbar.",
  "preview.pro": "PRO · weitere Vorschauen in diesem Konto.",
  "pro.hero": "Deine Haut – ohne das Tattoo. Als Vorschau.",
  "pro.heroLead":
    "KI-Entfernungsvorschau, unbegrenzte Scans und die volle Akte. {price}. Keine Diagnose, keine Garantie, kein Behandlungsvertrag.",
  "pro.cta": "PRO freischalten",
  "pro.freeBadge": "1 KI-Vorschau als Test inklusive",
  "pro.feat1": "KI-Vorschau: Haut ohne Tattoo",
  "pro.feat2": "Unbegrenzte KI-Scans",
  "pro.feat3": "Unbegrenzter KI-Assistent",
  "pro.feat4": "Unbegrenzte Tattoos in der Akte",
});


const TABLES: Record<Locale, Record<string, string>> = {
  de: DE,
  en: EN,
  tr: TR,
  ru: RU,
  ar: AR,
};

let currentLocale: Locale = DEFAULT_LOCALE;

function isLocale(v: string | null): v is Locale {
  return v === "de" || v === "en" || v === "tr" || v === "ru" || v === "ar";
}

function readStored(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (isLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function getLocale() {
  return currentLocale;
}

export function setLocaleState(next: Locale) {
  currentLocale = next;
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
) {
  const table = TABLES[locale] ?? DE;
  let s = table[key] ?? DE[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function t(key: string, vars?: Record<string, string | number>) {
  return translate(currentLocale, key, vars);
}

type Ctx = {
  locale: Locale;
  ready: boolean;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleRaw] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setLocaleRaw(stored);
    setLocaleState(stored);
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleRaw(next);
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      ready,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, ready, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: currentLocale,
      ready: true,
      setLocale: setLocaleState,
      t: (key: string, vars?: Record<string, string | number>) =>
        translate(currentLocale, key, vars),
    };
  }
  return ctx;
}

export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t: tr } = useI18n();
  return (
    <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={
            locale === code
              ? "min-h-10 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground"
              : "min-h-10 rounded-full bg-muted px-3 text-sm font-medium text-foreground"
          }
        >
          {tr(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
}
