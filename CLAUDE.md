# ENDLICH OHNE — Übergabe an Claude

Deutsche PWA für die ärztliche Laser-Tattooentfernung (Marke ENDLICH OHNE, Filiale Karlsruhe).

## Stack

- React 19 + TanStack Start/Router (file routes in `src/routes/`)
- Tailwind v4 Tokens in `src/styles.css`
- Better Auth (`src/lib/auth/`), PGLite lokal / Neon deployed (`src/lib/db.ts`)
- Stripe Checkout (25 % Anzahlung), xAI Grok für Scanner + Assistent
- Fotos der Akte: IndexedDB lokal (DSGVO Art. 9), Galerie separat serverseitig
- Start: `npm install` dann `npm run dev` (Port siehe `package.json`, Host 0.0.0.0)

## Produktregeln (nicht brechen)

- Keine Diagnose, kein Heilversprechen, keine Garantie, keine typischen Ergebnisse
- App/Konto ab 16; Behandlung vor Ort oft 18
- Rechtstexte sind **Entwürfe** (`LegalDraftBanner`)
- Consent-Gate: ein Button „Ich akzeptiere alles und weiter“ — setzt nur Pflicht (AGB, Datenschutz gelesen, medizinischer Hinweis, Alter 16+). Optional (Standort, Erinnerungen) bleibt aus
- Keine Google-Fonts vom CDN (lokal: `public/fonts/`)
- Bottom-Nav: Home, Akte, Check, Termine, Mehr — nicht zerstören
- Galerie „Echte Ergebnisse“: Demo gekennzeichnet, Slider, Filter, Upload mit Einwilligung, Moderation

## Wichtige Dateien

| Bereich | Pfad |
|---|---|
| Startseite | `src/routes/index.tsx` |
| Consent | `src/components/consent-gate.tsx`, `src/lib/consent.ts` |
| KI Assistent | `src/routes/assistent.tsx`, `src/lib/ai-tattoo.ts` |
| Scanner | `src/routes/scanner.tsx` |
| Galerie | `src/routes/ergebnisse*.tsx`, `src/lib/gallery.ts` |
| Zahlung | `src/routes/zahlung.index.tsx`, `src/lib/checkout.ts` |
| Brand | `src/lib/brand.ts` |
| Shell/Nav | `src/components/app-shell.tsx` |
| DB-Migrationen | `migrations/*.sql` |

## Offene Anwaltsthemen

Impressum ohne HRB/USt-IdNr./Kammer. AVV Hosting, Stripe, xAI. HWG für echte Kundenfotos. Nicht erfinden.
