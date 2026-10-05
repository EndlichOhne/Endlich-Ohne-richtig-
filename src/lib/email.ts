const DISPOSABLE = new Set(
  [
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.org",
    "sharklasers.com",
    "grr.la",
    "10minutemail.com",
    "10minmail.com",
    "tempmail.com",
    "temp-mail.org",
    "throwawaymail.com",
    "yopmail.com",
    "yopmail.fr",
    "trashmail.com",
    "getnada.com",
    "nada.email",
    "discard.email",
    "mailnesia.com",
    "maildrop.cc",
    "fakeinbox.com",
    "tempail.com",
    "moakt.com",
    "emailondeck.com",
    "mytemp.email",
    "trash-mail.com",
    "getairmail.com",
    "dispostable.com",
    "mintemail.com",
    "spamgourmet.com",
    "mailcatch.com",
    "inboxkitten.com",
    "temporary-mail.net",
  ].map((d) => d.toLowerCase()),
);

const BLOCKED_DOMAINS = new Set(
  ["example.com", "example.org", "example.net", "test.com", "test.de", "localhost", "invalid", "local"].map(
    (d) => d.toLowerCase(),
  ),
);

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isPlausibleEmail(value: string) {
  const email = normalizeEmail(value);
  if (email.length < 6 || email.length > 120) return false;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) return false;
  if (email.includes("..") || email.startsWith(".") || email.includes("@.")) return false;
  const domain = email.split("@")[1] ?? "";
  if (DISPOSABLE.has(domain) || BLOCKED_DOMAINS.has(domain)) return false;
  return true;
}

export function emailRejectReason(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return "Bitte eine E-Mail angeben.";
  const domain = email.split("@")[1] ?? "";
  if (DISPOSABLE.has(domain)) {
    return "Bitte keine Wegwerf-Adresse. Wir schicken einen Bestätigungscode.";
  }
  if (BLOCKED_DOMAINS.has(domain) || !isPlausibleEmail(email)) {
    return "Bitte eine echte E-Mail angeben (kein Platzhalter).";
  }
  return null;
}
