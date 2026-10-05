export const ARTICLE_COVER: Record<string, string> = {
  ablauf: "/images/step-1.webp",
  laserarten: "/images/laser-hq.webp",
  sitzungen: "/images/step-4.webp",
  farben: "/images/tattoo.webp",
  faktoren: "/images/coverup-arm.webp",
  dazwischen: "/images/step-3.webp",
  geduld: "/images/portrait.webp",
  "tattoo-vs-pmu": "/images/pmu.webp",
  microblading: "/images/pmu-ba.webp",
  coverup: "/images/coverup.webp",
  nebenwirkungen: "/images/result-neck.jpg",
  risiken: "/images/wand.jpg",
  nachsorge: "/images/praxis-hq.webp",
  beratung: "/images/arzt-hq.webp",
};

export const KIND_IMG = {
  tattoo: "/images/tattoo.webp",
  pmu: "/images/pmu.webp",
  microblading: "/images/coverup.webp",
  coverup: "/images/coverup-arm.webp",
} as const;

export const KIND_HINT = {
  tattoo: "Körper-Pigment",
  pmu: "oft Gesicht",
  microblading: "oft Brauen",
  coverup: "aufhellen, nicht löschen",
} as const;

export const COLOR_TONE: Record<string, string> = {
  Schwarz: "bg-ink-black",
  Dunkelblau: "bg-ink-navy",
  Blau: "bg-ink-blue",
  Rot: "bg-ink-red",
  Orange: "bg-ink-orange",
  Gelb: "bg-ink-yellow",
  Grün: "bg-ink-green",
  Türkis: "bg-ink-teal",
  Violett: "bg-ink-violet",
  Weiß: "bg-ink-white",
  Hautfarbe: "bg-ink-skin",
  andere: "bg-ink-other",
};
