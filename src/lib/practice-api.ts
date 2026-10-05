import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { PRACTICE_SESSION_MS } from "@/lib/reauth";
import {
  decideAppointmentRead,
  decideAppointmentWrite,
  membershipCoversLocation,
  practiceAccessAllows,
  sessionActor,
  verifiedAccessUsable,
  type BoundaryRole,
  type VerifiedPracticeAccess,
} from "@/lib/server-boundary";

const CLINIC_EMAILS = [BRAND.email, "kontakt@endlich-ohne.de"].map((e) => e.toLowerCase());

function nid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function writeAudit(
  sql: Awaited<ReturnType<typeof sqlClient>>,
  event: { actor: string; action: string; locationId?: string | null; targetId?: string | null },
) {
  await sql`
    insert into practice_audit (id, actor_user_id, action, location_id, target_id)
    values (
      ${nid("aud")}, ${event.actor}, ${event.action},
      ${event.locationId ?? null}, ${event.targetId ?? null}
    )
  `;
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "";
  return `${name.slice(0, 1)}***@${domain}`;
}

async function guard() {
  return import("./practice-guard");
}

async function sqlClient() {
  return getSql();
}

async function callerEmail(userId: string) {
  const sql = await sqlClient();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId} limit 1`;
  return (rows[0]?.email ?? "").trim().toLowerCase();
}

async function ensureKarlsruhe() {
  const sql = await sqlClient();
  await sql`
    insert into practice_locations (id, slug, name, city, active)
    values ('loc-karlsruhe', 'karlsruhe', ${BRAND.praxis}, 'Karlsruhe', true)
    on conflict (id) do nothing
  `;
}

async function failureCount(userId: string) {
  const { CODE_WINDOW_MS } = await guard();
  const sql = await sqlClient();
  const since = new Date(Date.now() - CODE_WINDOW_MS).toISOString();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from practice_code_attempts
    where user_id = ${userId} and ok = false and created_at > ${since}
  `;
  return Number(rows[0]?.n ?? 0);
}

async function noteAttempt(userId: string, ok: boolean) {
  const sql = await sqlClient();
  await sql`
    insert into practice_code_attempts (id, user_id, ok)
    values (${nid("att")}, ${userId}, ${ok})
  `;
}

async function cookieSecure() {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    return (getRequest()?.url ?? "").startsWith("https:");
  } catch {
    return true;
  }
}

async function writeSessionCookie(value: string, maxAge: number) {
  const { PRACTICE_COOKIE } = await guard();
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(PRACTICE_COOKIE, value, {
    path: "/",
    httpOnly: true,
    secure: await cookieSecure(),
    sameSite: "lax",
    maxAge,
  });
}

async function clearSessionCookie() {
  await writeSessionCookie("", 0);
}

type LiveSession = {
  id: string;
  userId: string;
  membershipId: string;
  locationId: string;
  role: "admin" | "doctor" | "staff";
  mustRotate: boolean;
  locationName: string;
  locationCity: string;
  verified: VerifiedPracticeAccess;
};

async function loadCookieSession(userId: string): Promise<LiveSession | null> {
  const g = await guard();
  let cookie = "";
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    cookie = getCookie(g.PRACTICE_COOKIE) ?? "";
  } catch {
    return null;
  }
  if (!/^[a-f0-9]{64}$/.test(cookie)) return null;
  const sql = await sqlClient();
  const rows = await sql<{
    id: string;
    user_id: string;
    membership_id: string;
    location_id: string;
    code_version: number;
    expires_at: string;
    revoked_at: string | null;
    role: string;
    member_active: boolean;
    must_rotate: boolean;
    member_version: number;
    location_active: boolean;
    location_name: string;
    location_city: string;
  }>`
    select s.id, s.user_id, s.membership_id, s.location_id, s.code_version,
           s.expires_at, s.revoked_at, m.role, m.active as member_active,
           m.must_rotate, m.code_version as member_version,
           l.active as location_active, l.name as location_name, l.city as location_city
    from practice_sessions s
    join practice_memberships m on m.id = s.membership_id
    join practice_locations l on l.id = s.location_id
    where s.id = ${cookie}
    limit 1
  `;
  const row = rows[0];
  if (!row || row.user_id !== userId || !g.isPracticeRole(row.role)) return null;
  const verified: VerifiedPracticeAccess = {
    userId: row.user_id,
    membershipId: row.membership_id,
    locationId: row.location_id,
    role: row.role,
    membershipActive: row.member_active,
    locationActive: row.location_active,
    mustRotate: row.must_rotate,
    revoked: Boolean(row.revoked_at),
    expired: new Date(row.expires_at).getTime() <= Date.now(),
    sessionCodeVersion: Number(row.code_version),
    membershipCodeVersion: Number(row.member_version),
  };
  if (!verifiedAccessUsable(verified)) return null;
  return {
    id: row.id,
    userId: verified.userId,
    membershipId: verified.membershipId,
    locationId: verified.locationId,
    role: verified.role,
    mustRotate: false,
    locationName: row.location_name,
    locationCity: row.location_city,
    verified,
  };
}

