import { clampScore, type Level } from "@/lib/tattoo";
import type { ScanResult } from "@/lib/ai-tattoo";

function asLevel(n: number): Level {
  if (n < 0.34) return "low";
  if (n < 0.66) return "mid";
  return "high";
}

function hueName(h: number, s: number, l: number): string | null {
  if (s < 0.16 && l < 0.28) return "Schwarz";
  if (s < 0.12) return l < 0.55 ? "Grau" : null;
  if (h < 18 || h >= 345) return "Rot";
  if (h < 45) return "Orange";
  if (h < 68) return "Gelb";
  if (h < 160) return "Grün";
  if (h < 200) return "Türkis";
  if (h < 255) return "Blau";
  if (h < 310) return "Violett";
  return "Rot";
}

function rgbHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0.001) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

export function analyzePhotoLocal(dataUrl: string, hint: string): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = 96;
      const h = Math.max(32, Math.round((img.height / img.width) * w));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas fehlt"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      let ink = 0;
      let black = 0;
      let satSum = 0;
      const counts = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const { h: hue, s, l } = rgbHsl(r, g, b);
        const isInk = l < 0.62 && (s > 0.12 || l < 0.38);
        if (!isInk) continue;
        ink += 1;
        satSum += s;
        if (s < 0.18 && l < 0.32) black += 1;
        const name = hueName(hue, s, l);
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      const total = (data.length / 4) || 1;
      const coverage = ink / total;
      const blackShare = ink ? black / ink : 0;
      const meanSat = ink ? satSum / ink : 0;
      const colors = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([n]) => n);
      if (!colors.length) colors.push("Schwarz");

      const sizeKey = coverage < 0.08 ? "xs" : coverage < 0.16 ? "s" : coverage < 0.32 ? "m" : coverage < 0.5 ? "l" : "xl";
      const colorHard = colors.some((c) => /Gelb|Weiß|Weiss|Grün|Haut|Orange/.test(c));
      const difficulty = clampScore(
        3.2 + coverage * 4 + meanSat * 2.4 + (colorHard ? 1.6 : 0) - blackShare * 1.4,
      );
      const sessionsLow = Math.max(3, Math.min(12, Math.round(3 + difficulty * 0.7)));
      const sessionsHigh = Math.min(18, sessionsLow + (difficulty > 6.5 ? 5 : 3));
      const hintRegion = hint.match(
        /unterarm|oberarm|wade|oberschenkel|rücken|ruecken|brust|hand|finger|fuß|fuss|nacken|hals|schulter|knöchel|knoechel|rippen/i,
      );
      const region = hintRegion ? hintRegion[0] : "";
      const sizeLevel: Level = sizeKey === "xs" || sizeKey === "s" ? "low" : sizeKey === "l" || sizeKey === "xl" ? "high" : "mid";
      const colorLevel = asLevel(meanSat);
      const intensity = asLevel(1 - (ink ? 0.15 + blackShare * 0.5 : 0.5));
      const complexity: Level = difficulty < 4 ? "low" : difficulty < 7 ? "mid" : "high";

      const result: ScanResult = {
        photoQuality: coverage < 0.02 ? "poor" : "ok",
        photoQualityNote:
          coverage < 0.02
            ? "Auf dem Foto ist zu wenig klar abgegrenztes Pigment erkennbar."
            : "Fotoanalyse auf dem Gerät – ohne Online-KI.",
        sizeKey,
        region: region ? region[0].toUpperCase() + region.slice(1).toLowerCase() : "",
        colors,
        colorIntensity: colorLevel,
        blackShare: asLevel(blackShare),
        pigmentDensity: intensity,
        depthGuess: "Tiefe ist auf einem Foto nicht sicher erkennbar.",
        originGuess: "unbekannt",
        difficulty,
        sessionsLow,
        sessionsHigh,
        sessionCostLow: sizeKey === "xs" || sizeKey === "s" ? 90 : sizeKey === "l" || sizeKey === "xl" ? 180 : 130,
        sessionCostHigh: sizeKey === "xs" || sizeKey === "s" ? 160 : sizeKey === "l" || sizeKey === "xl" ? 280 : 210,
        sizeLevel,
        colorLevel,
        intensity,
        complexity,
        why: `Geräteanalyse: sichtbare Tintenfläche ca. ${Math.round(coverage * 100)} %, Schwarzanteil ${Math.round(blackShare * 100)} %, Farben ${colors.join(", ")}. Keine Diagnose – Dichte und Tiefe bleiben unsicher.`,
        factors: [
          `Sichtbare Fläche eher ${sizeKey.toUpperCase()}`,
          `Farben: ${colors.join(", ")}`,
          blackShare > 0.45 ? "Hoher Dunkelanteil – oft dankbarer für gängige Wellenlängen" : "Weniger reines Schwarz – Farben können den Aufwand erhöhen",
          "Fotoanalyse auf dem Gerät, nicht durch die Online-KI",
        ],
      };
      resolve(result);
    };
    img.onerror = () => reject(new Error("Bild nicht lesbar"));
    img.src = dataUrl;
  });
}
