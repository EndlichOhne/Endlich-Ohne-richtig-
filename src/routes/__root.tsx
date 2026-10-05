import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/app-shell";
import { ConsentGate, isLegalPath } from "@/components/consent-gate";
import { SplashScreen, markBootPainted, useBootReady } from "@/components/splash-screen";
import { ConsentProvider, useConsent } from "@/lib/consent-store";
import { LocaleProvider } from "@/lib/i18n";
import { AppError, AppNotFound } from "@/components/app-error";
import { BRAND } from "@/lib/brand";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  errorComponent: AppError,
  notFoundComponent: AppNotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: BRAND.name },
      {
        name: "description",
        content:
          "ENDLICH OHNE – ärztliche Laser-Tattooentfernung. Unverbindliche Orientierung zu Aufwand, Sitzungen und Standorten. Keine Diagnose, keine Garantie.",
      },
      { name: "theme-color", content: "#008f90" },
      { name: "application-name", content: BRAND.name },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      { name: "apple-mobile-web-app-title", content: BRAND.name },
      { name: "format-detection", content: "telephone=yes" },
      { name: "color-scheme", content: "light" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: "/icons/icon-192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        href: "/icons/icon-512.png",
      },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/icons/apple-touch-icon.png",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      {
        rel: "preload",
        href: "/fonts/outfit-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/brand/avatar.webp",
        as: "image",
        type: "image/webp",
      },
      {
        rel: "preload",
        href: "/brand/logo-white.svg",
        as: "image",
        type: "image/svg+xml",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="de" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        <PreviewHostBridge />
        <AuthProvider>
          <LocaleProvider>
            <ConsentProvider>
              <GatedApp />
            </ConsentProvider>
          </LocaleProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function GatedApp() {
  const { accepted, ready } = useConsent();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const booted = useBootReady();
  const [splash, setSplash] = useState(true);
  const legal = isLegalPath(path);
  const showApp = booted && ((ready && accepted) || legal);

  useEffect(() => {
    if (!booted) {
      setSplash(true);
      return;
    }
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => {
      setSplash(false);
      markBootPainted();
    }, reduce ? 0 : 320);
    return () => window.clearTimeout(id);
  }, [booted]);

  return (
    <>
      {showApp ? (
        <AppShell>
          <Outlet />
        </AppShell>
      ) : (
        <div className="min-h-dvh bg-hero" aria-hidden />
      )}
      {splash ? <SplashScreen done={booted} /> : <ConsentGate />}
    </>
  );
}
