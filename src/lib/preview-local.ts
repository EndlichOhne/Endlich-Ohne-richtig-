/** On-device skin fill — orientation only, not a medical prediction. */

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild nicht lesbar"));
    img.src = src;
  });
}

function inkLikely(r: number, g: number, b: number, skinR: number, skinG: number, skinB: number) {
  const lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
  const skinLum = (skinR * 0.3 + skinG * 0.59 + skinB * 0.11) / 255;
  const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  const dist =
    Math.abs(r - skinR) + Math.abs(g - skinG) + Math.abs(b - skinB);
  return lum + 0.08 < skinLum || (sat > 0.18 && dist > 70);
}

export async function simulateRemoval(
  photoUrl: string,
  maskUrl?: string | null,
): Promise<string> {
  const img = await load(photoUrl);
  const w = img.width;
  const h = img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas fehlt");
  ctx.drawImage(img, 0, 0);

  let mask: Uint8ClampedArray | null = null;
  if (maskUrl) {
    const m = await load(maskUrl);
    const mc = document.createElement("canvas");
    mc.width = w;
    mc.height = h;
    const mctx = mc.getContext("2d", { willReadFrequently: true });
    if (mctx) {
      mctx.drawImage(m, 0, 0, w, h);
      mask = mctx.getImageData(0, 0, w, h).data;
    }
  }

  const shot = ctx.getImageData(0, 0, w, h);
  const d = shot.data;

  let sR = 0;
  let sG = 0;
  let sB = 0;
  let sN = 0;
  const step = Math.max(1, Math.floor((w * h) / 8000));
  for (let i = 0; i < d.length; i += 4 * step) {
    const painted = mask ? mask[i + 3] > 40 || mask[i] > 40 : false;
    if (painted) continue;
    sR += d[i];
    sG += d[i + 1];
    sB += d[i + 2];
    sN += 1;
  }
  const skinR = sN ? sR / sN : 190;
  const skinG = sN ? sG / sN : 150;
  const skinB = sN ? sB / sN : 130;

  const mark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const painted = mask
        ? mask[i + 3] > 28 || mask[i] > 40
        : inkLikely(d[i], d[i + 1], d[i + 2], skinR, skinG, skinB);
      if (painted) mark[y * w + x] = 1;
    }
  }

  const out = new Uint8ClampedArray(d);
  const radius = Math.max(6, Math.round(Math.min(w, h) / 28));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (!mark[p]) continue;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = -radius; dy <= radius; dy += 2) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -radius; dx <= radius; dx += 2) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          if (mark[yy * w + xx]) continue;
          const j = (yy * w + xx) * 4;
          r += d[j];
          g += d[j + 1];
          b += d[j + 2];
          n += 1;
        }
      }
      const i = p * 4;
      const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const jitter = (noise - 0.5) * 6;
      if (n > 4) {
        out[i] = Math.min(255, r / n + jitter);
        out[i + 1] = Math.min(255, g / n + jitter * 0.9);
        out[i + 2] = Math.min(255, b / n + jitter * 0.8);
      } else {
        out[i] = Math.min(255, skinR + jitter);
        out[i + 1] = Math.min(255, skinG + jitter * 0.9);
        out[i + 2] = Math.min(255, skinB + jitter * 0.8);
      }
    }
  }

  ctx.putImageData(new ImageData(out, w, h), 0, 0);
  return canvas.toDataURL("image/jpeg", 0.86);
}
