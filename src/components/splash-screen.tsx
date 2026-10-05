import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { useConsent } from "@/lib/consent-store";
import { useI18n } from "@/lib/i18n";

const ASSETS = [
  "/images/store-hero.webp",
  "/images/store-wide.webp",
  "/brand/logo.webp",
  "/brand/logo-white.svg",
  "/brand/avatar.webp",
  "/brand/profile.webp",
  "/images/hero-mobile.webp",
] as const;

const MIN_MS = 1500;
const MAX_MS = 2800;
const FONT_MS = 400;

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function preload(src: string, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const img = new Image();
    const done = () => {
      img.onload = null;
      img.onerror = null;
      resolve();
    };
    signal.addEventListener("abort", done, { once: true });
    img.decoding = "async";
    img.onload = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = src;
    if (img.complete && img.naturalWidth > 0) done();
  });
}

export function useBootReady() {
  const { ready: consentReady } = useConsent();
  const { ready: localeReady } = useI18n();
  const [assets, setAssets] = useState(false);
  const [minTime, setMinTime] = useState(false);
  const [maxTime, setMaxTime] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("booting");
    const min = window.setTimeout(
      () => setMinTime(true),
      reducedMotion() ? 80 : MIN_MS,
    );
    const max = window.setTimeout(() => setMaxTime(true), MAX_MS);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    let fontTimer = 0;
    const fonts =
      typeof document !== "undefined" && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready.then(() => undefined).catch(() => undefined),
            new Promise<void>((r) => {
              fontTimer = window.setTimeout(r, FONT_MS);
            }),
          ])
        : Promise.resolve();
    void Promise.all([
      ...ASSETS.map((src) => preload(src, ac.signal)),
      fonts,
    ]).finally(() => {
      if (!ac.signal.aborted) setAssets(true);
    });
    return () => {
      ac.abort();
      if (fontTimer) window.clearTimeout(fontTimer);
    };
  }, []);

  if (maxTime) return true;
  return consentReady && localeReady && assets && minTime;
}

export function markBootPainted() {
  document.documentElement.classList.remove("booting");
}

export function SplashScreen({ done = false }: { done?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={done ? "splash is-done" : "splash"}
      role="status"
      aria-live="polite"
      aria-label={t("splash.loading")}
      aria-hidden={done || undefined}
    >
      <picture>
        <source media="(min-width: 768px)" srcSet="/images/store-wide.webp" type="image/webp" />
        <img
          className="splash-bg"
          src="/images/store-hero.webp"
          alt=""
          decoding="sync"
          fetchPriority="high"
        />
      </picture>
      <div className="splash-veil" aria-hidden />
      <img
        src="/brand/logo-white.svg"
        alt={BRAND.name}
        width={180}
        height={66}
        className="splash-logo"
        decoding="sync"
        fetchPriority="high"
      />
      <div className="splash-copy">
        <p className="splash-kicker">{t("brand.tagline")}</p>
        <p className="splash-hero">{t("brand.hero").replace(". ", ".\n")}</p>
        <p className="splash-status">{t("splash.loading")}</p>
        <div className="splash-bar" aria-hidden>
          <i />
        </div>
      </div>
    </div>
  );
}
