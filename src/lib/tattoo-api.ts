import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { FREE_LIMITS } from "@/lib/premium";
import { isProUser } from "@/lib/pro-api";
import { progressFromSessions } from "@/lib/tattoo";
import type {
  Level,
  SessionStatus,
  TattooRecord,
  TattooReminder,
  TattooSession,
  TattooSource,
} from "@/lib/tattoo";

type TattooRow = {
  id: string;
  name: string;
  kind: string;
  body_location: string;
  size_key: string;
  width_cm: string;
  height_cm: string;
  colors: string;
  origin_guess: string;
  difficulty: number;
  sessions_low: number;
  sessions_high: number;
  session_cost_low: number;
  session_cost_high: number;
  intensity: string;
  complexity: string;
  color_level: string;
  size_level: string;
  why_text: string;
  factors_json: string;
  analysis_json: string;
  progress: number;
  journal_why: string;
  source: string;
  created_at: string;
  updated_at: string;
};

function parseArr(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function mapTattoo(r: TattooRow): TattooRecord {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    bodyLocation: r.body_location,
    sizeKey: r.size_key,
    widthCm: r.width_cm,
    heightCm: r.height_cm,
    colors: parseArr(r.colors),
    originGuess: r.origin_guess,
    difficulty: Number(r.difficulty) || 0,
    sessionsLow: r.sessions_low,
    sessionsHigh: r.sessions_high,
    sessionCostLow: r.session_cost_low,
    sessionCostHigh: r.session_cost_high,
    intensity: r.intensity as Level,
    complexity: r.complexity as Level,
    colorLevel: r.color_level as Level,
    sizeLevel: r.size_level as Level,
    whyText: r.why_text,
    factors: parseArr(r.factors_json),
    analysisJson: r.analysis_json,
    progress: r.progress,
    journalWhy: r.journal_why,
    source: (r.source as TattooSource) || "manual",
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function sanitizeTattoo(input: unknown): TattooRecord {
  const t = input as TattooRecord;
  if (!t?.id) throw new Error("Ungültiges Tattoo");
  return {
    id: String(t.id).slice(0, 80),
    name: String(t.name ?? "Tattoo").slice(0, 80),
    kind: String(t.kind ?? "tattoo").slice(0, 24),
    bodyLocation: String(t.bodyLocation ?? "").slice(0, 40),
    sizeKey: String(t.sizeKey ?? "").slice(0, 8),
    widthCm: String(t.widthCm ?? "").slice(0, 8),
    heightCm: String(t.heightCm ?? "").slice(0, 8),
    colors: (t.colors ?? []).map((c) => String(c).slice(0, 24)).slice(0, 8),
    originGuess: String(t.originGuess ?? "").slice(0, 24),
    difficulty: Number(t.difficulty) || 5,
    sessionsLow: Number(t.sessionsLow) || 4,
    sessionsHigh: Number(t.sessionsHigh) || 8,
    sessionCostLow: Number(t.sessionCostLow) || 120,
    sessionCostHigh: Number(t.sessionCostHigh) || 160,
    intensity: t.intensity === "low" || t.intensity === "high" ? t.intensity : "mid",
    complexity: t.complexity === "low" || t.complexity === "high" ? t.complexity : "mid",
    colorLevel: t.colorLevel === "low" || t.colorLevel === "high" ? t.colorLevel : "mid",
    sizeLevel: t.sizeLevel === "low" || t.sizeLevel === "high" ? t.sizeLevel : "mid",
    whyText: String(t.whyText ?? "").slice(0, 600),
    factors: (t.factors ?? []).map((f) => String(f).slice(0, 200)).slice(0, 10),
    analysisJson: String(t.analysisJson ?? "{}").slice(0, 4000),
    progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
    journalWhy: String(t.journalWhy ?? "").slice(0, 800),
    source: t.source === "scan" || t.source === "check" ? t.source : "manual",
    createdAt: String(t.createdAt ?? new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

async function syncProgress(
  sql: Awaited<ReturnType<typeof getSql>>,
  userId: string,
  tattooId: string,
  override?: number,
) {
  const doneRows = await sql<{ n: number }>`
    select count(*)::int as n from tattoo_sessions
    where tattoo_id = ${tattooId} and user_id = ${userId} and status = 'erledigt'
  `;
  const tattooRows = await sql<{ sessions_high: number }>`
    select sessions_high from tattoos where id = ${tattooId} and user_id = ${userId} limit 1
  `;
  const computed = progressFromSessions(doneRows[0]?.n ?? 0, Number(tattooRows[0]?.sessions_high) || 8);
  const progress = typeof override === "number" ? override : computed;
  await sql`
    update tattoos set progress = ${progress}, updated_at = now()
    where id = ${tattooId} and user_id = ${userId}
  `;
}

export const listTattoos = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<TattooRow>`
      select * from tattoos where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map(mapTattoo);
  });

export const getTattoo = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown): { id: string } => {
    const id = String((input as { id?: string })?.id ?? "");
    if (!id) throw new Error("Fehlende ID");
    return { id };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<TattooRow>`
      select * from tattoos where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapTattoo(rows[0]) : null;
  });

export const upsertTattoo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => sanitizeTattoo(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select id from tattoos where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!existing[0]) {
      const count = await sql<{ n: number }>`
        select count(*)::int as n from tattoos where user_id = ${context.userId}
      `;
      if ((count[0]?.n ?? 0) >= FREE_LIMITS.tattoos) {
        const pro = await isProUser(context.userId);
        if (!pro) {
          throw new Error(
            `Im kostenlosen Plan sind ${FREE_LIMITS.tattoos} Tattoos möglich. PRO hebt das Limit auf.`,
          );
        }
      }
    }
    await sql`
      insert into tattoos (
        id, user_id, name, kind, body_location, size_key, width_cm, height_cm, colors,
        origin_guess, difficulty, sessions_low, sessions_high, session_cost_low, session_cost_high,
        intensity, complexity, color_level, size_level, why_text, factors_json, analysis_json,
        progress, journal_why, source, created_at, updated_at
      ) values (
        ${data.id}, ${context.userId}, ${data.name}, ${data.kind}, ${data.bodyLocation},
        ${data.sizeKey}, ${data.widthCm}, ${data.heightCm}, ${JSON.stringify(data.colors)},
        ${data.originGuess}, ${data.difficulty}, ${data.sessionsLow}, ${data.sessionsHigh},
        ${data.sessionCostLow}, ${data.sessionCostHigh}, ${data.intensity}, ${data.complexity},
        ${data.colorLevel}, ${data.sizeLevel}, ${data.whyText}, ${JSON.stringify(data.factors)},
        ${data.analysisJson}, ${data.progress}, ${data.journalWhy}, ${data.source},
        ${data.createdAt}, ${data.updatedAt}
      )
      on conflict (id) do update set
        name = excluded.name,
        kind = excluded.kind,
        body_location = excluded.body_location,
        size_key = excluded.size_key,
        width_cm = excluded.width_cm,
        height_cm = excluded.height_cm,
        colors = excluded.colors,
        origin_guess = excluded.origin_guess,
        difficulty = excluded.difficulty,
        sessions_low = excluded.sessions_low,
        sessions_high = excluded.sessions_high,
        session_cost_low = excluded.session_cost_low,
        session_cost_high = excluded.session_cost_high,
        intensity = excluded.intensity,
        complexity = excluded.complexity,
        color_level = excluded.color_level,
        size_level = excluded.size_level,
        why_text = excluded.why_text,
        factors_json = excluded.factors_json,
        analysis_json = excluded.analysis_json,
        progress = excluded.progress,
        journal_why = excluded.journal_why,
        source = excluded.source,
        updated_at = excluded.updated_at
      where tattoos.user_id = ${context.userId}
    `;
    return { ok: true as const, id: data.id };
  });

export const deleteTattoo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { id: string } => ({
    id: String((input as { id?: string })?.id ?? ""),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from tattoo_sessions where tattoo_id = ${data.id} and user_id = ${context.userId}`;
    await sql`delete from tattoo_reminders where tattoo_id = ${data.id} and user_id = ${context.userId}`;
    await sql`delete from tattoos where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const listSessions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown): { tattooId: string } => ({
    tattooId: String((input as { tattooId?: string })?.tattooId ?? ""),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      tattoo_id: string;
      title: string;
      date: string;
      notes: string;
      cost_cents: number | null;
      studio: string;
      area: string;
      progress: number | null;
      status: string;
      created_at: string;
    }>`
      select * from tattoo_sessions
      where tattoo_id = ${data.tattooId} and user_id = ${context.userId}
      order by date asc, created_at asc
    `;
    return rows.map(
      (r): TattooSession => ({
        id: r.id,
        tattooId: r.tattoo_id,
        title: r.title,
        date: r.date,
        notes: r.notes,
        costCents: r.cost_cents ?? undefined,
        studio: r.studio,
        area: r.area,
        progress: r.progress ?? undefined,
        status: r.status as SessionStatus,
        createdAt: String(r.created_at),
      }),
    );
  });

export const upsertSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): TattooSession => {
    const s = input as TattooSession;
    if (!s?.id || !s.tattooId) throw new Error("Ungültige Sitzung");
    return {
      id: String(s.id).slice(0, 80),
      tattooId: String(s.tattooId).slice(0, 80),
      title: String(s.title ?? "Sitzung").slice(0, 80),
      date: String(s.date ?? "").slice(0, 32),
      notes: String(s.notes ?? "").slice(0, 600),
      costCents: typeof s.costCents === "number" ? s.costCents : undefined,
      studio: String(s.studio ?? "").slice(0, 80),
      area: String(s.area ?? "").slice(0, 80),
      progress: typeof s.progress === "number" ? Math.max(0, Math.min(100, s.progress)) : undefined,
      status: s.status === "erledigt" || s.status === "ausstehend" ? s.status : "geplant",
      createdAt: String(s.createdAt ?? new Date().toISOString()),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owner = await sql<{ id: string }>`
      select id from tattoos where id = ${data.tattooId} and user_id = ${context.userId} limit 1
    `;
    if (!owner[0]) throw new Error("Tattoo nicht gefunden");
    await sql`
      insert into tattoo_sessions (
        id, tattoo_id, user_id, title, date, notes, cost_cents, studio, area, progress, status, created_at
      ) values (
        ${data.id}, ${data.tattooId}, ${context.userId}, ${data.title}, ${data.date}, ${data.notes},
        ${data.costCents ?? null}, ${data.studio}, ${data.area}, ${data.progress ?? null},
        ${data.status}, ${data.createdAt}
      )
      on conflict (id) do update set
        title = excluded.title,
        date = excluded.date,
        notes = excluded.notes,
        cost_cents = excluded.cost_cents,
        studio = excluded.studio,
        area = excluded.area,
        progress = excluded.progress,
        status = excluded.status
      where tattoo_sessions.user_id = ${context.userId}
    `;
    await syncProgress(sql, context.userId, data.tattooId, data.progress);
    return { ok: true as const };
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { id: string } => ({
    id: String((input as { id?: string })?.id ?? ""),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const row = await sql<{ tattoo_id: string }>`
      select tattoo_id from tattoo_sessions where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    await sql`delete from tattoo_sessions where id = ${data.id} and user_id = ${context.userId}`;
    if (row[0]?.tattoo_id) {
      await syncProgress(sql, context.userId, row[0].tattoo_id);
    }
    return { ok: true as const };
  });

export const listReminders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      tattoo_id: string | null;
      title: string;
      due_date: string;
      kind: string;
      done: boolean;
      created_at: string;
    }>`
      select * from tattoo_reminders where user_id = ${context.userId}
      order by done asc, due_date asc
    `;
    return rows.map(
      (r): TattooReminder => ({
        id: r.id,
        tattooId: r.tattoo_id ?? undefined,
        title: r.title,
        dueDate: r.due_date,
        kind: r.kind,
        done: Boolean(r.done),
        createdAt: String(r.created_at),
      }),
    );
  });

export const upsertReminder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): TattooReminder => {
    const r = input as TattooReminder;
    if (!r?.id || !r.title) throw new Error("Ungültige Erinnerung");
    return {
      id: String(r.id).slice(0, 80),
      tattooId: r.tattooId ? String(r.tattooId).slice(0, 80) : undefined,
      title: String(r.title).slice(0, 120),
      dueDate: String(r.dueDate ?? "").slice(0, 32),
      kind: String(r.kind ?? "notiz").slice(0, 24),
      done: Boolean(r.done),
      createdAt: String(r.createdAt ?? new Date().toISOString()),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into tattoo_reminders (id, user_id, tattoo_id, title, due_date, kind, done, created_at)
      values (${data.id}, ${context.userId}, ${data.tattooId ?? null}, ${data.title}, ${data.dueDate}, ${data.kind}, ${data.done}, ${data.createdAt})
      on conflict (id) do update set
        title = excluded.title,
        due_date = excluded.due_date,
        kind = excluded.kind,
        done = excluded.done,
        tattoo_id = excluded.tattoo_id
      where tattoo_reminders.user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { id: string } => ({
    id: String((input as { id?: string })?.id ?? ""),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from tattoo_reminders where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });
