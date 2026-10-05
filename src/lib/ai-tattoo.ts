import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { FREE_LIMITS } from "@/lib/premium";
import { clampScore, type Level } from "@/lib/tattoo";
import { isProUser, canKiScan, consumeScanCredit } from "@/lib/pro-api";
import { finishScanRun, startScanRun } from "@/lib/billing";
import { guideAnswer } from "@/lib/ai-guide";

function ymNow() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function loadUsage(userId: string) {
  const sql = await getSql();
  const ym = ymNow();
  const rows = await sql<{ scans: number; chats: number }>`
    select scans, chats from ai_usage where user_id = ${userId} and ym = ${ym}
  `;
  return rows[0] ?? { scans: 0, chats: 0 };
}

async function bumpUsage(userId: string, field: "scans" | "chats") {
  const sql = await getSql();
  const ym = ymNow();
  await sql`
    insert into ai_usage (user_id, ym, scans, chats)
    values (${userId}, ${ym}, ${field === "scans" ? 1 : 0}, ${field === "chats" ? 1 : 0})
    on conflict (user_id, ym) do update set
      scans = ai_usage.scans + ${field === "scans" ? 1 : 0},
      chats = ai_usage.chats + ${field === "chats" ? 1 : 0}
  `;
}

function parseJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Kein JSON");
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

function asLevel(v: unknown, fallback: Level = "mid"): Level {
  return v === "low" || v === "mid" || v === "high" ? v : fallback;
}

const globalAi = globalThis as typeof globalThis & { __eoAiQuotaUntil__?: number };

function quotaBlocked() {
  return Date.now() < (globalAi.__eoAiQuotaUntil__ ?? 0);
}

function markQuota(ms = 90_000) {
  globalAi.__eoAiQuotaUntil__ = Date.now() + ms;
}

function clearQuota() {
  globalAi.__eoAiQuotaUntil__ = 0;
}

function extractText(body: {
  choices?: { message?: { content?: unknown } }[];
}): string {
  const raw = body.choices?.[0]?.message?.content ?? "";
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object" && "text" in p) return String((p as { text: unknown }).text);
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

const CHAT_MODELS = ["grok-4.5", "grok-4.6"] as const;

async function grokChat(
  messages: unknown[],
  maxTokens: number,
): Promise<{ ok: true; text: string } | { ok: false; error: string; code?: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "IA online non disponibile in questo ambiente.", code: "unavailable" };
  }
  if (quotaBlocked()) {
    return { ok: false, error: "Online-KI-Kontingent gerade erschöpft.", code: "quota" };
  }

  let last = "Online-KI gerade nicht erreichbar.";
  for (let i = 0; i < CHAT_MODELS.length; i++) {
    const model = CHAT_MODELS[i];
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          max_tokens: maxTokens,
          reasoning: { effort: "low" },
          messages,
        }),
        signal: AbortSignal.timeout(16_000),
      });
      if (res.status === 403) {
        last = "Online-KI-Kontingent gerade erschöpft.";
        continue;
      }
      if (res.status === 429) {
        last = "Online-KI ist kurz ausgelastet.";
        await new Promise((r) => setTimeout(r, 280));
        continue;
      }
      if (!res.ok) {
        last = `Online-KI antwortet nicht (${res.status}).`;
        continue;
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const text = extractText(body);
      if (!text) {
        last = "Leere KI-Antwort.";
        continue;
      }
      clearQuota();
      return { ok: true, text };
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name === "TimeoutError" || name === "AbortError") {
        last = "Die Online-KI braucht gerade länger.";
        break;
      }
      last = "Online-KI nicht erreichbar.";
    }
  }
  if (/Kontingent/.test(last)) markQuota();
  return { ok: false, error: last, code: /Kontingent/.test(last) ? "quota" : "unavailable" };
}

export type ScanResult = {
  photoQuality: "ok" | "poor";
  photoQualityNote: string;
  sizeKey: string;
  region: string;
  colors: string[];
  colorIntensity: Level;
  blackShare: Level;
  pigmentDensity: Level;
  depthGuess: string;
  originGuess: string;
  difficulty: number;
  sessionsLow: number;
  sessionsHigh: number;
  sessionCostLow: number;
  sessionCostHigh: number;
  sizeLevel: Level;
  colorLevel: Level;
  intensity: Level;
  complexity: Level;
  why: string;
  factors: string[];
};

export const getKiStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const usage = await loadUsage(context.userId);
    const isPro = await isProUser(context.userId);
    return {
      online: Boolean(process.env.XAI_API_KEY) && !quotaBlocked(),
      hasKey: Boolean(process.env.XAI_API_KEY),
      ...usage,
      isPro,
    };
  });

