export type Article = {
  slug: string;
  title: string;
  teaser: string;
  body: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "ablauf",
    title: "Wie funktioniert Tattooentfernung?",
    teaser: "Laser zerlegt Pigment. Der Körper räumt danach auf – Sitzung für Sitzung.",
    body: [
      "Bei der gängigen Laser-Tattooentfernung treffen kurze Lichtimpulse auf Farbpigmente in der Haut. Die Energie zerteilt das Pigment in kleinere Partikel.",
      "Anschließend übernimmt der Körper: Immunzellen transportieren Bruchstücke ab. Das braucht Zeit – deshalb folgen Behandlungen erst nach einer Heilungsphase.",
      "Das ist allgemeine Information, keine Behandlungsanweisung. Welches Gerät und welcher Abstand zu dir passen, entscheidet nur die fachliche Beratung vor Ort.",
    ],
  },
  {
    slug: "laserarten",
    title: "Welche Laser gibt es?",
    teaser: "Wellenlänge und Pulsdauer entscheiden mit, welche Farben ansprechen.",
    body: [
      "Häufig genannt werden gütegeschaltete (Q-switched) Systeme und Pikosekundenlaser. Unterschiedliche Wellenlängen (etwa 532, 755, 1064 nm) treffen unterschiedliche Pigmente unterschiedlich gut.",
      "Welche Technik ein Betrieb einsetzt, muss der Betrieb selbst angeben. In dieser App steht bei Anbietern ohne belegte Quelle: „Nicht bekannt / muss verifiziert werden.“",
      "Professionelle medizinische Beratung ist erforderlich, bevor ein Verfahren gewählt wird.",
    ],
  },
  {
    slug: "sitzungen",
    title: "Warum braucht man mehrere Sitzungen?",
    teaser: "Ein Impuls entfernt selten alles. Haut und Immunsystem brauchen Pausen.",
    body: [
      "Pigment liegt in Schichten und Dichten. Pro Sitzung wird nur ein Teil so zerlegt, dass der Körper ihn abtransportieren kann.",
      "Zu kurze Abstände erhöhen das Risiko für Reizungen, ohne zuverlässig schneller zum Ziel zu führen. Die tatsächlichen Abstände legt der behandelnde Fachbetrieb fest.",
    ],
  },
  {
    slug: "farben",
    title: "Warum verschwinden manche Farben schwieriger?",
    teaser: "Gelb, Weiß, Grün und Hauttöne gelten oft als hartnäckiger.",
    body: [
      "Dunkle Pigmente (Schwarz, Dunkelblau) absorbieren viele gängige Laserwellenlängen stärker. Helle und bunte Töne können weniger Energie aufnehmen oder sich unter dem Laser verändern.",
      "Das ist eine grobe Faustregel, keine Vorhersage für dein Tattoo. Mischung, Tiefe und Hersteller der Farbe sind ohne Untersuchung nicht bekannt.",
    ],
  },
  {
    slug: "faktoren",
    title: "Was beeinflusst die Behandlung?",
    teaser: "Farbe, Dichte, Tiefe, Ort, Alter, Haut und deine Heilung.",
    body: [
      "Typische Einflussgrößen: Pigmentfarbe und -dichte, Stichtiefe, Körperregion, Alter der Arbeit, Hauttyp, Sonneneinfluss, Immunlage und die gewählte Technik.",
      "Keine App kann diese Faktoren aus einem Formular vollständig ableiten. Die Einschätzung hier ist algorithmisch und unverbindlich.",
    ],
  },
  {
    slug: "dazwischen",
    title: "Was passiert zwischen den Sitzungen?",
    teaser: "Heilung, Abbau, Schutz vor Sonne – ohne eigenmächtige Experimente.",
    body: [
      "Nach der Sitzung kann die Haut gereizt, gerötet oder geschwollen sein. Krusten oder Blasen kommen vor; die Bewertung gehört in die Nachsorge des Betriebs.",
      "Häufige Hinweise aus der Praxis (keine Anweisung dieser App): Stelle nicht aufkratzen, Sonne meiden, Nachsorgeplan des Betriebs befolgen.",
    ],
  },
  {
    slug: "geduld",
    title: "Warum ist Geduld wichtig?",
    teaser: "Abbau braucht Wochen. Schneller heißt nicht automatisch besser.",
    body: [
      "Sichtbare Aufhellung zeigt sich oft erst, wenn Schwellung abklingt und der Körper Pigment abtransportiert hat.",
      "Wer Abstände verkürzt oder parallel andere Verfahren mischt, ohne Absprache, erhöht Risiken. Professionelle medizinische bzw. fachliche Beratung ist erforderlich.",
    ],
  },
  {
    slug: "tattoo-vs-pmu",
    title: "Tattoo vs. PMU",
    teaser: "Andere Pigmente, andere Tiefe – gleiches Prinzip, anderes Vorgehen.",
    body: [
      "Körper-Tattoos sitzen oft tiefer und dichter. Permanent Make-up liegt flacher, nutzt aber Farben, die auf Laser unerwartet reagieren können (z. B. Umschlag ins Rötliche oder Dunklere).",
      "Deshalb ist PMU-Entfernung kein „kleines Tattoo“. Die Beratung muss Farbe und Region (Gesicht) extra bewerten.",
    ],
  },
  {
    slug: "microblading",
    title: "Microblading entfernen",
    teaser: "Haarstrich-Pigmente im Gesicht: Vorsicht vor aggressiven Versprechen.",
    body: [
      "Microblading arbeitet mit feinen Pigmentstrichen, oft in Brauen. Laser, Entfernungsgels oder Salze werden beworben – nicht jedes Verfahren ist für jede Haut geeignet.",
      "Keine Aussage in dieser App ersetzt die Untersuchung. Unvollständige Entfernung und Farbwechsel sind möglich.",
    ],
  },
  {
    slug: "coverup",
    title: "Cover-up-Aufhellung",
    teaser: "Nicht alles muss weg – manchmal reicht es, Platz für neues Motiv zu schaffen.",
    body: [
      "Eine Aufhellung zielt darauf, Kontrast und Dichte so zu reduzieren, dass ein Cover-up tragfähig wird. Das ist ein anderes Ziel als vollständige Entfernung.",
      "Wie hell „hell genug“ ist, klären Laserbetrieb und ggf. Tätowierer gemeinsam mit dir. Keine Garantie auf ein bestimmtes Cover-up-Ergebnis.",
    ],
  },
  {
    slug: "nebenwirkungen",
    title: "Mögliche Nebenwirkungen",
    teaser: "Reizung ist häufig. Narben und Pigmentverschiebungen kommen vor.",
    body: [
      "Möglich sind unter anderem Rötung, Schwellung, Krusten, Blasen, Juckreiz, Infektion, Hypo- oder Hyperpigmentierung, Narben und unvollständige Entfernung.",
      "Die konkrete Risikobewertung gehört in die professionelle Beratung, nicht in eine App.",
    ],
  },
  {
    slug: "risiken",
    title: "Risiken",
    teaser: "Kein Verfahren ist risikofrei. Vollständige Entfernung ist nicht garantiert.",
    body: [
      "Neben Hautreaktionen kann Laser Farben verändern statt sie zu entfernen. Vorerkrankungen, Medikamente, Schwangerschaft und frische Bräune können Gegenanzeigen sein – das klärt nur die Anamnese vor Ort.",
      "Diese App stellt keine Diagnose und gibt keine Freigabe zur Behandlung.",
    ],
  },
  {
    slug: "nachsorge",
    title: "Nachsorge",
    teaser: "Was nach der Sitzung gilt, sagt der behandelnde Betrieb – nicht die App.",
    body: [
      "Typische Themen der Nachsorge: Kühlung, Wundschutz, Sportpause, Schwimm- und Saunapause, konsequenter Sonnenschutz nach Freigabe.",
      "Weicht etwas von dem ab, was dir erklärt wurde – oder treten starke Schmerzen, Eiter, Fieber auf – ist professionelle medizinische Beratung erforderlich.",
    ],
  },
  {
    slug: "beratung",
    title: "Wann professionelle Beratung suchen?",
    teaser: "Immer vor der ersten Sitzung. Sofort bei unklaren Hautveränderungen.",
    body: [
      "Suche fachliche Beratung, bevor du behandelst: bei Gesicht, Schleimhautnähe, bunten Farben, Narben, Allergien, Hauterkrankungen, Implantaten im Areal oder wenn du unsicher bist.",
      "Diese Liste ist unvollständig. Im Zweifel gilt: nicht selbst entscheiden, vor Ort klären.",
    ],
  },
];

export function findArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}
