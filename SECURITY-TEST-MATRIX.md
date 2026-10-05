# Security Test Matrix

Stand 24. September 2026. „PASSED“ heißt hier nur: die genannte Prüfung ist gelaufen und bestanden. Code-Review ohne Ausführung ist nicht PASSED.

| ID | Szenario | Ausführung | Ergebnis | Begründung |
|---|---|---|---|---|
| A01 | Staff ruft Admin auf | Unit `canCallAdmin("staff")` | PASSED | `reauth.test.ts` / `practice-guard.test.ts` |
| A02 | Doctor ruft Admin auf | Unit `canCallAdmin("doctor")` | PASSED | `reauth.test.ts` |
| A03 | Fremde userId | Unit: fremder Kunde ohne Rolle | PASSED | `practice-guard.test.ts` |
| A04 | Fremde locationId | Unit: Standort der Sitzung ungleich Termin | PASSED | `practice-guard.test.ts` |
| A05 | Fremde memberId | Unit: Admin eines anderen Standorts | PASSED | `practice-guard.test.ts` |
| A06 | Fremde appointmentId | Unit: Änderung nur bei gleichem Standort | PASSED | `practice-guard.test.ts` |
| A07 | Fremder QR | Code-Review | NOT APPLICABLE | Kein Kunden-QR-Login. `/images/qr.webp` ist ein Bild |
| A08 | Termin eines anderen Standorts | Unit | PASSED | gleiche Prüfung wie A04/A06 |
| A09 | Fremde Zahlung | Unit `skuAmountOk` | PASSED | Betragsprüfung. Kein live Stripe-Aufruf |
| A10 | Doppelte Zahlung | Code-Review `stripe_events` | NOT TESTED | Kein zweites signiertes Webhook-Event ausgeführt |
| A11 | Alter Cookie nach Codewechsel | Unit `code_version` | PASSED | Sitzung mit alter Version ist unbenutzbar |
| A12 | Alter Cookie nach Disable | Unit `membershipActive: false` | PASSED | |
| A13 | Cookie nach Standort-Deaktivierung | Unit `locationActive: false` | PASSED | |
| A14 | Abgelaufene Session | Unit `expired: true` und 8-Stunden-Grenze | PASSED | Jahresfrist zusätzlich in A25 |
| A15 | Brute Force | Unit `rateLimitAllows(5)` | PASSED | Fünf Fehlversuche sperren. Kein live HTTP-Sturm |
| A16 | Rollenmanipulation | Unit `effectiveRole("staff","admin")` | PASSED | Gespeicherte Rolle bleibt |
| A17 | Standortmanipulation | Unit | PASSED | Client-Standort ersetzt die Sitzung nicht |
| A18 | Direkter HTTP-Request | — | NOT TESTED | Kein zweites Konto, kein Roh-Request gegen eine laufende Sitzung |
| A19 | Letzter Admin | Unit `lastAdminBlocks` | PASSED | SQL `FOR UPDATE` nicht parallel ausgeführt |
| A20 | Letzter Standort | Unit `lastLocationBlocks` | PASSED | SQL nicht parallel ausgeführt |
| A21 | Reset und alter Zugriff | Unit `revoked: true` | PASSED | |
| A22 | Deaktivierte Membership | Unit | PASSED | |
| A23 | Nutzer setzt sich doctor | Unit `effectiveRole` | PASSED | Kein Client-Feld wird übernommen |
| A24 | Nutzer setzt sich admin | Unit | PASSED | |
| A25 | Zwölf Monate | Unit `accountStillValid` | PASSED | 24.09.2026 bis 24.09.2027. Keine echte abgelaufene Browser-Sitzung |
| A26 | Session-Rotation | Code-Review | NOT TESTED | Neue Better-Auth-Sitzung beim Login, nicht live beobachtet |
| A27 | Logout | Code-Review | NOT TESTED | `signOut` plus `endPracticeSession`, nicht live ausgeführt |
| A28 | Arztzugriff | Code-Review | NOT TESTED | Arzt sieht Termine nur mit gültiger Praxis-Sitzung. Nicht mit einem Arztkonto ausgeführt |
| A29 | Deaktivierter Arzt | Unit | PASSED | inaktive Mitgliedschaft |
| A30 | Arzt ohne Membership | Code-Review | NOT TESTED | Ohne Sitzung kein Praxiszugriff. Nicht live ausgeführt |
