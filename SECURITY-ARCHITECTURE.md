# Security Architecture

Nur das, was im Code liegt.

## 1. Authentifizierung

Better Auth. Identität kommt aus der serverseitigen Sitzung. `requireUserId` übernimmt keine `userId` aus dem Request.

## 2. Session-Modell

Konto-Cookie `__Host-grok-auth.session_token`, bis zu 365 Tage laut Better-Auth-`expiresIn`, zusätzlich durch `lastAuthenticatedAt` auf zwölf Monate begrenzt. Praxis-Cookie `eo_practice`, acht Stunden. Mehrere Geräte behalten eigene Sitzungen.

## 3. Jährliche Re-Authentifizierung

`src/lib/reauth.ts` (`YEAR_MS`) und `enforceYearlyReauth`. Abgelaufene Sitzung wird gelöscht. Die Prüfung läuft auf dem Server.

## 4. Arztrolle

`doctor` in `practice_memberships`. Operative Termine am eigenen Standort. Keine Admin-Funktionen.

## 5. Adminrolle

Mitglieder, Rollen, Einmalcodes, Standorte. Nur mit Admin-Sitzung am selben Standort.

## 6. Staffrolle

Termine am eigenen Standort. Kein `requireAdmin`.

## 7. Standortmodell

`practice_locations`. Termine speichern `location_id` der Sitzung. Lesen filtert `customer_user_id` oder diese `location_id` in SQL.

## 8. Praxiscode

scrypt, Salt, timing-safe. Nur Hash in `practice_codes`. Einmal nutzbar. Nicht in Audit-Logs.

## 9. IDOR/BOLA-Schutz

Praxisabfragen prüfen Mitgliedschaft und Standort serverseitig. Fremde `memberId` am anderen Standort liefert „Nicht gefunden.“

## 10. Stripe-Schutz

Webhook prüft die Signatur. Betrag muss zum Produkt passen. `stripe_events.id` ist eindeutig. Ein Beleg mit Status `paid` wird nur nach `assertDepositPaidForUser` geschrieben. Keine Kartennummer im System.

## 11. Rate Limiting

Praxiscode: fünf Fehlversuche in 15 Minuten. Ein allgemeines Login-Rate-Limit über die ganze App ist nicht zusätzlich eingebaut.

## 12. Audit

`practice_audit` speichert Aktion, Akteur, Standort, Ziel. Keine Codes, Tokens oder Passwörter.

## 13. Secret Management

`.env.example` hat nur leere Platzhalter. `BETTER_AUTH_SECRET` kommt aus der Umgebung. In der Preview ohne Secret wird pro Prozess ein Zufallswert erzeugt, kein festes Passwort.

## 14. Session Revocation

Logout, Jahresfrist, Membership-Deaktivierung, Standort-Deaktivierung, Codewechsel, Code-Reset, Passwort-Reset.

## 15. Bekannte Einschränkungen

Kein MFA. Kein Kunden-QR als Zugang. Der Bootstrap des ersten Admins ist an zwei Praxis-E-Mails gebunden, solange kein Admin existiert. Live-Angriffe mit zwei Konten und Stripe sind nicht gelaufen. `npm test` ist nicht vollständig grün, siehe Report.