async function openPreferredPracticeSession(userId: string) {
  const sql = await sqlClient();
  const rows = await sql<{ id: string }>`
    select m.id
    from practice_memberships m
    join practice_locations l on l.id = m.location_id
    where m.user_id = ${userId} and m.active = true and l.active = true
    order by m.last_used_at desc nulls last, m.created_at asc
    limit 1
  `;
  if (!rows[0]) return;
  await sql`
    update practice_memberships set last_used_at = now()
    where id = ${rows[0].id} and user_id = ${userId}
  `;
  await openSession(userId, rows[0].id);
}

export async function onAccountSessionCreated(session: { id: string; userId: string }) {
  const sql = await sqlClient();
  await sql`
    update "session" set "lastAuthenticatedAt" = now() where "id" = ${session.id}
  `;
  try {
    await openPreferredPracticeSession(session.userId);
  } catch (err) {
    console.error("practice session was not opened", err instanceof Error ? err.name : "error");
  }
}

async function loadSession(userId: string): Promise<LiveSession | null> {
  return loadCookieSession(userId);
}

async function openSession(userId: string, membershipId: string) {
  const sql = await sqlClient();
  const rows = await sql<{
    id: string;
    location_id: string;
    code_version: number;
    active: boolean;
    location_active: boolean;
  }>`
    select m.id, m.location_id, m.code_version, m.active, l.active as location_active
    from practice_memberships m
    join practice_locations l on l.id = m.location_id
    where m.id = ${membershipId} and m.user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row || !row.active || !row.location_active) throw new Error("Nicht erlaubt.");
  const id = (await import("node:crypto")).randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PRACTICE_SESSION_MS).toISOString();
  await sql`
    insert into practice_sessions (
      id, user_id, membership_id, location_id, code_version, expires_at
    ) values (
      ${id}, ${userId}, ${row.id}, ${row.location_id}, ${row.code_version}, ${expires}
    )
  `;
  await writeSessionCookie(id, Math.floor(PRACTICE_SESSION_MS / 1000));
}

async function requirePracticeAccess(userId: string, allowedRoles: BoundaryRole[]) {
  const session = await loadSession(userId);
  if (!session || !practiceAccessAllows(session.verified, allowedRoles)) {
    throw new Error("Nicht gefunden.");
  }
  return session;
}

async function requireAdmin(userId: string) {
  return requirePracticeAccess(userId, ["admin"]);
}

export const getPracticeHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureKarlsruhe();
    const sql = await sqlClient();
    const session = await loadSession(context.userId);
    const email = await callerEmail(context.userId);
    const pending = await sql<{ location_id: string }>`
      select location_id from practice_memberships
      where user_id = ${context.userId} and must_rotate = true and active = true
      limit 1
    `;
    const own = await sql<{
      id: string;
      starts_at: string;
      status: string;
      note: string;
      city: string;
    }>`
      select a.id, a.starts_at, a.status, a.note, l.city
      from practice_appointments a
      join practice_locations l on l.id = a.location_id
      where a.customer_user_id = ${context.userId}
      order by a.starts_at asc
      limit 20
    `;
    let staffAppointments: {
      id: string;
      startsAt: string;
      status: string;
      note: string;
      emailMasked: string;
    }[] = [];
    let members: { id: string; role: string; active: boolean; emailMasked: string }[] = [];
    if (session && practiceAccessAllows(session.verified, ["admin", "doctor", "staff"])) {
      const arows = await sql<{
        id: string;
        starts_at: string;
        status: string;
        note: string;
        email: string | null;
      }>`
        select a.id, a.starts_at, a.status, a.note, u.email
        from practice_appointments a
        left join "user" u on u.id = a.customer_user_id
        where a.location_id = ${session.locationId}
        order by a.starts_at asc
        limit 40
      `;
      staffAppointments = arows.map((r) => ({
        id: r.id,
        startsAt: r.starts_at,
        status: r.status,
        note: r.note,
        emailMasked: maskEmail(r.email ?? ""),
      }));
      if (session.role === "admin") {
        const mrows = await sql<{
          id: string;
          role: string;
          active: boolean;
          email: string | null;
        }>`
          select m.id, m.role, m.active, u.email
          from practice_memberships m
          left join "user" u on u.id = m.user_id
          where m.location_id = ${session.locationId}
          order by m.created_at asc
        `;
        members = mrows.map((r) => ({
          id: r.id,
          role: r.role,
          active: r.active,
          emailMasked: maskEmail(r.email ?? ""),
        }));
      }
    }
    const locations = session?.role === "admin"
      ? await sql<{ id: string; city: string; active: boolean }>`
          select id, city, active from practice_locations order by city asc
        `
      : [];
    return {
      clinicEmail: CLINIC_EMAILS.includes(email),
      mustRotate: false,
      rotateLocationId: pending[0]?.location_id ?? null,
      session: session
        ? {
            role: session.role,
            locationId: session.locationId,
            locationName: session.locationName,
            locationCity: session.locationCity,
          }
        : null,
      ownAppointments: own.map((r) => ({
        id: r.id,
        startsAt: r.starts_at,
        status: r.status,
        note: r.note,
        city: r.city,
      })),
      staffAppointments,
      members,
      locations,
    };
  });

export const bootstrapClinicAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureKarlsruhe();
    const email = await callerEmail(context.userId);
    if (!CLINIC_EMAILS.includes(email)) throw new Error("Nicht erlaubt.");
    const sql = await sqlClient();
    const admins = await sql<{ n: number }>`
      select count(*)::int as n from practice_memberships
      where role = 'admin' and active = true
    `;
    if (Number(admins[0]?.n ?? 0) > 0) throw new Error("Nicht erlaubt.");
    const existing = await sql<{ id: string }>`
      select id from practice_memberships
      where user_id = ${context.userId} and location_id = 'loc-karlsruhe'
      limit 1
    `;
    const id = existing[0]?.id ?? nid("mem");
    if (!existing[0]) {
      await sql`
        insert into practice_memberships (
          id, user_id, location_id, role, active, must_rotate, code_version
        ) values (
          ${id}, ${context.userId}, 'loc-karlsruhe', 'admin', true, false, 1
        )
      `;
    } else {
      await sql`
        update practice_memberships
        set role = 'admin', active = true
        where id = ${id} and user_id = ${context.userId}
      `;
    }
    await openSession(context.userId, id);
    await writeAudit(sql, {
      actor: context.userId,
      action: "admin_bootstrap",
      locationId: "loc-karlsruhe",
      targetId: id,
    });
    return { ok: true as const };
  });

export const redeemPracticeCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const code =
      typeof input === "object" && input && "code" in input
        ? String((input as { code: unknown }).code ?? "")
        : "";
    const trimmed = code.trim();
    if (trimmed.length < 8 || trimmed.length > 64) throw new Error("Code ungültig oder gesperrt.");
    return { code: trimmed };
  })
  .handler(async ({ context, data }) => {
    await ensureKarlsruhe();
    const g = await guard();
    if (!g.rateLimitAllows(await failureCount(context.userId))) {
      throw new Error("Code ungültig oder gesperrt.");
    }
    const sql = await sqlClient();
    const personal = await sql<{
      id: string;
      personal_salt: string | null;
      personal_hash: string | null;
      must_rotate: boolean;
      active: boolean;
    }>`
      select id, personal_salt, personal_hash, must_rotate, active
      from practice_memberships
      where user_id = ${context.userId}
    `;
    for (const row of personal) {
      if (!row.active || row.must_rotate || !row.personal_salt || !row.personal_hash) continue;
      if (g.verifyPracticeCode(data.code, row.personal_salt, row.personal_hash)) {
        await noteAttempt(context.userId, true);
        await openSession(context.userId, row.id);
        return { ok: true as const, mustRotate: false as const };
      }
    }
    const codes = await sql<{
      id: string;
      location_id: string;
      role: string;
      salt: string;
      code_hash: string;
    }>`
      select id, location_id, role, salt, code_hash
      from practice_codes
      where active = true and used_at is null
    `;
    const match = codes.find(
      (row) => g.isPracticeRole(row.role) && g.verifyPracticeCode(data.code, row.salt, row.code_hash),
    );
    if (!match) {
      await noteAttempt(context.userId, false);
      throw new Error("Code ungültig oder gesperrt.");
    }
    await noteAttempt(context.userId, true);
    const existing = await sql<{ id: string; must_rotate: boolean; active: boolean }>`
      select id, must_rotate, active from practice_memberships
      where user_id = ${context.userId} and location_id = ${match.location_id}
      limit 1
    `;
    if (existing[0] && (!existing[0].active || !existing[0].must_rotate)) {
      throw new Error("Code ungültig oder gesperrt.");
    }
    if (!existing[0]) {
      await sql`
        insert into practice_memberships (
          id, user_id, location_id, role, active, must_rotate, code_version
        ) values (
          ${nid("mem")}, ${context.userId}, ${match.location_id}, ${match.role}, true, true, 1
        )
      `;
    }
    await sql`
      update practice_codes
      set active = false, used_at = now()
      where id = ${match.id} and used_at is null
    `;
    return { ok: true as const, mustRotate: true as const, locationId: match.location_id };
  });

export const rotatePracticeCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { locationId?: unknown; nextCode?: unknown };
    const locationId = String(i.locationId ?? "").slice(0, 80);
    const nextCode = String(i.nextCode ?? "").trim();
    if (!locationId || nextCode.length < 10 || nextCode.length > 64) {
      throw new Error("Bitte einen neuen Code mit mindestens 10 Zeichen setzen.");
    }
    return { locationId, nextCode };
  })
  .handler(async ({ context, data }) => {
    const g = await guard();
    const sql = await sqlClient();
    const rows = await sql<{ id: string; code_version: number }>`
      select id, code_version from practice_memberships
      where user_id = ${context.userId}
        and location_id = ${data.locationId}
        and active = true
        and must_rotate = true
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Nicht erlaubt.");
    const { salt, hash } = g.hashPracticeCode(data.nextCode);
    const version = Number(row.code_version) + 1;
    await sql`
      update practice_memberships
      set must_rotate = false,
          personal_salt = ${salt},
          personal_hash = ${hash},
          code_version = ${version}
      where id = ${row.id} and user_id = ${context.userId}
    `;
    await sql`
      update practice_sessions
      set revoked_at = now()
      where membership_id = ${row.id} and revoked_at is null
    `;
    await openSession(context.userId, row.id);
    await writeAudit(sql, {
      actor: context.userId,
      action: "code_rotated",
      locationId: data.locationId,
      targetId: row.id,
    });
    return { ok: true as const };
  });

