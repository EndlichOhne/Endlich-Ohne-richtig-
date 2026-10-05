import { BRAND } from "@/lib/brand";

/** Store-listing drafts — not submitted; lawyer/HWG review required. */
export const STORE = {
  name: BRAND.name,
  subtitle: "Tattoo entfernen. Informiert.",
  short:
    "Ärztliche Laser-Tattooentfernung: Orientierung zu Aufwand, Sitzungen und Standorten. Keine Diagnose.",
  keywords:
    "Tattooentfernung, PMU entfernen, Microblading, Laser, Cover-up, Beratung Karlsruhe",
  age: "18+ — rechtliche Prüfung vor Einreichung",
  category: "Gesundheit und Fitness / Medical (ohne Diagnose-Claim)",
  support: BRAND.email,
  privacyUrl: `${BRAND.site}/datenschutz`,
  supportUrl: BRAND.site,
  description: [
    "ENDLICH OHNE hilft dabei, Laser-Tattooentfernung sachlich einzuordnen – für Tattoo, PMU, Microblading und Cover-up-Vorbereitung.",
    "Die App ersetzt keine Untersuchung. Sie liefert algorithmische Richtwerte zu möglichem Aufwand und Sitzungen, zeigt Standorte in Deutschland, ein 3D-Körpermodell zur Regionswahl und erklärt Risiken und Nachsorge in klarer Sprache.",
    "Keine Heilversprechen, keine garantierten Ergebnisse, keine verbindlichen Preise. Verbindlich wird es erst in der Beratung vor Ort.",
    "Check und Fotos bleiben auf dem Gerät. Planer und Belege liegen im Konto. 25 %-Anzahlung über Stripe, ohne Kartendaten in der App.",
    `Filiale im Briefing: ${BRAND.praxis}, ${BRAND.street}, ${BRAND.zip} ${BRAND.city}.`,
  ].join("\n\n"),
  whatsNew:
    "Konto (18+), 3D-Körpermodell, sichere Anzahlung über Stripe. Check bleibt lokal. Rechtstexte als Entwurf.",
  privacyLabels: [
    "Konto (E-Mail). Check und Fotos nicht mit uns verknüpft",
    "Gesundheitsangaben nur lokal, optional, löschbar",
    "Standort nur nach Einwilligung, nur im Browser",
    "Fotos nicht hochgeladen",
    "Keine Tracker, keine Werbung",
    "Zahlungsdaten: Stripe, keine Kartenspeicherung in der App",
  ],
} as const;
