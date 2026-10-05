import type { GalleryResult } from "@/lib/gallery";

function shot(
  resultId: string,
  sessionNumber: number,
  imageUrl: string,
  caption: string,
  sortOrder: number,
): GalleryResult["timeline"][number] {
  return {
    id: `${resultId}-t${sortOrder}`,
    resultId,
    imageUrl,
    sessionNumber,
    takenAt: "",
    caption,
    sortOrder,
  };
}

function demo(partial: Omit<GalleryResult, "userId" | "isDemo" | "consentPublish" | "consentReview" | "anonymize" | "moderationStatus" | "rejectReason" | "submittedAt" | "createdAt" | "tattooId">): GalleryResult {
  return {
    userId: "demo",
    isDemo: true,
    tattooId: undefined,
    consentPublish: true,
    consentReview: true,
    anonymize: true,
    moderationStatus: "published",
    rejectReason: "",
    submittedAt: partial.publishedAt,
    createdAt: partial.publishedAt ?? "2026-01-15T00:00:00.000Z",
    ...partial,
  };
}

/** Klinik-eigene bzw. gekennzeichnete Beispielreisen — keine fremden Web-Fotos. */
export const DEMO_RESULTS: GalleryResult[] = [
  demo({
    id: "demo-geo",
    bodyLocation: "arm",
    sizeKey: "l",
    sizeLabel: "ca. 18 × 8 cm",
    colors: ["Schwarz"],
    colorGroup: "black",
    sessionCount: 7,
    progressStatus: "faded",
    description:
      "Geometrische Linien am Unterarm. Dunkle Fläche, mehrere Durchgänge. Beispielreise, keine Vorhersage.",
    beforeUrl: "/gallery/geo-before.webp",
    currentUrl: "/gallery/geo-after.webp",
    publishedAt: "2026-03-12T00:00:00.000Z",
    timeline: [
      shot("demo-geo", 0, "/gallery/geo-before.webp", "Start", 0),
      shot("demo-geo", 3, "/gallery/geo-mid.webp", "Sitzung 3", 1),
      shot("demo-geo", 5, "/gallery/geo-late.webp", "Sitzung 5", 2),
      shot("demo-geo", 7, "/gallery/geo-after.webp", "Aktueller Stand", 3),
    ],
  }),
  demo({
    id: "demo-heart",
    bodyLocation: "hand",
    sizeKey: "s",
    sizeLabel: "ca. 4 × 4 cm",
    colors: ["Rot", "Schwarz"],
    colorGroup: "red",
    sessionCount: 4,
    progressStatus: "treating",
    description:
      "Kleines Motiv am Handgelenk. Rote Anteile oft langsamer. Beispiel, kein Heilversprechen.",
    beforeUrl: "/gallery/heart-before.webp",
    currentUrl: "/gallery/heart-after.webp",
    publishedAt: "2026-04-02T00:00:00.000Z",
    timeline: [
      shot("demo-heart", 0, "/gallery/heart-before.webp", "Start", 0),
      shot("demo-heart", 2, "/gallery/heart-mid.webp", "Sitzung 2", 1),
      shot("demo-heart", 4, "/gallery/heart-after.webp", "Aktueller Stand", 2),
    ],
  }),
  demo({
    id: "demo-rose",
    bodyLocation: "arm",
    sizeKey: "m",
    sizeLabel: "ca. 10 × 8 cm",
    colors: ["Rot", "Grün"],
    colorGroup: "color",
    sessionCount: 6,
    progressStatus: "faded",
    description:
      "Bunte Rose am Oberarm. Grün und Rot unterschiedlich. Nur Demo zur Orientierung.",
    beforeUrl: "/gallery/rose-before.webp",
    currentUrl: "/gallery/rose-after.webp",
    publishedAt: "2026-02-20T00:00:00.000Z",
    timeline: [
      shot("demo-rose", 0, "/gallery/rose-before.webp", "Start", 0),
      shot("demo-rose", 3, "/gallery/rose-mid.webp", "Sitzung 3", 1),
      shot("demo-rose", 6, "/gallery/rose-after.webp", "Aktueller Stand", 2),
    ],
  }),
  demo({
    id: "demo-wave",
    bodyLocation: "shoulder",
    sizeKey: "l",
    sizeLabel: "ca. 16 × 12 cm",
    colors: ["Schwarz", "Grau"],
    colorGroup: "grey",
    sessionCount: 10,
    progressStatus: "treating",
    description:
      "Dichte graue Fläche an der Schulter. Längerer Verlauf, noch in Behandlung. Beispiel.",
    beforeUrl: "/gallery/wave-before.webp",
    currentUrl: "/gallery/wave-after.webp",
    publishedAt: "2026-05-08T00:00:00.000Z",
    timeline: [
      shot("demo-wave", 0, "/gallery/wave-before.webp", "Start", 0),
      shot("demo-wave", 4, "/gallery/wave-mid.webp", "Sitzung 4", 1),
      shot("demo-wave", 8, "/gallery/wave-late.webp", "Sitzung 8", 2),
      shot("demo-wave", 10, "/gallery/wave-after.webp", "Aktueller Stand", 3),
    ],
  }),
  demo({
    id: "demo-clinic",
    bodyLocation: "arm",
    sizeKey: "m",
    sizeLabel: "Unterarm",
    colors: ["Schwarz"],
    colorGroup: "black",
    sessionCount: 7,
    progressStatus: "faded",
    description:
      "Dokumentiertes Beispiel aus dem Bildmaterial der Praxis. Individuell, unverbindlich.",
    beforeUrl: "/gallery/demo-arm-before.webp",
    currentUrl: "/gallery/demo-arm-after.webp",
    publishedAt: "2025-11-04T00:00:00.000Z",
    timeline: [
      shot("demo-clinic", 0, "/gallery/demo-arm-before.webp", "Start", 0),
      shot("demo-clinic", 3, "/gallery/demo-arm-mid.webp", "Sitzung 3", 1),
      shot("demo-clinic", 7, "/gallery/demo-arm-after.webp", "Aktueller Stand", 2),
    ],
  }),
];
