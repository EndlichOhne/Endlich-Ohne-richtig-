import { BRAND } from "@/lib/brand";

export function mailerReady() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendAppEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "no-mailer" };
  const from =
    process.env.MAIL_FROM?.trim() ||
    `${BRAND.name} <${BRAND.email}>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { ok: false, error: `mail-${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "mail-unreachable" };
  }
}

export function confirmMailBody(code: string) {
  return [
    `Hallo,`,
    ``,
    `dein Bestätigungscode für ${BRAND.name}:`,
    ``,
    `    ${code}`,
    ``,
    `Er gilt 15 Minuten. Wenn du kein Konto angelegt hast, ignoriere diese Mail.`,
    ``,
    `${BRAND.praxis}`,
    `${BRAND.street}, ${BRAND.zip} ${BRAND.city}`,
    BRAND.email,
    ``,
    `Kein Newsletter. Nur zur Bestätigung deiner E-Mail.`,
  ].join("\n");
}
