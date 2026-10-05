# Auth Architecture

## Normal User

Registrierung und Anmeldung laufen über Better Auth. Die Sitzung ist das HttpOnly-Cookie `__Host-grok-auth.session_token` (Secure, SameSite=Lax, Path=/). Passwörter und Sitzungs-Tokens liegen nicht in localStorage. In der Live-Preview auf `*.grok-sandbox.com` liegt ein Bearer-Token in sessionStorage, weil dort Cookies partitioniert sind. Das ist nicht der Produktionspfad.

## Annual Re-authentication

`session.lastAuthenticatedAt` wird gesetzt, wenn Better Auth eine Sitzung anlegt. `enforceYearlyReauth` in `src/lib/auth/verify.server.ts` prüft bei jedem Serverzugriff: liegt der Zeitpunkt zwölf Monate oder länger zurück, wird diese Sitzung gelöscht. Die Meldung ist: „Aus Sicherheitsgründen musst du dich erneut anmelden.“ Eine neue Anmeldung erzeugt eine neue Sitzung und setzt die Frist neu. Andere Geräte werden dabei nicht abgemeldet.

## Doctor

`doctor` steht in `practice_memberships.role`. Der Client kann die Rolle nicht setzen. Ein Arzt ist kein Admin. `canCallAdmin` erlaubt Admin-Funktionen nur bei `admin`.

## Staff

`staff` sieht und ändert Termine nur am Standort der eigenen Praxis-Sitzung. Keine Mitgliederverwaltung.

## Admin

`admin` verwaltet Mitglieder, Rollen, Codes und Standorte des eigenen Standorts. Der letzte aktive Admin und der letzte aktive Standort werden in derselben SQL-Anweisung mit `FOR UPDATE` gehalten. Der erste Admin entsteht nur, wenn noch keiner existiert und die E-Mail `karlsruhe@endlich-ohne.de` oder `kontakt@endlich-ohne.de` ist. Das ist kein Master-Passwort.

## Clinic Session

Getrennt vom Konto. Cookie `eo_practice`, HttpOnly, Path=/, SameSite=Lax, in HTTPS Secure. Lebensdauer acht Stunden. Beim Anmelden wird sie nur angelegt, wenn eine aktive Mitgliedschaft an einem aktiven Standort existiert. Jede Praxisabfrage lädt die Sitzung neu und prüft Widerruf, Ablauf, Mitgliedschaft, Standort und Code-Version.

## Session Revocation

Abmelden löscht die Better-Auth-Sitzung dieses Geräts und die Praxis-Sitzung. Deaktivieren einer Mitgliedschaft, Deaktivieren eines Standorts, Codewechsel und Code-Reset setzen `revoked_at` bzw. erhöhen `code_version`. Ein Passwort-Reset über Better Auth nutzt `revokeSessionsOnPasswordReset`.

## Security

Rollen und Standort kommen aus der Datenbank, nicht aus `role`, `userId` oder `locationId` im Request. Praxiscodes werden mit scrypt gehasht. Der Vergleich ist timing-safe. Fünf Fehlversuche in 15 Minuten sperren weitere Versuche. Es gibt kein selbstgebautes MFA.

## Testing

Fristen und Rollen liegen in `src/lib/reauth.test.ts` und `src/lib/practice-guard.test.ts`. Ein live Zwei-Konten-Angriff und ein signierter Stripe-Webhook wurden nicht ausgeführt. Ergebnisse stehen in `SECURITY-TEST-MATRIX.md` und `GROK-EXECUTION-REPORT.md`.
