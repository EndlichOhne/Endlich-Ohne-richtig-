import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isProUser } from "@/lib/pro-api";

const PROMPT = `Edit this real photograph. Completely remove ALL tattoo ink, lines and pigment from the skin so the area looks as if it had never been tattooed. Reconstruct natural skin: match surrounding tone, pores, peach fuzz, lighting and shadows. Keep identity, pose, clothing, background and camera grain unchanged. Do not beautify, do not add makeup, do not change body shape. No text, watermark or logo. Photorealistic photo, not illustration. Visual simulation only, not a medical prediction.`;

const MASK_PROMPT = `The second image is a user mask: bright/painted pixels mark the tattoo to remove. Remove only ink in that marked region. Reconstruct natural skin there, matching nearby tone, pores and light. Leave everything outside the mark unchanged. Photorealistic photograph, no text. Simulation only.`;

export type PreviewAccess = {
  isPro: boolean;
  freeUsed: boolean;
  canRun: boolean;
  freeLeft: number;
  online: boolean;
};

async function loadUsage(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ free_used: boolean; runs: number }>`
    select free_used, runs from preview_usage where user_id = ${userId} limit 1
  `;
  return rows[0] ?? { free_used: false, runs: 0 };
}

async function markRun(userId: string, consumeFree: boolean) {
  const sql = await getSql();
  await sql`
    insert into preview_usage (user_id, free_used, used_at, runs, updated_at)
    values (
      ${userId},
      ${consumeFree},
      now(),
      1,
      now()
    )
    on conflict (user_id) do update set
      free_used = preview_usage.free_used or ${consumeFree},
      used_at = coalesce(preview_usage.used_at, now()),
      runs = preview_usage.runs + 1,
      updated_at = now()
  `;
}

export const getPreviewAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<PreviewAccess> => {
    const isPro = await isProUser(context.userId);
    let freeUsed = false;
    try {
      const u = await loadUsage(context.userId);
      freeUsed = Boolean(u.free_used);
    } catch {
      freeUsed = false;
    }
    return {
      isPro,
      freeUsed,
      canRun: isPro || !freeUsed,
      freeLeft: isPro ? 99 : freeUsed ? 0 : 1,
      online: Boolean(process.env.XAI_API_KEY),
    };
  });

function asDataUrl(raw: string) {
  if (raw.startsWith("data:image/")) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

async function urlToData(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error("Ergebnisbild nicht geladen");
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function parseEditBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.url === "string" && o.url.startsWith("http")) return o.url;
  if (typeof o.b64_json === "string") return asDataUrl(o.b64_json);
  const data = o.data;
  if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
    const first = data[0] as Record<string, unknown>;
    if (typeof first.b64_json === "string") return asDataUrl(first.b64_json);
    if (typeof first.url === "string") return first.url;
  }
  return null;
}

async function editImage(photo: string, mask?: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "KI gerade nicht verfügbar.", code: "unavailable" };

  const imageObj = { url: photo, type: "image_url" as const };
  const prompt = mask ? MASK_PROMPT : PROMPT;
  const models = ["grok-imagine-image-2.0", "grok-imagine-image-quality", "grok-imagine-image"];

  const payloads: Record<string, unknown>[] = [
    {
      prompt,
      image: imageObj,
      response_format: "b64_json",
      resolution: "1k",
    },
    {
      prompt,
      image: imageObj,
      resolution: "1k",
    },
  ];
  if (mask) {
    payloads.unshift({
      prompt,
      image: imageObj,
      images: [
        imageObj,
        { url: mask, type: "image_url" },
      ],
      response_format: "b64_json",
      resolution: "1k",
    });
  }

  let last = "KI-Vorschau gerade nicht erreichbar.";
  for (const model of models) {
    for (const extra of payloads) {
      try {
        const res = await fetch("https://api.x.ai/v1/images/edits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, ...extra }),
          signal: AbortSignal.timeout(45_000),
        });
        if (res.status === 404 || res.status === 400) {
          last = `KI-Antwort ${res.status}.`;
          continue;
        }
        if (res.status === 429 || res.status === 403) {
          last = "KI-Kontingent gerade ausgelastet. Bitte später erneut.";
          continue;
        }
        if (!res.ok) {
          last = `KI-Vorschau antwortet nicht (${res.status}).`;
          continue;
        }
        const body = await res.json();
        const parsed = parseEditBody(body);
        if (!parsed) {
          last = "KI-Ergebnis war leer.";
          continue;
        }
        const dataUrl = parsed.startsWith("data:") ? parsed : await urlToData(parsed);
        return { ok: true as const, image: dataUrl };
      } catch (e) {
        const name = e instanceof Error ? e.name : "";
        if (name === "TimeoutError" || name === "AbortError") {
          last = "Die KI braucht gerade länger. Bitte erneut versuchen.";
          break;
        }
        last = "KI-Vorschau nicht erreichbar.";
      }
    }
  }
  return { ok: false as const, error: last, code: "unavailable" };
}

export const runPreview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { image: string; mask?: string; consent: boolean } => {
    const i = input as { image?: string; mask?: string; consent?: boolean };
    if (!i?.consent) throw new Error("Bitte die Einwilligung zur KI-Bearbeitung setzen.");
    if (!i.image || typeof i.image !== "string" || i.image.length > 2_400_000) {
      throw new Error("Bitte ein Tattoo-Foto hochladen.");
    }
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(i.image)) {
      throw new Error("Nur JPEG, PNG oder WebP.");
    }
    const mask =
      typeof i.mask === "string" &&
      i.mask.length < 2_400_000 &&
      /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(i.mask)
        ? i.mask
        : undefined;
    return { image: i.image, mask, consent: true };
  })
  .handler(async ({
    context,
    data,
  }): Promise<
    | { ok: true; image: string; via: "ki" }
    | { ok: false; error: string; code: "pro" | "unavailable" | "limit" }
  > => {
    const isPro = await isProUser(context.userId);
    let freeUsed = false;
    try {
      freeUsed = Boolean((await loadUsage(context.userId)).free_used);
    } catch {
      freeUsed = false;
    }
    if (!isPro && freeUsed) {
      return {
        ok: false,
        error: "Der kostenlose Test ist in diesem Konto bereits genutzt. Weiter mit PRO.",
        code: "pro",
      };
    }
    if (!process.env.XAI_API_KEY) {
      return { ok: false, error: "Online-KI gerade nicht verfügbar.", code: "unavailable" };
    }

    const edited = await editImage(data.image, data.mask);
    if (!edited.ok) return { ok: false, error: edited.error, code: "unavailable" };

    try {
      await markRun(context.userId, !isPro);
    } catch {
      /* still return the image — entitlement write should not drop a paid result */
    }
    return { ok: true, image: edited.image, via: "ki" };
  });
