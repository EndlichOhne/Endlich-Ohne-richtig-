import { BRAND } from "@/lib/brand";

export type Provider = {
  slug: string;
  name: string;
  city: string;
  street: string;
  zip: string;
  phoneDisplay: string;
  phoneHref: string;
  website: string;
  websiteLabel: string;
  booking: string;
  services: string[];
  briefingNote: string;
  updated: string;
  hours: string;
  laser: string;
  lat: number;
  lng: number;
  rating?: { value: string; count: number; source: string };
};

const SERVICES = [
  "Tattooentfernung",
  "PMU-Entfernung",
  "Microblading-Entfernung",
  "Cover-up-Aufhellung",
];

function telHref(display: string) {
  const first = display.split(",")[0].replace(/[^\d+]/g, "");
  if (first.startsWith("00")) return `tel:+${first.slice(2)}`;
  if (first.startsWith("0")) return `tel:+49${first.slice(1)}`;
  if (first.startsWith("41")) return `tel:+${first}`;
  if (first.startsWith("+")) return `tel:${first}`;
  return `tel:+${first}`;
}

function loc(
  slug: string,
  city: string,
  street: string,
  zip: string,
  phone: string,
  lat: number,
  lng: number,
  extra?: Partial<Provider>,
): Provider {
  const path = `/standorte/filiale-${slug}/`;
  return {
    slug,
    name: `ENDLICH OHNE · ${city}`,
    city,
    street,
    zip,
    phoneDisplay: phone,
    phoneHref: telHref(phone),
    website: `${BRAND.site}${path}`,
    websiteLabel: "endlich-ohne.de",
    booking: `${BRAND.site}${path}`,
    services: SERVICES,
    briefingNote:
      "Adresse und Telefon laut endlich-ohne.de. Öffnungszeiten und Lasergerät: nicht unabhängig verifiziert.",
    updated: BRAND.updated,
    hours: "Nicht bekannt / bitte auf der Standortseite prüfen.",
    laser: "Nicht bekannt / muss vor Ort erfragt werden.",
    lat,
    lng,
    ...extra,
  };
}

