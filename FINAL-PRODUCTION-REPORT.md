# ENDLICH OHNE – finaler Produktionsstand

Datum: 5. Oktober 2026
Letzter geprüfter Lauf in dieser Umgebung.

Legende: PASS = hier ausgeführt und beobachtet. CODE VERIFIED = der Code setzt die Regel, der externe Dienst lief nicht. NOT VERIFIED = nicht geprüft. FAIL = kaputt.

## 1. CUSTOMER APP

CODE VERIFIED, Teile PASS.

Nach dem 18+-Consent im Browser geöffnet und Text gesehen:

- `/check` Check-Start
- `/scanner` Scanner-Seite mit Foto aufnehmen oder hochladen
- `/akte` leere Akte, kein erfundener Inhalt
- `/planer` Planer im Konto
- `/assistent` Online-KI, Hinweis keine Diagnose
- `/koerper` 3D-Hinweis, keine Diagnose
- `/pro` Preise 3,99 € / 22,00 €
- `/ergebnisse` Galerie-Seite
- `/zahlung` Anzahlung 25 %, keine Kartendaten in der App
- `/mehr` Profil und Sprachen
- `/login` Seite da, Anmeldung in dieser Umgebung aus

Nicht geprüft: echte Registrierung, echtes Foto, Speichern eines Scans, Logout eines echten Kontos.

## 2. AUTH

CODE VERIFIED. Live-Anmeldung NOT VERIFIED.

In dieser Sandbox steht in `.grok/app-env.json` `VITE_AUTH_ENABLED=false`. Die Login-Seite sagt deshalb „Anmeldung ist nicht aktiv“. `BETTER_AUTH_SECRET` ist MISSING. Registrierung, Login, Logout, Reload und die 12-Monats-Frist sind hier nicht mit einem echten Konto gelaufen. Geschützte Seiten führen im Code über `RequireAuth`.

Production muss `VITE_AUTH_ENABLED=true` setzen. Das ist hier NOT VERIFIED.

## 3. DATABASE

CODE VERIFIED. Live-Datenbank NOT VERIFIED.

`DATABASE_URL` ist MISSING. Der Build überspringt die Neon-Migration und nutzt lokal PGLite. Die Praxis-Migration `0014_practice_desk.sql` ist im Code. Create/Read/Update gegen Neon ist NOT VERIFIED.

## 4. SCANNER

Seite PASS. Kamera NOT VERIFIED.

Die Scanner-Seite lädt und bietet Aufnahme oder Upload. Eine Kamera-Erlaubnis, ein echtes Foto, Upload, Retry und Speichern sind in diesem Lauf nicht ausgeführt.

## 5. AI

CODE VERIFIED. Live-Antwort NOT VERIFIED.

`XAI_API_KEY` ist SET. Es wurde kein Foto an die KI geschickt. Der Prompt verlangt Deutsch, eine Spanne, keine Diagnose und keine Garantie. Der italienische Ausfalltext ist entfernt. Test `ai-language` ist PASS. Ob das Modell eine konkrete Antwort liefert: NOT VERIFIED.

## 6. PRO / STRIPE

CODE VERIFIED. Zahlung NOT VERIFIED.

`STRIPE_SECRET_KEY` MISSING. `STRIPE_WEBHOOK_SECRET` MISSING. Ein Beleg mit Status paid wird serverseitig nur akzeptiert, wenn Stripe die Session als paid meldet, die User-ID passt und der Betrag stimmt. Checkout, Abbruch, Webhook und doppelte Anfrage sind NOT VERIFIED. Kein Stripe-Secret im Frontend ausgegeben.

## 7. PRACTICE

CODE VERIFIED. Voller Praxis-Durchklick NOT VERIFIED.

`/praxis` zeigt ohne Mitgliedschaft den Code-Zugang, keine Beispielkunden. Dashboard, Kalender, Termin, Akte, Zahlung und Admin-Seiten sind im Code. Die Statusmaschine und die Rollengrenzen sind als Unit-Tests PASS. Ein eingeloggter Doctor mit echten Terminen ist hier nicht durchgeklickt.

## 8. ADMIN

CODE VERIFIED. Live NOT VERIFIED.

Verwaltung, Rollen, Standorte, Sitzungen und Audit hängen an der Admin-Rolle. Der letzte aktive Admin bleibt im bestehenden SQL geschützt. Keine Admin-Sitzung in diesem Browser.

## 9. DOCTOR

CODE VERIFIED. Live NOT VERIFIED.

Doctor darf Behandlung starten, dokumentieren und abschließen. Doctor darf keine Admin-Aktion. Fremder Standort wird von der Boundary abgelehnt. Nicht mit einem Doctor-Konto geprüft.

## 10. STAFF

CODE VERIFIED. Live NOT VERIFIED.

Staff darf Kalender, Check-in, Bestätigen und eine hinterlegte Zahlung erfassen. Staff darf keine Behandlung starten und keine Rolle ändern. Nicht mit einem Staff-Konto geprüft.

## 11. PWA

PASS für Manifest. Offline NOT VERIFIED.

`/__grok/manifest.webmanifest` antwortet 200. Name und Kurzname sind `ENDLICH OHNE`, Start-URL `/`, Display standalone, Icon vorhanden. Ein eigener Service Worker der App ist nicht vorhanden. Offline-Verhalten ist NOT VERIFIED. iPhone und Android sind NOT VERIFIED.

## 12. SECURITY

Unit-Tests PASS. Direkte Live-Requests NOT VERIFIED.

Geprüft im Testlauf, nicht gegen einen laufenden Login:

- Kunde ohne Praxis-Session darf den Bereich nicht öffnen
- Doctor nicht am fremden Standort
- Staff nicht als Admin
- deaktivierte Mitgliedschaft und abgelaufene Session ungültig
- Status nicht überspringbar
- Client-Status `PAID` setzt keine Zahlung
- Kunde A liest nicht Termin von Kunde B über eine behauptete Rolle

Ein echter HTTP-Angriff mit zwei Konten ist NOT VERIFIED.

## 13. TESTS

PASS

AUTOMATED TESTS: 196/196 und 80/80

## 14. BUILD

TYPECHECK: PASS
LINT: PASS mit 18 Warnings, 0 Errors
BUILD: PASS

## 15. ENVIRONMENT

| Variable | Stand |
|---|---|
| VITE_AUTH_ENABLED | in der Sandbox false, Production NOT VERIFIED |
| DATABASE_URL | MISSING |
| BETTER_AUTH_SECRET | MISSING |
| STRIPE_SECRET_KEY | MISSING |
| STRIPE_WEBHOOK_SECRET | MISSING |
| XAI_API_KEY | SET, Wert nicht ausgegeben |

## 16. DEPLOYMENT

NOT VERIFIED. Es wurde kein Production-Deploy und kein echter Stripe-Webhook geprüft.

## PRODUCTION

NOT READY

Grund: Datenbank, Auth-Secret und Stripe fehlen in dieser Umgebung. Anmeldung ist hier aus. Kamera, KI-Antwort, Zahlung und ein echter Praxis-Durchklick sind nicht gelaufen.