export const analyzeTattooPhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { image: string; hint?: string } => {
    const i = input as { image?: string; hint?: string };
    if (!i?.image || typeof i.image !== "string" || i.image.length < 32) {
      throw new Error("Bitte ein Tattoo-Foto hochladen.");
    }
    if (i.image.length > 1_800_000) throw new Error("Foto zu groß. Bitte kleiner komprimieren.");
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(i.image)) {
      throw new Error("Nur JPEG, PNG oder WebP.");
    }
    return { image: i.image, hint: String(i.hint ?? "").slice(0, 200) };
  })
  .handler(async ({ context, data }): Promise<
    { ok: true; result: ScanResult } | { ok: false; error: string; code?: string }
  > => {
    const access = await canKiScan(context.userId);
    if (!access.ok) {
      return {
        ok: false,
        error: "Für einen Online-KI-Scan brauchst du PRO oder einen Einzel-Scan (0,50 €).",
        code: "paywall",
      };
    }
    const runId = await startScanRun(context.userId);
    if (!process.env.XAI_API_KEY) {
      await finishScanRun(runId, context.userId, "failed_server", "unavailable");
      return {
        ok: false,
        error: "Online-KI gerade nicht verfügbar. Einschätzung auf dem Gerät ist möglich.",
        code: "unavailable",
      };
    }

    const prompt = `Du schätzt Laser-Tattooentfernung NUR als Orientierung, keine Diagnose, keine Garantie, keine Heilversprechen.
Analysiere das Foto. Wenn kein Tattoo klar erkennbar: photoQuality=poor.
Antworte NUR mit JSON:
{
  "photoQuality": "ok"|"poor",
  "photoQualityNote": "breve in italiano",
  "sizeKey": "xs"|"s"|"m"|"l"|"xl",
  "region": "z.B. Unterarm",
  "colors": ["Schwarz"],
  "colorIntensity": "low"|"mid"|"high",
  "blackShare": "low"|"mid"|"high",
  "pigmentDensity": "low"|"mid"|"high",
  "depthGuess": "flach|mittel|tief — nur visuell, unsicher",
  "originGuess": "pro|amateur|unbekannt",
  "difficulty": 6.4,
  "sessionsLow": 5,
  "sessionsHigh": 8,
  "sessionCostLow": 120,
  "sessionCostHigh": 180,
  "why": "1-2 frasi in italiano sul perché è più semplice o più difficile",
  "factors": ["kurzer Faktor 1", "kurzer Faktor 2"]
}
Kosten in Euro als unverbindliche Richtwerte (DE, 80-600 pro Sitzung).
Zusatzhinweis des Nutzers: ${data.hint || "keiner"}`;

    const ai = await grokChat(
      [
        {
          role: "system",
          content:
            "Sachlicher Assistent für Laser-Tattooentfernung. Keine Diagnose. Nur JSON. photoQualityNote, why und factors auf Italienisch, außer der Nutzer schreibt auf Deutsch.",
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: data.image, detail: "high" } },
            { type: "text", text: prompt },
          ],
        },
      ],
      900,
    );
    if (!ai.ok) {
      await finishScanRun(runId, context.userId, "failed_server", ai.code ?? "unavailable");
      return { ok: false, error: ai.error, code: ai.code ?? "unavailable" };
    }

    let raw: Record<string, unknown>;
    try {
      raw = parseJsonObject(ai.text);
    } catch {
      await finishScanRun(runId, context.userId, "failed_server", "unreadable");
      return { ok: false, error: "Die KI-Antwort war nicht lesbar. Bitte erneut versuchen.", code: "unavailable" };
    }

    const quality = raw.photoQuality === "poor" ? "poor" : "ok";
    const difficulty = clampScore(Number(raw.difficulty) || 5);
    const sessionsLow = Math.max(2, Math.min(16, Number(raw.sessionsLow) || 4));
    const sessionsHigh = Math.max(sessionsLow + 1, Math.min(20, Number(raw.sessionsHigh) || sessionsLow + 3));
    const colors = Array.isArray(raw.colors)
      ? raw.colors.map((c) => String(c).slice(0, 24)).slice(0, 8)
      : [];
    const result: ScanResult = {
      photoQuality: quality,
      photoQualityNote: String(raw.photoQualityNote ?? "").slice(0, 240),
      sizeKey: ["xs", "s", "m", "l", "xl"].includes(String(raw.sizeKey)) ? String(raw.sizeKey) : "m",
      region: String(raw.region ?? "").slice(0, 40),
      colors,
      colorIntensity: asLevel(raw.colorIntensity),
      blackShare: asLevel(raw.blackShare),
      pigmentDensity: asLevel(raw.pigmentDensity),
      depthGuess: String(raw.depthGuess ?? "").slice(0, 80),
      originGuess: String(raw.originGuess ?? "unbekannt").slice(0, 24),
      difficulty,
      sessionsLow,
      sessionsHigh,
      sessionCostLow: Math.max(80, Math.min(600, Number(raw.sessionCostLow) || 120)),
      sessionCostHigh: Math.max(80, Math.min(700, Number(raw.sessionCostHigh) || 180)),
      sizeLevel: asLevel(raw.sizeKey === "xs" || raw.sizeKey === "s" ? "low" : raw.sizeKey === "l" || raw.sizeKey === "xl" ? "high" : "mid"),
      colorLevel: asLevel(raw.colorIntensity),
      intensity: asLevel(raw.pigmentDensity),
      complexity: difficulty < 4 ? "low" : difficulty < 7 ? "mid" : "high",
      why: String(raw.why ?? "").slice(0, 400),
      factors: Array.isArray(raw.factors)
        ? raw.factors.map((f) => String(f).slice(0, 160)).slice(0, 8)
        : [],
    };

    if (quality === "poor") {
      await finishScanRun(runId, context.userId, "failed_photo", "photo");
      return {
        ok: false,
        error:
          result.photoQualityNote ||
          "Das Tattoo ist auf diesem Bild nicht eindeutig erkennbar. Bitte ein helleres, schärferes Foto hochladen.",
        code: "photo",
      };
    }

    await bumpUsage(context.userId, "scans");
    let consumed = false;
    if (!access.isPro) consumed = await consumeScanCredit(context.userId);
    await finishScanRun(runId, context.userId, "completed", undefined, consumed);
    return { ok: true, result };
  });

