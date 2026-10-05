const DB = "eo-photos";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePhoto(key: string, dataUrl: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadPhoto(key: string): Promise<string | null> {
  const db = await openDb();
  const value = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

export async function deletePhoto(key: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function clearAllPhotos() {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export function photoKey(tattooId: string, slot: string) {
  return `${tattooId}:${slot}`;
}

export async function countPhotosForTattoo(tattooId: string): Promise<number> {
  const db = await openDb();
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  const prefix = `${tattooId}:`;
  return keys.filter((k) => String(k).startsWith(prefix)).length;
}

export async function savePhotoForTattoo(
  tattooId: string,
  slot: string,
  dataUrl: string,
  unlimited = false,
) {
  const key = photoKey(tattooId, slot);
  const existing = await loadPhoto(key);
  if (!existing && !unlimited) {
    const n = await countPhotosForTattoo(tattooId);
    if (n >= 10) {
      throw new Error("Maximal 10 Fotos pro Tattoo im Free-Plan.");
    }
  }
  await savePhoto(key, dataUrl);
}

export function compressImage(file: File, max = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas fehlt"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild nicht lesbar"));
    };
    img.src = url;
  });
}

/** Honest visual fade of dark ink — not a medical prediction. */
export function simulateFade(dataUrl: string, amount: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas fehlt"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const shot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = shot.data;
      const t = Math.min(1, Math.max(0, amount));
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const lum = (r * 0.3 + g * 0.5 + b * 0.2) / 255;
        if (lum < 0.72) {
          const lift = (0.82 - lum) * t * 180;
          d[i] = Math.min(255, r + lift * 0.95);
          d[i + 1] = Math.min(255, g + lift * 0.92);
          d[i + 2] = Math.min(255, b + lift * 0.88);
        }
      }
      ctx.putImageData(shot, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => reject(new Error("Bild nicht lesbar"));
    img.src = dataUrl;
  });
}

/** Crop edges so the tattoo is the focus. Not automatic face detection. */
export function cropFocus(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const top = Math.round(img.height * 0.1);
      const side = Math.round(img.width * 0.06);
      const w = Math.max(1, img.width - side * 2);
      const h = Math.max(1, img.height - top - Math.round(img.height * 0.04));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas fehlt"));
        return;
      }
      ctx.drawImage(img, side, top, w, h, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("Bild nicht lesbar"));
    img.src = dataUrl;
  });
}
