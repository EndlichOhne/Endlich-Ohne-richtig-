import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { newId } from "@/lib/tattoo";
import { DEMO_RESULTS } from "@/lib/gallery-seed";
import {
  colorGroupFrom,
  type ColorGroup,
  type GalleryLocation,
  type GalleryResult,
  type GallerySize,
  type ModerationStatus,
  type ProgressStatus,
  type TimelineShot,
} from "@/lib/gallery";

type ResultRow = {
  id: string;
  user_id: string;
  tattoo_id: string | null;
  is_demo: boolean;
  body_location: string;
  size_key: string;
  size_label: string;
  colors_json: string;
  color_group: string;
  session_count: number;
  progress_status: string;
  description: string;
  anonymize: boolean;
  consent_publish: boolean;
  consent_review: boolean;
  moderation_status: string;
  reject_reason: string;
  before_url: string;
  current_url: string;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
};

type TimeRow = {
  id: string;
  result_id: string;
  image_url: string;
  session_number: number;
  taken_at: string;
  caption: string;
  sort_order: number;
};

function parseColors(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map((c) => String(c).slice(0, 24)).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function mapShot(r: TimeRow): TimelineShot {
  return {
    id: r.id,
    resultId: r.result_id,
    imageUrl: r.image_url,
    sessionNumber: r.session_number,
    takenAt: r.taken_at,
    caption: r.caption,
    sortOrder: r.sort_order,
  };
}

function mapResult(r: ResultRow, timeline: TimelineShot[]): GalleryResult {
  return {
    id: r.id,
    userId: r.user_id,
    tattooId: r.tattoo_id ?? undefined,
    isDemo: Boolean(r.is_demo),
    bodyLocation: (r.body_location as GalleryLocation) || "other",
    sizeKey: (r.size_key as GallerySize) || "m",
    sizeLabel: r.size_label,
    colors: parseColors(r.colors_json),
    colorGroup: (r.color_group as ColorGroup) || "black",
    sessionCount: r.session_count,
    progressStatus: (r.progress_status as ProgressStatus) || "treating",
    description: r.description,
    anonymize: Boolean(r.anonymize),
    consentPublish: Boolean(r.consent_publish),
    consentReview: Boolean(r.consent_review),
    moderationStatus: (r.moderation_status as ModerationStatus) || "draft",
    rejectReason: r.reject_reason,
    beforeUrl: r.before_url,
    currentUrl: r.current_url,
    submittedAt: r.submitted_at,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    timeline,
  };
}

function publicView(r: GalleryResult): GalleryResult {
  return { ...r, userId: r.isDemo ? "demo" : "user" };
}

async function loadTimeline(ids: string[]): Promise<Record<string, TimelineShot[]>> {
  const out: Record<string, TimelineShot[]> = {};
  if (ids.length === 0) return out;
  const sql = await getSql();
  const rows = await sql<TimeRow>`
    select id, result_id, image_url, session_number, taken_at, caption, sort_order
    from gallery_timeline
    order by sort_order asc
  `;
  const want = new Set(ids);
  for (const row of rows) {
    if (!want.has(row.result_id)) continue;
    (out[row.result_id] ??= []).push(mapShot(row));
  }
  return out;
}

async function insertResult(r: GalleryResult) {
  const sql = await getSql();
  await sql`
    insert into gallery_results (
      id, user_id, tattoo_id, is_demo, body_location, size_key, size_label,
      colors_json, color_group, session_count, progress_status, description,
      anonymize, consent_publish, consent_review, moderation_status, reject_reason,
      before_url, current_url, submitted_at, published_at, created_at, updated_at
    ) values (
      ${r.id}, ${r.userId}, ${r.tattooId ?? null}, ${r.isDemo}, ${r.bodyLocation},
      ${r.sizeKey}, ${r.sizeLabel}, ${JSON.stringify(r.colors)}, ${r.colorGroup},
      ${r.sessionCount}, ${r.progressStatus}, ${r.description}, ${r.anonymize},
      ${r.consentPublish}, ${r.consentReview}, ${r.moderationStatus}, ${r.rejectReason},
      ${r.beforeUrl}, ${r.currentUrl}, ${r.submittedAt}, ${r.publishedAt},
      ${r.createdAt}, now()
    )
    on conflict (id) do nothing
  `;
  for (const t of r.timeline) {
    await sql`
      insert into gallery_timeline (id, result_id, image_url, session_number, taken_at, caption, sort_order)
      values (${t.id}, ${t.resultId}, ${t.imageUrl}, ${t.sessionNumber}, ${t.takenAt}, ${t.caption}, ${t.sortOrder})
      on conflict (id) do nothing
    `;
  }
}

async function ensureDemo() {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from gallery_results where is_demo = true`;
  if ((rows[0]?.n ?? 0) > 0) return;
  for (const d of DEMO_RESULTS) await insertResult(d);
}

function assertImage(url: string, label: string) {
  if (!url || url.length < 24) throw new Error(`${label} fehlt.`);
  if (url.startsWith("/gallery/")) return url;
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(url)) {
    throw new Error(`${label}: nur JPEG, PNG oder WebP.`);
  }
  if (url.length > 700_000) throw new Error(`${label} ist zu groß. Bitte stärker komprimieren.`);
  return url;
}

async function isAdminEmail(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId}`;
  const email = (rows[0]?.email ?? "").trim().toLowerCase();
  return email === BRAND.email.toLowerCase() || email === "kontakt@endlich-ohne.de";
}

export const listPublishedResults = createServerFn({ method: "GET" }).handler(async () => {
  await ensureDemo();
  const sql = await getSql();
  const rows = await sql<ResultRow>`
    select * from gallery_results
    where moderation_status = 'published'
    order by published_at desc nulls last, created_at desc
  `;
  const times = await loadTimeline(rows.map((r) => r.id));
  return rows.map((r) => publicView(mapResult(r, times[r.id] ?? [])));
});

export const getGalleryResult = createServerFn({ method: "GET" })
  .validator((input: unknown): { id: string } => ({
    id: String((input as { id?: string })?.id ?? "").slice(0, 80),
  }))
  .handler(async ({ data }) => {
    await ensureDemo();
    const sql = await getSql();
    const rows = await sql<ResultRow>`select * from gallery_results where id = ${data.id}`;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "Ergebnis nicht gefunden." };
    if (row.moderation_status !== "published") {
      return { ok: false as const, error: "Dieses Ergebnis ist nicht öffentlich." };
    }
    const times = await loadTimeline([row.id]);
    return { ok: true as const, result: publicView(mapResult(row, times[row.id] ?? [])) };
  });