export const issuePracticeCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const role =
      typeof input === "object" && input && "role" in input
        ? String((input as { role: unknown }).role ?? "")
        : "";
    if (role !== "admin" && role !== "doctor" && role !== "staff") {
      throw new Error("Nicht erlaubt.");
    }
    return { role: role as "admin" | "doctor" | "staff" };
  })
  .handler(async ({ context, data }) => {
    const session = await requireAdmin(context.userId);
    const g = await guard();
    const code = g.generatePracticeCode();
    const { salt, hash } = g.hashPracticeCode(code);
    const sql = await sqlClient();
    await sql`
      insert into practice_codes (
        id, location_id, role, code_hash, salt, active, created_by
      ) values (
        ${nid("code")}, ${session.locationId}, ${data.role}, ${hash}, ${salt}, true, ${context.userId}
      )
    `;
    await writeAudit(sql, {
      actor: context.userId,
      action: "code_issued",
      locationId: session.locationId,
    });
    return { ok: true as const, code };
  });

export const setMemberActive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { memberId?: unknown; active?: unknown };
    const memberId = String(i.memberId ?? "").slice(0, 80);
    if (!memberId || typeof i.active !== "boolean") throw new Error("Nicht erlaubt.");
    return { memberId, active: i.active };
  })
  .handler(async ({ context, data }) => {
    const session = await requireAdmin(context.userId);
    const g = await guard();
    const sql = await sqlClient();
    const rows = await sql<{ id: string; role: string; active: boolean; location_id: string }>`
      select id, role, active, location_id from practice_memberships
      where id = ${data.memberId}
      limit 1
    `;
    const member = rows[0];
    if (
      !member ||
      !g.canManageMember({
        actorRole: session.role,
        actorLocationId: session.locationId,
        memberLocationId: member.location_id,
      })
    ) {
      throw new Error("Nicht gefunden.");
    }
    const changed = await sql<{ id: string }>`
      with locked_admins as (
        select id from practice_memberships
        where location_id = ${session.locationId} and role = 'admin' and active = true
        for update
      ),
      changed as (
        update practice_memberships m
        set active = ${data.active}
        where m.id = ${member.id}
          and m.location_id = ${session.locationId}
          and (
            ${data.active} = true
            or m.role <> 'admin'
            or (select count(*) from locked_admins) > 1
          )
        returning m.id
      ),
      revoked as (
        update practice_sessions
        set revoked_at = now()
        where membership_id in (select id from changed)
          and ${data.active} = false
          and revoked_at is null
        returning id
      )
      select id from changed
    `;
    if (!changed[0]) {
      throw new Error("Der letzte aktive Admin kann nicht deaktiviert werden.");
    }
    await writeAudit(sql, {
      actor: context.userId,
      action: data.active ? "membership_activated" : "membership_deactivated",
      locationId: session.locationId,
      targetId: member.id,
    });
    return { ok: true as const };
  });

