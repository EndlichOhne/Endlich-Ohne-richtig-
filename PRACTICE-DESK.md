# Praxisbereich

Stand: 5. Oktober 2026

Nach dem Praxis-Login landet ein Admin, Doctor oder Staff im Praxisbereich, nicht auf der Kunden-Startseite. Die Praxis-Sitzung bleibt acht Stunden, HttpOnly, und Logout widerruft sie.

Routen:

- `/praxis` Übersicht aus echten Terminen des Standorts
- `/praxis/kalender` Tagesliste und Termin anlegen, nur für ein vorhandenes Kundenkonto
- `/praxis/termin/$id` Termin, Status, Notiz, Betrag, manuelle Zahlung
- `/praxis/akte/$id` Akte über die Termin-ID, nicht über die Kunden-ID in der URL
- `/praxis/zahlungen` nur Termine mit hinterlegtem Betrag
- `/praxis/verwaltung` nur Admin

Statuswechsel nur in dieser Reihenfolge: geplant, bestätigt, angekommen, Behandlung läuft, abgeschlossen. Absagen und nicht erschienen sind möglich, bis die Behandlung abgeschlossen ist. Staff darf Behandlung nicht starten oder abschließen. Doctor bekommt keine Adminrechte.

Eine Zahlung wird nur erfasst, wenn Anzahlung und Rest serverseitig hinterlegt sind. Ein vom Client gesendeter Status `PAID` wird ignoriert. Stripe bleibt im Checkout.

Es gibt keinen Patienten-QR im Datenmodell. Die Suche nutzt Name oder Termin-ID und prüft den Standort auf dem Server.

Keine Beispielkunden und keine erfundenen Termine. Leere Tage bleiben leer.

Tests in diesem Lauf: 195 Template-Tests und 79 Projekt-Tests, 0 Fehler. Typecheck, Lint und Build sind durchgelaufen. Lint hat 18 Warnings und 0 Errors.