export const listMyResults = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<ResultRow>`
      select * from gallery_results
      where user_id = ${context.userId} and is_demo = false
      order by created_at desc
    `;
    const times = await loadTimeline(rows.map((r) => r.id));
    return rows.map((r) => mapResult(r, times[r.id] ?? []));
  });

export type SubmitInput = {
  beforeUrl: string;
  currentUrl: string;
  bodyLocation: GalleryLocation;
  sizeKey: GallerySize;
  sizeLabel?: string;
  colors: string[];
  sessionCount: number;
  progressStatus: ProgressStatus;
  description?: string;
  anonymize: boolean;
  consentPublish: boolean;
  consentReview: boolean;
  timeline?: { imageUrl: string; sessionNumber: number; caption?: string }[];
};

export const submitGalleryResult = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): SubmitInput => {
    const i = input as SubmitInput;
    if (!i?.consentPublish || !i?.consentReview) {
      throw new Error("Bitte beide Einwilligungen setzen.");
    }
    const loc = i.bodyLocation;
    if (!["arm", "hand", "leg", "shoulder", "back", "chest", "neck", "other"].includes(loc)) {
      throw new Error("Bitte eine Körperstelle wählen.");
    }
    const size = i.sizeKey;
    if (!["s", "m", "l"].includes(size)) throw new Error("Bitte eine Größe wählen.");
    const status = i.progressStatus;
    if (!["treating", "faded", "done"].includes(status)) throw new Error("Bitte einen Status wählen.");
    const colors = Array.isArray(i.colors) ? i.colors.map((c) => String(c).slice(0, 24)).slice(0, 8) : [];
    if (colors.length === 0) throw new Error("Bitte mindestens eine Farbe wählen.");
    const sessions = Math.max(1, Math.min(30, Number(i.sessionCount) || 0));
    const extra = Array.isArray(i.timeline) ? i.timeline.slice(0, 4) : [];
    return {
      beforeUrl: assertImage(String(i.beforeUrl ?? ""), "Vorher-Foto"),
      currentUrl: assertImage(String(i.currentUrl ?? ""), "Aktuelles Foto"),
      bodyLocation: loc,
      sizeKey: size,
      sizeLabel: String(i.sizeLabel ?? "").slice(0, 40),
      colors,
      sessionCount: sessions,
      progressStatus: status,
      description: String(i.description ?? "").slice(0, 600),
      anonymize: Boolean(i.anonymize),
      consentPublish: true,
      consentReview: true,
      timeline: extra.map((t) => ({
        imageUrl: assertImage(String(t.imageUrl ?? ""), "Fortschrittsfoto"),
        sessionNumber: Math.max(0, Math.min(30, Number(t.sessionNumber) || 0)),
        caption: String(t.caption ?? "").slice(0, 80),
      })),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ n: number }>`
      select count(*)::int as n from gallery_results
      where user_id = ${context.userId} and is_demo = false
        and moderation_status in ('submitted', 'review', 'published')
    `;
    if ((existing[0]?.n ?? 0) >= 8) {
      throw new Error("Maximal 8 Einreichungen pro Konto.");
    }
    const id = newId("gr");
    const now = new Date().toISOString();
    const timeline: TimelineShot[] = [
      {
        id: `${id}-t0`,
        resultId: id,
        imageUrl: data.beforeUrl,
        sessionNumber: 0,
        takenAt: "",
        caption: "Start",
        sortOrder: 0,
      },
      ...(data.timeline ?? []).map((t, i) => ({
        id: `${id}-tx${i}`,
        resultId: id,
        imageUrl: t.imageUrl,
        sessionNumber: t.sessionNumber,
        takenAt: "",
        caption: t.caption || `Sitzung ${t.sessionNumber}`,
        sortOrder: i + 1,
      })),
      {
        id: `${id}-t9`,
        resultId: id,
        imageUrl: data.currentUrl,
        sessionNumber: data.sessionCount,
        takenAt: "",
        caption: "Aktueller Stand",
        sortOrder: 50,
      },
    ];
    const row: GalleryResult = {
      id,
      userId: context.userId,
      isDemo: false,
      bodyLocation: data.bodyLocation,
      sizeKey: data.sizeKey,
      sizeLabel: data.sizeLabel || "",
      colors: data.colors,
      colorGroup: colorGroupFrom(data.colors),
      sessionCount: data.sessionCount,
      progressStatus: data.progressStatus,
      description: data.description || "",
      anonymize: data.anonymize,
      consentPublish: true,
      consentReview: true,
      moderationStatus: "review",
      rejectReason: "",
      beforeUrl: data.beforeUrl,
      currentUrl: data.currentUrl,
      submittedAt: now,
      publishedAt: null,
      createdAt: now,
      timeline,
    };
    await insertResult(row);
    return { ok: true as const, id, status: "review" as const };
  });