export const addPracticeLocation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { city?: unknown; name?: unknown };
    const city = String(i.city ?? "").trim().slice(0, 80);
    const name = String(i.name ?? "").trim().slice(0, 120);
    if (city.length < 2 || name.length < 2) throw new Error("Standort unvollständig.");
    return { city, name };
  })
  .handler(async ({ context, data }) => {
    const session = await requireAdmin(context.userId);
    const slug = data.city
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    if (!slug) throw new Error("Standort unvollständig.");
    const sql = await sqlClient();
    const id = nid("loc");
    await sql`
      insert into practice_locations (id, slug, name, city, active)
      values (${id}, ${slug}, ${data.name}, ${data.city}, true)
    `;
    const memberId = nid("mem");
    await sql`
      insert into practice_memberships (
        id, user_id, location_id, role, active, must_rotate, code_version
      ) values (
        ${memberId}, ${context.userId}, ${id}, 'admin', true, false, 1
      )
    `;
    return { ok: true as const, locationId: id, keptSessionAt: session.locationId };
  });

export const addPracticeMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { email?: unknown; role?: unknown };
    const email = String(i.email ?? "").trim().toLowerCase().slice(0, 120);
    const role = String(i.role ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Nicht möglich.");
    if (role !== "admin" && role !== "doctor" && role !== "staff") throw new Error("Nicht möglich.");
    return { email, role: role as "admin" | "doctor" | "staff" };
  })
  .handler(async ({ context, data }) => {
    const session = await requireAdmin(context.userId);
    const g = await guard();
    const sql = await sqlClient();
    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${data.email} limit 1
    `;
    if (!users[0]) throw new Error("Nicht möglich.");
    const existing = await sql<{ id: string }>`
      select id from practice_memberships
      where user_id = ${users[0].id} and location_id = ${session.locationId}
      limit 1
    `;
    if (existing[0]) throw new Error("Nicht möglich.");
    const memberId = nid("mem");
    const code = g.generatePracticeCode();
    const { salt, hash } = g.hashPracticeCode(code);
    await sql`
      insert into practice_memberships (
        id, user_id, location_id, role, active, must_rotate, code_version
      ) values (
        ${memberId}, ${users[0].id}, ${session.locationId}, ${data.role}, true, true, 1
      )
    `;
    await sql`
      insert into practice_codes (
        id, location_id, role, code_hash, salt, active, created_by
      ) values (
        ${nid("code")}, ${session.locationId}, ${data.role}, ${hash}, ${salt}, true, ${context.userId}
      )
    `;
    await writeAudit(sql, {
      actor: context.userId,
      action: "membership_created",
      locationId: session.locationId,
      targetId: memberId,
    });
    return { ok: true as const, code };
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { memberId?: unknown; role?: unknown };
    const memberId = String(i.memberId ?? "").slice(0, 80);
    const role = String(i.role ?? "");
    if (!memberId || (role !== "admin" && role !== "doctor" && role !== "staff")) {
      throw new Error("Nicht gefunden.");
    }
    return { memberId, role: role as "admin" | "doctor" | "staff" };
  })
  .handler(async ({ context, data }) => {
    const session = await requireAdmin(context.userId);
    const sql = await sqlClient();
    const changed = await sql<{ id: string }>`
      with locked_admins as (
        select id from practice_memberships
        where location_id = ${session.locationId} and role = 'admin' and active = true
        for update
      )
      update practice_memberships m
      set role = ${data.role}
      where m.id = ${data.memberId}
        and m.location_id = ${session.locationId}
        and (
          m.role <> 'admin'
          or ${data.role} = 'admin'
          or m.active = false
          or (select count(*) from locked_admins) > 1
        )
      returning m.id
    `;
    if (!changed[0]) throw new Error("Der letzte aktive Admin kann nicht geändert werden.");
    await writeAudit(sql, {
      actor: context.userId,
      action: "role_changed",
      locationId: session.locationId,
      targetId: data.memberId,
    });
    return { ok: true as const };
  });

export const resetMemberCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const memberId =
      typeof input === "object" && input && "memberId" in input
        ? String((input as { memberId: unknown }).memberId ?? "").slice(0, 80)
        : "";
    if (!memberId) throw new Error("Nicht gefunden.");
    return { memberId };
  })
  .handler(async ({ context, data }) => {
    const session = await requireAdmin(context.userId);
    const g = await guard();
    const sql = await sqlClient();
    const rows = await sql<{ id: string; role: string; code_version: number }>`
      select id, role, code_version from practice_memberships
      where id = ${data.memberId} and location_id = ${session.locationId}
      limit 1
    `;
    const member = rows[0];
    if (!member || !g.isPracticeRole(member.role)) throw new Error("Nicht gefunden.");
    const code = g.generatePracticeCode();
    const { salt, hash } = g.hashPracticeCode(code);
    const version = Number(member.code_version) + 1;
    await sql`
      update practice_memberships
      set must_rotate = true,
          personal_salt = null,
          personal_hash = null,
          code_version = ${version}
      where id = ${member.id} and location_id = ${session.locationId}
    `;
    await sql`
      update practice_sessions set revoked_at = now()
      where membership_id = ${member.id} and revoked_at is null
    `;
    await sql`
      insert into practice_codes (
        id, location_id, role, code_hash, salt, active, created_by
      ) values (
        ${nid("code")}, ${session.locationId}, ${member.role}, ${hash}, ${salt}, true, ${context.userId}
      )
    `;
    await writeAudit(sql, {
      actor: context.userId,
      action: "code_reset",
      locationId: session.locationId,
      targetId: member.id,
    });
    return { ok: true as const, code };
  });

export const setLocationActive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { locationId?: unknown; active?: unknown };
    const locationId = String(i.locationId ?? "").slice(0, 80);
    if (!locationId || typeof i.active !== "boolean") throw new Error("Nicht erlaubt.");
    return { locationId, active: i.active };
  })
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await sqlClient();
    const mine = await sql<{
      id: string;
      user_id: string;
      location_id: string;
      role: string;
      active: boolean;
      location_active: boolean;
    }>`
      select m.id, m.user_id, m.location_id, m.role, m.active, l.active as location_active
      from practice_memberships m
      join practice_locations l on l.id = m.location_id
      where m.user_id = ${context.userId}
        and m.location_id = ${data.locationId}
      limit 1
    `;
    const g = await guard();
    const member = mine[0];
    if (
      !member ||
      !g.isPracticeRole(member.role) ||
      !membershipCoversLocation({
        membershipUserId: member.user_id,
        actorUserId: context.userId,
        membershipLocationId: member.location_id,
        requestedLocationId: data.locationId,
        membershipActive: member.active,
        locationActive: member.location_active,
        membershipRole: member.role,
        allowedRoles: ["admin"],
      })
    ) {
      throw new Error("Nicht gefunden.");
    }
    const loc = await sql<{ active: boolean }>`
      select active from practice_locations where id = ${data.locationId} limit 1
    `;
    if (!loc[0]) throw new Error("Nicht gefunden.");
    const changed = await sql<{ id: string }>`
      with locked as (
        select id from practice_locations where active = true for update
      ),
      changed as (
        update practice_locations
        set active = ${data.active}
        where id = ${data.locationId}
          and (
            ${data.active} = true
            or (select count(*) from locked) > 1
          )
        returning id
      ),
      revoked as (
        update practice_sessions
        set revoked_at = now()
        where location_id in (select id from changed)
          and ${data.active} = false
          and revoked_at is null
        returning id
      )
      select id from changed
    `;
    if (!changed[0]) {
      throw new Error("Der letzte aktive Standort kann nicht deaktiviert werden.");
    }
    await writeAudit(sql, {
      actor: context.userId,
      action: data.active ? "location_activated" : "location_deactivated",
      locationId: data.locationId,
    });
    return { ok: true as const };
  });

export const switchPracticeLocation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const locationId =
      typeof input === "object" && input && "locationId" in input
        ? String((input as { locationId: unknown }).locationId ?? "").slice(0, 80)
        : "";
    if (!locationId) throw new Error("Nicht gefunden.");
    return { locationId };
  })
  .handler(async ({ context, data }) => {
    const sql = await sqlClient();
    const rows = await sql<{
      id: string;
      user_id: string;
      location_id: string;
      role: string;
      active: boolean;
      location_active: boolean;
    }>`
      select m.id, m.user_id, m.location_id, m.role, m.active, l.active as location_active
      from practice_memberships m
      join practice_locations l on l.id = m.location_id
      where m.user_id = ${context.userId}
        and m.location_id = ${data.locationId}
        and m.must_rotate = false
      limit 1
    `;
    const g = await guard();
    const member = rows[0];
    if (
      !member ||
      !g.isPracticeRole(member.role) ||
      !membershipCoversLocation({
        membershipUserId: member.user_id,
        actorUserId: context.userId,
        membershipLocationId: member.location_id,
        requestedLocationId: data.locationId,
        membershipActive: member.active,
        locationActive: member.location_active,
        membershipRole: member.role,
        allowedRoles: ["admin", "doctor", "staff"],
      })
    ) {
      throw new Error("Nicht gefunden.");
    }
    const current = await loadSession(context.userId);
    if (current) {
      await sql`
        update practice_sessions set revoked_at = now()
        where id = ${current.id} and revoked_at is null
      `;
    }
    await sql`
      update practice_memberships set last_used_at = now()
      where id = ${member.id} and user_id = ${context.userId}
    `;
    await openSession(context.userId, member.id);
    return { ok: true as const };
  });

export const savePracticeAppointment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { email?: unknown; startsAt?: unknown; note?: unknown };
    const email = String(i.email ?? "").trim().toLowerCase().slice(0, 120);
    const startsAt = String(i.startsAt ?? "").slice(0, 40);
    const note = String(i.note ?? "").slice(0, 280);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || startsAt.length < 8) {
      throw new Error("Kunde nicht zuordenbar.");
    }
    return { email, startsAt, note };
  })
  .handler(async ({ context, data }) => {
    const session = await requirePracticeAccess(context.userId, ["admin", "doctor", "staff"]);
    if (
      !decideAppointmentWrite({
        verified: session.verified,
        appointmentLocationId: session.verified.locationId,
        request: data,
      })
    ) {
      throw new Error("Nicht gefunden.");
    }
    const sql = await sqlClient();
    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${data.email} limit 1
    `;
    if (!users[0]) throw new Error("Kunde nicht zuordenbar.");
    await sql`
      insert into practice_appointments (
        id, location_id, customer_user_id, created_by, starts_at, status, note
      ) values (
        ${nid("apt")}, ${session.locationId}, ${users[0].id}, ${context.userId},
        ${data.startsAt}, 'planned', ${data.note}
      )
    `;
    return { ok: true as const };
  });