const SYSTEM = `Sei l'IA online di ENDLICH OHNE, studio laser a direzione medica a Karlsruhe (Dr. med. Ilyas Geppo, Kaiserstraße 86).

Stile: italiano, chiaro, umano, 8–14 frasi o elenco breve. Niente linguaggio pubblicitario. Se l'utente scrive in tedesco, rispondi in tedesco.

Regole:
- Nessuna diagnosi, nessuna promessa di cura, nessuna garanzia, nessun numero vincolante di sedute o prezzi.
- Spiega i fattori (colore, densità, profondità, zona, età, pelle) invece di fare previsioni.
- Per dolore, segni di infezione, vesciche con pus, febbre, necrosi: rimanda subito allo studio / a un medico, non trattare.
- Nessun farmaco, nessun intervallo prescritto, nessun rimedio casalingo.
- Prezzi solo come orientamento non vincolante. Acconto 25 % via Stripe, resto in studio.
- Le foto restano sul dispositivo, salvo invio nello scanner con consenso.

Se non sei sicuro, dillo. Rimanda alla consulenza in studio.`;

export const askTattooAi = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { messages: { role: "user" | "assistant"; content: string }[] } => {
    const i = input as { messages?: { role: string; content: string }[] };
    if (!Array.isArray(i?.messages) || i.messages.length === 0) {
      throw new Error("Bitte eine Frage stellen.");
    }
    return {
      messages: i.messages.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? "").slice(0, 1600),
      })),
    };
  })
  .handler(async ({
    context,
    data,
  }): Promise<{ ok: true; text: string; via: "ki" | "guide" } | { ok: false; error: string; code?: string }> => {
    const usage = await loadUsage(context.userId);
    const pro = await isProUser(context.userId);
    if (!pro && usage.chats >= FREE_LIMITS.chatsPerMonth) {
      return {
        ok: false,
        error: `Kostenlose KI-Fragen für diesen Monat sind aufgebraucht (${FREE_LIMITS.chatsPerMonth}).`,
        code: "limit",
      };
    }
    const last = data.messages[data.messages.length - 1]?.content ?? "";
    const fallback = (): { ok: true; text: string; via: "ki" | "guide" } => ({
      ok: true,
      text: guideAnswer(last),
      via: "guide",
    });

    const medical =
      /schmerz|infekt|blase|eiter|allerg|blut|notfall|fieber|nekrose|wundheil/i.test(last);
    const ai = await grokChat(
      [
        { role: "system", content: SYSTEM },
        ...data.messages,
      ],
      1100,
    );
    if (!ai.ok) return fallback();
    await bumpUsage(context.userId, "chats");
    const extra = medical
      ? "\n\nWichtig: Das ersetzt keine Untersuchung. Bei Beschwerden bitte die Praxis oder ärztliches Fachpersonal kontaktieren."
      : "";
    return { ok: true, text: `${ai.text}${extra}`, via: "ki" };
  });

export const getAiUsage = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const usage = await loadUsage(context.userId);
    const access = await canKiScan(context.userId);
    return {
      ...usage,
      isPro: access.isPro,
      scanCredits: access.credits,
      canScan: access.ok,
      online: Boolean(process.env.XAI_API_KEY) && !quotaBlocked(),
    };
  });
