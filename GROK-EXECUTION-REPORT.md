# ENDLICH OHNE – GROK EXECUTION REPORT

## Datum

24. September 2026

## Umgebung

Linux-Sandbox. Kein `DATABASE_URL`. Keine Stripe-Schlüssel im Lauf. Preview-Server der bestehenden App. Keine zweite echte Benutzeridentität.

## Ausgangszustand

Bestehende PWA: Better Auth, Scanner, Akte, Galerie, Stripe-Checkout, Termine, Standorte als Inhalt. Kein Praxis-Rollenmodell zu Beginn dieser Arbeiten.

## Projektinventar

`package.json`, `package-lock.json`, `src/`, `server/`, `migrations/`, `public/`, `scripts/`, `vite.config.ts`. Bilder und Videos wurden nicht verändert.

## Durchgeführte Änderungen

Praxis-Tabellen, gehashte Codes, Rollen `admin` / `doctor` / `staff`, Standortbindung, Audit, Stripe-Betrag und Event-Idempotenz, Upload auf JPEG/PNG/WebP, Konto-Sitzung mit `lastAuthenticatedAt`, Praxis-Sitzung acht Stunden.

## Authentifizierung

Better Auth, HttpOnly-Cookie. Kein Passwort im Frontend. Preview-Bearer nur in sessionStorage auf `*.grok-sandbox.com`.

## jährliche Re-Authentifizierung

Server prüft `lastAuthenticatedAt` plus 365 Tage. Abgelaufene Sitzung wird gelöscht. Neue Anmeldung setzt ein neues `lastAuthenticatedAt`. Andere Geräte bleiben bestehen.

## Arztrollen

`doctor` nur aus `practice_memberships`. Kein Admin-Recht.

## Adminrollen

Mitglieder, Rollen, Codes, Standorte. Letzter Admin bleibt. Erster Admin nur über die beiden Praxis-E-Mails, solange keiner existiert.

## Staffrollen

Termine am eigenen Standort.

## Multi-Standort

Admin kann einen Standort anlegen und wechseln, nur mit eigener Mitgliedschaft. Letzter aktiver Standort bleibt.

## Session Security

Konto bis zur Jahresgrenze. Praxiszugang acht Stunden, Cookie `eo_practice`. Widerruf bei Logout, Disable, Standort-Aus, Codewechsel.

## Datenbankänderungen

| Migration | Zweck | Änderung | Risiko | Backfill | Rollback |
|---|---|---|---|---|---|
| 0010_practice.sql | Praxis | neue Tabellen | gering, nur neue Tabellen | keiner | Tabellen droppen, nicht enthalten |
| 0011_practice_audit.sql | Audit, Stripe-Events, Checks | neue Tabellen, CHECK | gering | keiner | Constraints droppen, nicht enthalten |
| 0012_one_login.sql | letzter Standort | Spalte `last_used_at` | gering | leer | Spalte droppen, nicht enthalten |
| 0013_reauth.sql | Jahresfrist | `session.lastAuthenticatedAt` | gering | `createdAt` | Spalte droppen, nicht enthalten |

Alte Migrationen 0001–0009 wurden nicht geändert.

## Stripe / Payments

Signatur, Betrag, Konto, einmaliges Event. Client kann `paid` nicht selbst setzen.

## Security Fixes

Kein öffentlicher Quellcode-Download. Kein Master-Passwort. Kein `?admin=true`. Development-User nur wenn Auth aus ist und keine `DATABASE_URL` gesetzt ist.

## Tests

Zweiter Gesamtlauf nach dem Lint-Fix und der Anpassung von `scripts/migration-plan.test.mjs`:

`npm test`: FAIL. 195 Tests, 183 bestanden, 12 fehlgeschlagen. Fehlgeschlagen sind Template-Prüfungen, nicht die Rollen- oder Frist-Tests:

- the build side resolves the template's shipped app-env
- platform chrome overwrites share-card metas and always sets og:title
- published grok.me slug is still a title fallback
- emits og:image for a public host and prefers a custom card
- placeholder og:image appends site.color when it is 6-digit hex
- document title entities are not double-escaped on og:title
- injects into documents with no head element
- streaming injector matches `</HEAD>` case-insensitively
- uses the app name in the injected title tag
- the template ships auth off
- the wrapped command runs with the app env applied
- the CLI still runs when invoked through a symlinked path

`src/lib/reauth.test.ts` und `src/lib/practice-guard.test.ts` sind in `npm test` enthalten und in diesem Lauf nicht unter den 12 Fehlern.

`npm run typecheck`: PASSED. Letzter Lauf `tsc --noEmit`, Exit 0.

`npm run lint`: FAIL. 1 Error, 17 Warnings. Der Error ist `src/lib/app-data/client.server.ts:214`, leerer `catch`. Die Warnings sind bestehende React-Hook- und Fast-Refresh-Hinweise. Der leere `catch` in `practice-api.ts` und die Escapes in `email.ts` sind behoben.

## Build

Abschließendes `npm run build`: PASSED, Exit 0. `db:migrate` hat ohne `DATABASE_URL` nichts gegen eine Produktionsdatenbank ausgeführt.

## Attack Matrix

Siehe `SECURITY-TEST-MATRIX.md`. Nicht alles ist PASSED.

## Bekannte Einschränkungen

Kein MFA. Kein Kunden-QR-Login. Brute-Force-Schutz nur für den Praxiscode. Parallele SQL-Rennen um den letzten Admin sind im Code mit `FOR UPDATE` geschrieben und nicht mit zwei gleichzeitigen Verbindungen gemessen.

## Nicht getestete Bereiche

Live-Registrierung, Live-Logout, zwei Konten, signierter Stripe-Webhook, Arztkonto in der Oberfläche, direkte HTTP-Angriffe. Siehe Matrix: NOT TESTED.

## Deployment-Hinweise

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` setzen. Platzhalter in `.env.example`. Ohne Stripe bleibt die Zahlung aus. Ohne `BETTER_AUTH_SECRET` erzeugt die Preview ein zufälliges Prozess-Secret.

## Finaler Status

PARTIALLY COMPLETED. Der Code ist im bestehenden Projekt. Die automatischen Befehle sind nicht alle grün. Es gibt keine Aussage, dass alle Funktionen live funktionieren.