export const getGalleryAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => ({ admin: await isAdminEmail(context.userId) }));

export const listReviewQueue = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!(await isAdminEmail(context.userId))) {
      return { ok: false as const, error: "Nur die Praxis kann Einreichungen prüfen." };
    }
    const sql = await getSql();
    const rows = await sql<ResultRow>`
      select * from gallery_results
      where is_demo = false and moderation_status in ('submitted', 'review')
      order by submitted_at asc nulls last
    `;
    const times = await loadTimeline(rows.map((r) => r.id));
    return { ok: true as const, items: rows.map((r) => mapResult(r, times[r.id] ?? [])) };
  });

export const moderateGalleryResult = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { id: string; action: "publish" | "reject" | "remove"; reason?: string } => {
    const i = input as { id?: string; action?: string; reason?: string };
    if (!i?.id) throw new Error("Eintrag fehlt.");
    if (i.action !== "publish" && i.action !== "reject" && i.action !== "remove") {
      throw new Error("Aktion ungültig.");
    }
    return { id: String(i.id).slice(0, 80), action: i.action, reason: String(i.reason ?? "").slice(0, 400) };
  })
  .handler(async ({ context, data }) => {
    if (!(await isAdminEmail(context.userId))) {
      throw new Error("Nur die Praxis kann Einreichungen prüfen.");
    }
    const sql = await getSql();
    if (data.action === "remove") {
      await sql`delete from gallery_timeline where result_id = ${data.id}`;
      await sql`delete from gallery_results where id = ${data.id} and is_demo = false`;
      return { ok: true as const };
    }
    if (data.action === "publish") {
      await sql`
        update gallery_results
        set moderation_status = 'published', published_at = now(), reject_reason = '', updated_at = now()
        where id = ${data.id} and is_demo = false
      `;
      return { ok: true as const };
    }
    await sql`
      update gallery_results
      set moderation_status = 'rejected', reject_reason = ${data.reason || "Nicht veröffentlicht."}, updated_at = now()
      where id = ${data.id} and is_demo = false
    `;
    return { ok: true as const };
  });