export const setPracticeAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const i = input as { id?: unknown; status?: unknown };
    const id = String(i.id ?? "").slice(0, 80);
    const status = String(i.status ?? "");
    if (!id || !["planned", "confirmed", "cancelled", "completed"].includes(status)) {
      throw new Error("Nicht gefunden.");
    }
    return { id, status };
  })
  .handler(async ({ context, data }) => {
    const session = await requirePracticeAccess(context.userId, ["admin", "doctor", "staff"]);
    const sql = await sqlClient();
    const rows = await sql<{ location_id: string }>`
      select location_id from practice_appointments where id = ${data.id} limit 1
    `;
    if (
      !rows[0] ||
      !decideAppointmentWrite({
        verified: session.verified,
        appointmentLocationId: rows[0].location_id,
        request: data,
      })
    ) {
      throw new Error("Nicht gefunden.");
    }
    await sql`
      update practice_appointments set status = ${data.status}
      where id = ${data.id} and location_id = ${session.verified.locationId}
    `;
    return { ok: true as const };
  });

export const getPracticeAppointment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const id =
      typeof input === "object" && input && "id" in input
        ? String((input as { id: unknown }).id ?? "").slice(0, 80)
        : "";
    if (!id) throw new Error("Nicht gefunden.");
    return {
      id,
      claimedUserId: (input as { userId?: unknown }).userId,
      claimedRole: (input as { role?: unknown }).role,
      claimedLocationId: (input as { locationId?: unknown }).locationId,
      claimedMemberId: (input as { memberId?: unknown }).memberId,
    };
  })
  .handler(async ({ context, data }) => {
    const actor = sessionActor(context.userId, { userId: data.claimedUserId, role: data.claimedRole });
    const session = await loadSession(actor.userId);
    const sql = await sqlClient();
    const rows = await sql<{
      id: string;
      starts_at: string;
      status: string;
      note: string;
      location_id: string;
      customer_user_id: string;
    }>`
      select id, starts_at, status, note, location_id, customer_user_id
      from practice_appointments
      where id = ${data.id}
      limit 1
    `;
    const row = rows[0];
    if (
      !row ||
      !decideAppointmentRead({
        authenticatedUserId: actor.userId,
        verified: session?.verified ?? null,
        appointment: { customerUserId: row.customer_user_id, locationId: row.location_id },
        request: {
          userId: data.claimedUserId,
          role: data.claimedRole,
          locationId: data.claimedLocationId,
          memberId: data.claimedMemberId,
        },
      })
    ) {
      throw new Error("Nicht gefunden.");
    }
    return {
      id: row.id,
      startsAt: row.starts_at,
      status: row.status,
      note: row.note,
      locationId: row.location_id,
    };
  });

export const endPracticeSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const session = await loadSession(context.userId);
    if (session) {
      const sql = await sqlClient();
      await sql`
        update practice_sessions set revoked_at = now()
        where id = ${session.id} and revoked_at is null
      `;
    }
    await clearSessionCookie();
    return { ok: true as const };
  });
