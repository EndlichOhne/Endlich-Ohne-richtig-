import { BRAND } from "@/lib/brand";

type Card = { id: string; keys: RegExp; text: string };

const DISCLAIMER =
  "Das ist allgemeine Orientierung, keine Diagnose, kein Heilversprechen und keine verbindliche Sitzungs- oder Preiszusage. Entscheidend ist die ärztliche Beratung vor Ort.";

const CARDS: Card[] = [
  {
    id: "faktoren",
    keys: /faktor|einfluss|warum.*(sitzung|dauert)|anzahl|wie viele sitz|wieviel sitz|schwierig|aufwand/i,
    text: `Die Zahl der Sitzungen hängt vor allem von Farbe, Pigmentdichte, Stichtiefe, Größe, Körperregion, Alter der Arbeit und deiner Haut ab.

Typische Richtungen (Faustregeln, keine Vorhersage):
• Schwarz und dunkelblau sprechen oft besser an als Gelb, Weiß, Pastell, Hauttöne oder kräftiges Grün.
• Dicht gestochene, mehrschichtige oder professionell stark gesättigte Arbeiten brauchen meist mehr Durchgänge.
• Finger, Knöchel, Fuß, Gesicht und Narbenareale heilen anders als z. B. Oberarm oder Rücken.
• Frische Tattoos und Cover-ups sind oft hartnäckiger als blasse, ältere Linien.

Pro Sitzung wird nur ein Teil des Pigments so zerlegt, dass der Körper ihn abtransportieren kann. Deshalb folgen Pausen – die Abstände legt der Betrieb fest, nicht die App.`,
  },
  {
    id: "farben",
    keys: /farbe|gelb|weiß|weiss|grün|gruen|rot|blau|schwarz|bunt|pmu|microblad|permanent make/i,
    text: `Farbe ist ein starker Faktor, aber nie der einzige.

• Dunkle Pigmente absorbieren viele gängige Laserwellenlängen stärker.
• Gelb, Weiß, Hauttöne und manche Grün- oder Rottöne können weniger Energie aufnehmen oder sich unter Licht verändern (selten: Nachdunkeln).
• PMU und Microblading nutzen oft andere Pigmente als klassische Tattoos – das muss vor Ort geprüft werden, nicht anhand eines Fotos allein.

Mischung, Hersteller und Tiefe sieht man auf einem Handyfoto nicht zuverlässig. Deshalb bleibt jede Farb-Einschätzung hier unverbindlich.`,
  },
  {
    id: "ablauf",
    keys: /ablauf|wie funktioniert|laser|pikosekunde|q-switch|wellenlänge|geraet|gerät/i,
    text: `Kurze Lichtimpulse treffen Pigment. Die Energie zerlegt es in kleinere Partikel. Danach räumt der Körper auf – das braucht Zeit.

Häufig genannt: gütegeschaltete Systeme und Pikosekundenlaser, mit Wellenlängen um 532, 755 oder 1064 nm. Welches Gerät zu welcher Farbe passt, entscheidet nur die fachliche Untersuchung.

Nach der Sitzung: Rötung, Krusten oder Blasen können vorkommen. Nicht aufkratzen, Sonne meiden, die Pflegeanweisung des Betriebs befolgen. Eigenmächtige Cremes, Intervalle oder „Hausmittel“ sind keine gute Idee.`,
  },
  {
    id: "dauern",
    keys: /dauer|lange|wochen|monat|jahr|heilt|heilung|pause|abstand|intervall/i,
    text: `Zwischen Sitzungen liegen oft mehrere Wochen, damit Haut und Immunsystem arbeiten können. Zu kurze Abstände erhöhen Reizungen, ohne zuverlässig schneller zum Ziel zu führen.

Die konkrete Pause setzt der behandelnde Betrieb. Ein vollständiger Verlauf kann Monate bis Jahre dauern – je nach Ausgangsbild. Niemand kann dir seriös ein Enddatum oder „nach X Sitzungen weg“ garantieren.`,
  },
  {
    id: "fragen",
    keys: /fragen|behandler|arzt|ärztin|beratung|was soll ich|mitbringen|termin/i,
    text: `Sinnvolle Fragen an den Betrieb:
• Welche Wellenlänge / welches Gerät ist für meine Farben vorgesehen?
• Wie schätzt ihr Dichte, Tiefe und Region ein – und warum?
• Welche Risiken seht ihr bei meinem Hauttyp (Hypopigmentierung, Narbe, Nachdunkeln)?
• Was gilt für Sonne, Sport, Make-up und die Tage danach?
• Was kostet eine Sitzung konkret, was die Anzahlung, was passiert bei Verschieben?
• Wer behandelt – Ärztin/Arzt oder delegierte Fachkraft, unter wessen Aufsicht?

Für ${BRAND.city}: ${BRAND.praxis}, ${BRAND.street}. Tel. ${BRAND.phoneDisplay}, ${BRAND.email}. Die App ersetzt dieses Gespräch nicht.`,
  },
  {
    id: "doku",
    keys: /dokument|fortschritt|foto|vorher|nachher|journal|akte|pass/i,
    text: `Sinnvolle Dokumentation in der Akte:
• Immer ähnliche Bedingungen: gleiches Licht, gleicher Abstand, gleiche Stelle, ohne Filter.
• Ein klares Vorher-Foto (Basis) und später aktuelle Aufnahmen, nicht nur direkt nach der Sitzung (Schwellung verfälscht).
• Kurzes Journal: Datum, was der Betrieb gesagt hat, wie die Haut reagiert hat – ohne Selbstdiagnose.
• Sitzungen als geplant / erledigt markieren. Der Fortschritt in der App ist deine Einschätzung, kein Messwert.

Fotos bleiben auf diesem Gerät. Wir speichern keine Bilder in unserer Datenbank.`,
  },
  {
    id: "kosten",
    keys: /preis|kosten|euro|€|anzahlung|25|bezahlen|zahlen|stripe|paypal|karte/i,
    text: `Preise in der App sind unverbindliche Richtwerte, kein Angebot. Die Praxis nennt den konkreten Sitzungspreis nach Beratung.

• ${"25"} % Anzahlung auf den Richtwert über die gehostete Stripe-Kasse (Karte, oft Apple Pay / Google Pay, je nach Konto PayPal, SEPA, Klarna).
• Kartennummer, CVC und IBAN bleiben bei Stripe – nicht in der App.
• Restbetrag vor Ort nach der Beratung. Kein Behandlungsvertrag durch die App-Zahlung.
• PRO (digitaler Extra-Zugang) ist getrennt von Sitzungszahlungen.

Quittung geht an die E-Mail, die du bei der Kasse angibst.`,
  },
  {
    id: "schmerz",
    keys: /schmerz|tut das weh|weh|betäub|schmerzhaft|aushalten/i,
    text: `Viele beschreiben kurze, intensive Impulse – vergleichbar mit einem Gummiband, stark abhängig von Region und Hautlage. Das ist sehr individuell.

Ob Kühlung oder örtliche Maßnahmen infrage kommen, entscheidet nur der Betrieb. Die App empfiehlt keine Mittel und keine Dosierung.

Starke, anhaltende Schmerzen, Fieber, Eiter oder sich ausbreitende Rötung: nicht in der App klären, sondern die Praxis oder ärztliches Fachpersonal kontaktieren.`,
  },
  {
    id: "risiko",
    keys: /risiko|narbe|pigment|allerg|krebs|gefahr|nebenwirkung|blase|infekt|eiter|fieber/i,
    text: `Mögliche unerwünschte Wirkungen (unvollständig): Rötung, Schwellung, Blasen, Krusten, vorübergehende oder bleibende Hell- oder Dunklerfärbung, Narben, Infektzeichen, selten allergische Reaktionen oder paradoxes Nachdunkeln mancher Farben.

Das Risiko hängt von Haut, Region, Gerät, Pflege und Vorerkrankungen ab – das prüft der Betrieb, nicht die App.

Bei Infektzeichen, starker Schwellung, Eiter, Fieber oder ungewöhnlichen Hautveränderungen: Praxis oder ärztliches Fachpersonal, nicht weiter selbst experimentieren.`,
  },
  {
    id: "cover",
    keys: /cover|überstechen|ueberstech|neu stechen|verdecken/i,
    text: `Cover-up und Entfernen sind verschiedene Wege. Ein Cover setzt oft voraus, dass das Alte hell genug oder geplant überdeckt werden kann. Dichtes Schwarz oder große Flächen begrenzen, was ein neues Motiv leisten kann.

Ob Entfernen, Teilentfernen oder Cover sinnvoller ist, gehört in die Beratung – inklusive realistischer Erwartung, dass „unsichtbar“ nicht die Regel ist.`,
  },
  {
    id: "sonne",
    keys: /sonne|sonnen|uv|solarium|sommer|bräune|braeune/i,
    text: `UV reizt behandelte Haut und kann Pigmentverschiebungen begünstigen. Viele Betriebe bitten, die Stelle vor und nach Sitzungen konsequent zu schützen.

Konkrete Karenzzeiten nennt der Betrieb. Die App setzt keine Frist.`,
  },
  {
    id: "alter",
    keys: /16|18|minderjähr|alter|kind|jugend/i,
    text: `Die App ist ab 16 Jahren nutzbar (Konto + Check). Ob und unter welchen Bedingungen eine Behandlung vor Ort möglich ist, richtet sich nach ärztlicher und gesetzlicher Vorgabe – das ist nicht automatisch dasselbe wie die App-Nutzung.

Bei unter 18: Einwilligung der Sorgeberechtigten kann vor Ort nötig sein. Keine Behandlung über die App.`,
  },
  {
    id: "datenschutz",
    keys: /daten|datenschutz|foto speicher|upload|ki send|xai|privat/i,
    text: `Check-Antworten und Fotos bleiben auf diesem Gerät. Optional sendet der Scanner ein Foto einmalig an den KI-Dienst, nur nach deiner Einwilligung – nicht in unsere Datenbank, nicht zum Training durch uns.

Konto, Termine, Belege (ohne Kartennummer) und Akte-Metadaten liegen serverseitig, nur für dein Nutzerkonto. Die E-Mail wird mit einem Bestätigungscode geprüft.

Löschen: Profil → Konto und Serverdaten löschen sowie Einwilligungen widerrufen (lokale Fotos).`,
  },
  {
    id: "praxis",
    keys: /karlsruhe|geppo|kaiserstraße|kaiserstrasse|waiblingen|öffnungs|telefon|anrufen|adresse|wo seid/i,
    text: `${BRAND.praxis}
${BRAND.street}, ${BRAND.zip} ${BRAND.city}
Tel. ${BRAND.phoneDisplay}
${BRAND.email}

Zentrale: ${BRAND.zentrale}
Website: ${BRAND.site}

Öffnungszeiten stehen nicht in der App, wenn sie nicht belegt sind – bitte anrufen oder die Website prüfen, statt uns Zeiten zu erfinden.`,
  },
];

