# Praxiszugang und Zahlungen

Stand der Umsetzung im vorhandenen Projekt. Keine zweite Anmeldung neben Better Auth.

## Modell

Ein normales Benutzerkonto bleibt die Identität. Der Praxiszugang hängt zusätzlich daran.

- `practice_locations` — Standort, aktiv oder nicht
- `practice_memberships` — Benutzer, Standort, Rolle (`admin`, `doctor`, `staff`), aktiv, Code-Hash, Salt, `must_rotate`, `code_version`
- `practice_sessions` — Sitzung an Benutzer, Mitgliedschaft und Standort gebunden
- `practice_codes` — nur Hash und Salt, einmal benutzbar
- `practice_audit` — Aktion, Akteur, Standort, Ziel. Keine Codes, keine Geheimnisse
- `stripe_events` — Stripe-Event-ID, damit ein Event nur einmal verbucht wird

Der erste Admin entsteht nur, wenn noch keiner existiert und die E-Mail die Praxisadresse ist. Es gibt keinen Mastercode.

## Ablauf

1. Admin legt ein Mitglied an einem bestehenden Konto an oder erzeugt einen Einmalcode.
2. Der Klartext-Code wird nur in der Antwort angezeigt und nicht in der Datenbank gespeichert.
3. Der Code wird mit scrypt gehasht. Der Vergleich ist timing-safe.
4. Beim ersten Einlösen muss ein eigener Code gesetzt werden.
5. Dabei steigt `code_version`, alte Praxis-Sitzungen werden widerrufen.
6. Der Cookie `eo_practice` ist HttpOnly, Path=/, SameSite=Lax, in HTTPS zusätzlich Secure. Er liegt nicht in localStorage und nicht in der URL.

Ein Request mit fremder `userId`, `role` oder `locationId` ändert nichts. Rolle und Standort kommen aus der Sitzung und der Mitgliedschaft.

## Standort

Termine werden mit `location_id` der Sitzung gespeichert. Lesen und Ändern verlangt dieselbe `location_id` oder das eigene Kundenkonto, direkt in der Abfrage.

Der letzte aktive Admin und der letzte aktive Standort werden in derselben SQL-Anweisung mit `FOR UPDATE` geprüft. Ein paralleles Deaktivieren kann den letzten nicht entfernen.

## Zahlungen

Stripe-Webhook prüft die Signatur. Der Betrag muss zum Produkt passen. `paid=true` vom Browser reicht nicht. Dieselbe Stripe-Event-ID wird nicht zweimal angewendet. Schlägt die Verarbeitung fehl, wird die Event-Zeile gelöscht, damit Stripe erneut senden kann.

## Uploads

Scanner, Vorschau und Galerie nehmen nur JPEG, PNG oder WebP als Data-URL. Keine Dateipfade.

## Header

Im Dev- und Preview-Server: `X-Content-Type-Options: nosniff` und `Referrer-Policy: strict-origin-when-cross-origin`.

Kein `X-Frame-Options` und keine strenge CSP, weil die Vorschau, Stripe, Auth und die PWA sonst brechen können.

## Umgebung

Keine echten Geheimnisse im Quellcode. Wenn sie fehlen, bleibt die Funktion aus:

- `DATABASE_URL` — ohne sie läuft die lokale Datenbank
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `XAI_API_KEY` — ohne sie bleibt die Online-KI aus

## Nicht enthalten

Es gibt keinen Kunden-QR, der Zugriff gewährt. Das Standortbild unter `/images/qr.webp` ist kein Login.

Live-Angriffe mit zwei echten Konten und ein signierter Stripe-Webhook wurden in dieser Umgebung nicht ausgeführt.

## Tests

`src/lib/practice-guard.test.ts` prüft Hash, Rollen, Standortgrenzen, letzten Admin, letzten Standort, abgelaufene und widerrufene Sitzungen und falsche Beträge.
