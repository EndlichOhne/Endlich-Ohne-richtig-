import { createHash, randomInt } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { emailRejectReason, normalizeEmail } from "@/lib/email";
import { confirmMailBody, mailerReady, sendAppEmail } from "@/lib/mailer";
import { maskEmail } from "@/lib/payments";

const TTL_MS = 15 * 60_000;

async function assertDeliverableEmail(value: string): Promise<string> {
  const email = normalizeEmail(value);
  const reason = emailRejectReason(email);
  if (reason) throw new Error(reason);
  const domain = email.split("@")[1] ?? "";
  const { resolveMx, resolve4 } = await import("node:dns/promises");
  const timed = async <T>(p: Promise<T>) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        p,
        new Promise<T>((_, rej) => {
          timer = setTimeout(() => rej(new Error("timeout")), 3500);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
  try {
    const mx = await timed(resolveMx(domain));
    if (Array.isArray(mx) && mx.length > 0) return email;
  } catch {
    /* try A */
  }
  try {
    const a = await timed(resolve4(domain));
    if (Array.isArray(a) && a.length > 0) return email;
  } catch {
    /* no dns */
  }
  throw new Error("Diese Adresse scheint nicht erreichbar. Bitte eine echte E-Mail nutzen.");
}

function hashCode(userId: string, code: string) {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

function sixDigits() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function userRow(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    email: string;
    emailVerified: boolean;
  }>`select email, "emailVerified" as "emailVerified" from "user" where id = ${userId}`;
  return rows[0] ?? null;
}

async function isOauth(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ providerId: string }>`
    select "providerId" as "providerId" from account where "userId" = ${userId}
  `;
  return rows.some((r) => r.providerId && r.providerId !== "credential");
}

export const inspectEmail = createServerFn({ method: "POST" })
  .validator((input: unknown): { email: string } => {
    const email = normalizeEmail(String((input as { email?: string })?.email ?? ""));
    return { email };
  })
  .handler(async ({ data }) => {
    const reason = emailRejectReason(data.email);
    if (reason) return { ok: false as const, error: reason };
    try {
      const email = await assertDeliverableEmail(data.email);
      return { ok: true as const, email };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "E-Mail nicht prüfbar.",
      };
    }
  });

export const getEmailStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await userRow(context.userId);
    if (!row) return { verified: false, emailMasked: null as string | null, oauth: false };
    if (row.emailVerified) {
      return { verified: true, emailMasked: maskEmail(row.email) ?? null, oauth: false };
    }
    const oauth = await isOauth(context.userId);
    if (oauth) {
      const sql = await getSql();
      await sql`update "user" set "emailVerified" = true, "updatedAt" = now() where id = ${context.userId}`;
      return { verified: true, emailMasked: maskEmail(row.email) ?? null, oauth: true };
    }
    return {
      verified: false,
      emailMasked: maskEmail(row.email) ?? null,
      oauth: false,
    };
  });

export const startEmailVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await userRow(context.userId);
    if (!row) throw new Error("Konto nicht gefunden.");
    if (row.emailVerified || (await isOauth(context.userId))) {
      return { ok: true as const, sent: false, already: true as const, emailMasked: maskEmail(row.email) };
    }
    const sql = await getSql();
    const existing = await sql<{ sent_at: string | null }>`
      select sent_at from email_confirms where user_id = ${context.userId}
    `;
    const last = existing[0]?.sent_at ? new Date(existing[0].sent_at).getTime() : 0;
    if (last && Date.now() - last < 45_000) {
      return {
        ok: true as const,
        sent: false,
        wait: true as const,
        emailMasked: maskEmail(row.email),
        previewCode: undefined as string | undefined,
      };
    }
    const code = sixDigits();
    const hash = hashCode(context.userId, code);
    const expires = new Date(Date.now() + TTL_MS).toISOString();
    await sql`
      insert into email_confirms (user_id, email, code_hash, attempts, sent_at, expires_at, updated_at)
      values (${context.userId}, ${row.email}, ${hash}, 0, now(), ${expires}, now())
      on conflict (user_id) do update set
        email = excluded.email,
        code_hash = excluded.code_hash,
        attempts = 0,
        sent_at = now(),
        expires_at = excluded.expires_at,
        verified_at = null,
        updated_at = now()
    `;
    const mail = await sendAppEmail({
      to: row.email,
      subject: `Bestätigungscode · ENDLICH OHNE`,
      text: confirmMailBody(code),
    });
    return {
      ok: true as const,
      sent: mail.ok,
      already: false as const,
      emailMasked: maskEmail(row.email),
      previewCode: mail.ok || mailerReady() ? undefined : code,
    };
  });

export const confirmEmailCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown): { code: string } => {
    const code = String((input as { code?: string })?.code ?? "").replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Bitte den 6-stelligen Code eingeben.");
    return { code };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      code_hash: string;
      attempts: number;
      expires_at: string;
    }>`
      select code_hash, attempts, expires_at from email_confirms where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "Bitte zuerst einen Code anfordern." };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "Code abgelaufen. Bitte neu anfordern." };
    }
    if (row.attempts >= 8) {
      return { ok: false as const, error: "Zu viele Versuche. Bitte neuen Code anfordern." };
    }
    const hash = hashCode(context.userId, data.code);
    if (hash !== row.code_hash) {
      await sql`
        update email_confirms set attempts = attempts + 1, updated_at = now()
        where user_id = ${context.userId}
      `;
      return { ok: false as const, error: "Code stimmt nicht. Bitte prüfen." };
    }
    await sql`
      update email_confirms set verified_at = now(), updated_at = now()
      where user_id = ${context.userId}
    `;
    await sql`update "user" set "emailVerified" = true, "updatedAt" = now() where id = ${context.userId}`;
    return { ok: true as const };
  });