export const PROVIDERS: Provider[] = [
  loc("aachen", "Aachen", "Vaalser Str. 525", "52074", "0160 7678311", 50.775, 6.084),
  loc("balingen", "Balingen", "Ebertstr. 27", "72336", "07433 9976707", 48.275, 8.851),
  loc("bamberg", "Bamberg", "Franz-Ludwig-Straße 5C", "96047", "0951 97102024", 49.899, 10.903),
  loc("berlin", "Berlin", "Spenerstr. 28", "10557", "030 55282601", 52.52, 13.405),
  loc("bielefeld", "Bielefeld", "Welle 20", "33602", "0521 9441724", 52.021, 8.535),
  loc("bonn", "Bonn", "Alfred-Bucherer-Straße 40-42", "53115", "0228 24036003", 50.737, 7.098),
  loc("brandenburg", "Brandenburg an der Havel", "Hauptstraße 34A", "14776", "03381 2099366", 52.412, 12.532),
  loc("bremen", "Bremen", "Sögestr. 54", "28195", "0421 637083", 53.079, 8.802),
  loc("brilon", "Brilon", "Hubertusstraße 15", "59929", "02961 9110590", 51.396, 8.568),
  loc("castrop-rauxel", "Castrop-Rauxel", "Münsterplatz 8", "44575", "0157 35145380", 51.55, 7.312),
  loc("darmstadt", "Darmstadt", "Schulstraße 9", "64283", "06151 1546644", 49.872, 8.651),
  loc("delmenhorst", "Delmenhorst", "Parkstraße 12", "27749", "04221 8005499", 53.051, 8.631),
  loc("dresden-pirna", "Pirna", "Dohnaische Str. 90", "01796", "03501 7904090", 50.962, 13.942),
  loc("duesseldorf", "Düsseldorf", "Kaiserstr. 28 A", "40479", "0211 97633989", 51.227, 6.773),
  loc("duisburg", "Duisburg", "Mülheimer Str. 137", "47058", "0203 73955574", 51.434, 6.762),
  loc("endingen-bei-freiburg", "Endingen", "Lehenhofstraße 5", "79346", "07642 926832", 48.142, 7.7),
  loc("essen-ruhrgebiet", "Essen", "Richterstr. 14-16", "45143", "0201 50905910", 51.451, 7.013),
  loc("flensburg", "Flensburg", "Friesische Str. 21", "24937", "01514 0307710", 54.784, 9.437),
  loc("frankfurt", "Frankfurt am Main", "Röntgenstr. 9", "60388", "06109 6987222", 50.126, 8.75),
  loc("fulda", "Fulda", "Lindenstr. 40", "36037", "0173 6906522", 50.555, 9.677),
  loc("hamburg", "Hamburg", "Eppendorfer Baum 3", "20249", "040 18084534", 53.589, 9.988),
  loc("hannover", "Hannover", "Thie 1", "30539", "0511 10535859", 52.375, 9.732),
  loc("heilbronn", "Heilbronn", "Lohtorstr. 17-21", "74072", "0160 91843981", 49.143, 9.211),
  loc(
    "karlsruhe",
    "Karlsruhe",
    BRAND.street,
    BRAND.zip,
    BRAND.phoneDisplay,
    49.009,
    8.404,
    {
      briefingNote:
        "Adresse, Telefon und Website aus dem Filial-Briefing Karlsruhe. Öffnungszeiten und Laser: bitte vor Ort klären.",
      rating: {
        value: "5,0",
        count: 40,
        source: "Angabe im Produktbriefing – nicht unabhängig geprüft",
      },
    },
  ),
  loc("kassel", "Kassel", "Wilhelmshöher Allee 320", "34131", "0561 43020850", 51.312, 9.447),
  loc("kempen", "Kempen", "Klosterstr. 12", "47906", "02152 5507010", 51.364, 6.419),
  loc("kiel", "Kiel", "Kehdenstr. 2-10", "24103", "0431 593770", 54.323, 10.139),
  loc("koeln", "Köln", "Trierer Str. 27", "50676", "0176 63076011", 50.937, 6.96),
  loc("landshut", "Landshut", "Dreifaltigkeitsplatz 175", "84028", "0871 26640", 48.536, 12.151),
  loc("lauchringen", "Lauchringen", "Hauptstr. 31", "79787", "07741 835825", 47.627, 8.315),
  loc("leipzig", "Leipzig", "Magazingasse 9", "04109", "0341 26466265", 51.339, 12.377),
  loc("lingen", "Lingen", "Haselünnerstr. 53", "49809", "0591 14480141", 52.521, 7.318),
  loc("mainz", "Mainz", "Dagobertstraße 6", "55116", "06131 3274275", 49.998, 8.273),
  loc("mannheim", "Mannheim", "Werderstr. 1", "68165", "0621 4004290", 49.488, 8.469),
  loc("muenchen", "München", "Sendlinger Str. 37", "80331", "089 554955", 48.135, 11.582),
  loc("pirmasens", "Pirmasens", "Erlenbrunner Str. 41", "66955", "06331 2890614", 49.201, 7.605),
  loc("saarbruecken", "Saarbrücken", "Schützenstr. 3-5", "66123", "0681 93802626", 49.24, 6.997),
  loc("stuttgart", "Stuttgart", "Brennerstr. 31", "70182", "0711 63365100", 48.775, 9.183),
  loc("ulm", "Ulm", "Pfauengasse 25", "89073", "0731 38868775", 48.401, 9.987),
  loc("unna-und-dortmund", "Unna", "Obere Husemannstraße 3", "59423", "0157 39362808", 51.535, 7.689),
  loc("unterschleissheim-muenchen", "Unterschleißheim", "Alleestraße 65", "85716", "089 75998273", 48.28, 11.567),
  loc("wilhelmshaven", "Wilhelmshaven", "Gökerstraße 125F", "26384", "0151 12205973", 53.53, 8.113),
  loc("wolfenbuettel", "Wolfenbüttel", "Reichsstr. 7", "38300", "0176 51097442", 52.164, 10.54),
  loc("wolfsburg", "Wolfsburg", "Tischlerstr. 1 a", "38440", "05361 7025951", 52.423, 10.787),
  loc("zuerichsee", "Freienbach (CH)", "Weinbergstrasse 10", "8807", "+41 76 395 52 02", 47.205, 8.758),
];

export function mapsUrl(p: Provider) {
  const q = encodeURIComponent(`${p.street}, ${p.zip} ${p.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function findProvider(slug: string) {
  return PROVIDERS.find((p) => p.slug === slug);
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