function medical(q: string) {
  return /schmerz|infekt|blase|eiter|allerg|blut|notfall|fieber|nekrose|wundheil|krebs/i.test(q);
}

export function guideAnswer(question: string): string {
  const q = question.trim() || "allgemein";
  const scored = CARDS.map((c) => {
    const m = q.match(c.keys);
    return { c, n: m ? m[0].length + 2 : 0 };
  })
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n);

  const picked = scored.slice(0, 2).map((s) => s.c);
  const unique = picked.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);

  const body =
    unique.length > 0
      ? unique.map((c) => c.text).join("\n\n")
      : `Kurz und ehrlich: Ohne Untersuchung kann niemand seriös sagen, wie viele Sitzungen dein Motiv braucht oder was es kostet.

Was die App kann: Faktoren erklären, deine Akte führen, Fotos lokal halten, einen unverbindlichen Check und – wenn verfügbar – eine Foto-Einschätzung.

Was sie nicht kann: diagnostizieren, Garantien geben, Intervalle oder Medikamente verordnen.

Nächster sinnvoller Schritt: ${BRAND.praxis} in ${BRAND.city} anrufen (${BRAND.phoneDisplay}) oder den Frage-Check in der App ausfüllen und zur Beratung mitnehmen.`;

  const extra = medical(q)
    ? "\n\nWichtig: Das ersetzt keine Untersuchung. Bei Beschwerden bitte die Praxis oder ärztliches Fachpersonal kontaktieren."
    : "";

  return `${body}${extra}\n\n${DISCLAIMER}`;
}
