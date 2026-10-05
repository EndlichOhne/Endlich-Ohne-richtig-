# ENDLICH OHNE — kompletter Quellcode für ChatGPT

Stand: 22. September 2026. Das ist die **ganze App**, nicht eine Auswahl und nicht der Export vom 2. oder 17. September.

## Was das ist

**ENDLICH OHNE** — ärztliche Laser-Tattooentfernung, Praxis Dr. med. Ilyas Geppo, Kaiserstraße 86, 76133 Karlsruhe.

PWA mit: Startseite, Scanner, KI-Vorschau „Haut ohne Tattoo“, Akte, Galerie „Echte Ergebnisse“, Behandlungsplan, Termine/Zahlung (25 %-Anzahlung), PRO-Abo über Stripe, Consent-Gate, Assistent, Wissen, Anbieter.

Sprachen: **Deutsch** (maßgeblich), Englisch, Türkisch, Russisch, Arabisch. **Kein Italienisch.**

Kein Spiel. Keine medizinische Diagnose, keine Heilversprechen, keine Garantie, keine „typischen Ergebnisse“. Rechtstexte, die Entwürfe sind, bleiben als Entwurf markiert.

Praxiszugang, Rollen und Zahlungsregeln: [PRAXIS-SICHERHEIT.md](PRAXIS-SICHERHEIT.md).

## Preise (nicht ändern, außer der Nutzer sagt es)

- Einzel-Scan **0,50 €** (einmal, kein Abo)
- PRO Monat **3,99 €** (automatische Verlängerung)
- PRO Jahr **22,00 €**
- Sitzungs-Anzahlung **25 %** separat über `/zahlung`

Rückerstattungen nie nur auf eine Behauptung des Nutzers. Siehe `src/lib/billing.ts` und `/kaeufe`.

## Technik

- React 19 + TypeScript
- TanStack Start / Router, Datei-Routen in `src/routes/`
- Tailwind v4, Tokens in `src/styles.css`
- Better Auth (`src/lib/auth/`)
- PGLite lokal, Postgres/Neon in Produktion (`src/lib/db.ts`, `migrations/`)
- Stripe (`src/lib/checkout.ts`, `src/lib/billing.ts`, `src/routes/api.stripe.webhook.ts`)
- KI-Scanner und Vorschau (`src/lib/ai-tattoo.ts`, `src/lib/preview-api.ts`)
- i18n: Deutsch in `src/lib/i18n.tsx`, andere Sprachen in `src/lib/locales.ts`

Start (nach dem Entpacken, im Projektordner):

```
npm install
npm run dev
```

Dev-Server: Host `0.0.0.0`, Port `8080`. Immer über `npm run dev`, nicht `vite` direkt.

`node_modules` ist **nicht** im ZIP. Nach `npm install` ist alles da. Keine `.env` anlegen: Schlüssel kommen von der Umgebung (Stripe, Datenbank, xAI). Keine Secrets erfinden oder ins Repo schreiben.

## Marke

- Hintergrund dunkel: `#071617`
- Primär: `#008f90`, Akzent: `#00a8a8`
- Schrift hell: `#f3f8f8` / `#122022`
- Wortmarke **nur** als echte Datei: `/brand/logo-white.svg` und `/brand/logo.webp`
- Logo **nie** als KI-Text neu zeichnen (Schreibfehler)
- Tagline: „Ärztliche Laser-Tattooentfernung“

## Was du nicht kaputt machen darfst

1. Die **Startseiten-Hero** bleibt das echte Straßenfoto der Kaiserstraße (`HeroPhoto`: `/images/hero-mobile.webp`, `/images/kaiserstrasse-hq.webp`, `/images/hero.webp`). Nicht durch generiertes Bild ersetzen.
2. Der fließende Markenfilm (`src/components/brand-film.tsx`, Bilder `public/images/brand-film*.webp`) sitzt auf **PRO**, im PRO-Teaser und in der KI-Vorschau-Karte. Das Logo liegt als SVG **über** dem Film, der Film bewegt sich, das Logo nicht.
3. Consent: localStorage-Schlüssel `eo-consent`, Version `endlich-ohne-5`. AGB, Datenschutz, Medizin-Hinweis und 18+ müssen stimmen (`src/lib/consent.ts`).
4. Auth-Serverfunktionen immer mit `authMiddleware`. Daten immer über die verifizierte `context.userId`, nie über eine vom Client geschickte ID.
5. Fotos der Akte bleiben auf dem Gerät.
6. Bestehende Navigation und Funktionen nicht löschen, nur erweitern, wenn der Nutzer das will.
7. `public/__grok/`, `server/` und `scripts/grok-pwa-*` gehören zur Plattform. Nicht löschen, das „Created with Grok“-Branding nicht per CSS verstecken.

## Wichtige Dateien

| Thema | Dateien |
| --- | --- |
| Startseite | `src/routes/index.tsx` (nicht `_index.tsx`) |
| PRO / Abo | `src/routes/pro.tsx`, `src/components/scan-paywall.tsx`, `src/components/pro-teaser.tsx` |
| Markenfilm | `src/components/brand-film.tsx`, CSS-Klasse `.brand-film` in `src/styles.css` |
| KI-Vorschau | `src/routes/vorschau.tsx`, `src/components/preview-promo.tsx`, `src/lib/preview-api.ts` |
| Scanner | `src/routes/scanner.tsx`, `src/lib/ai-tattoo.ts` |
| Käufe | `src/lib/billing.ts`, `src/routes/kaeufe.tsx` |
| Preise | `src/lib/pricing.ts` |
| Shell, Splash, Consent | `src/routes/__root.tsx`, `src/components/splash-screen.tsx`, `src/components/consent-gate.tsx` |
| Sprachen | `src/lib/i18n.tsx`, `src/lib/locales.ts` |
| Datenbank | `migrations/0001_auth.sql` bis `0009_billing_tx.sql` |

Vollständige Dateiliste: `DATEIEN.txt` in diesem ZIP.

## So arbeitest du

Lies diese Datei zuerst. Danach nur die Dateien, die der Nutzer ändern will. Wenn du Code änderst: nenne die Datei und liefere den vollständigen neuen Inhalt oder einen klaren Patch. Erfinde keine neuen medizinischen Claims.
