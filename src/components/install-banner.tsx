import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { useConsent } from "@/lib/consent-store";
import { detectPlatform, isStandalone } from "@/lib/device";
import {
  dismissInstallHint,
  loadInstallHintDismissed,
  type BeforeInstallPromptEvent,
} from "@/lib/install";
import { useI18n } from "@/lib/i18n";

export function InstallBanner() {
  const { accepted, consent } = useConsent();
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hidden, setHidden] = useState(true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">(
    "desktop",
  );

  useEffect(() => {
    setPlatform(detectPlatform());
    setHidden(isStandalone() || loadInstallHintDismissed());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (
    hidden ||
    !accepted ||
    !consent.onboardingDone ||
    pathname === "/installieren" ||
    pathname === "/login" ||
    pathname === "/assistent" ||
    pathname === "/scanner" ||
    pathname.startsWith("/zahlung") ||
    pathname === "/widerruf"
  ) {
    return null;
  }

  const close = () => {
    dismissInstallHint();
    setHidden(true);
  };

  const installNative = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    close();
  };

  return (
    <div className="install-banner page-pad">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-card py-3 pr-2 pl-4 shadow-[var(--shadow-border)]">
        <Download className="size-5 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-sm">
          {platform === "ios"
            ? t("install.ios")
            : platform === "android"
              ? t("install.android")
              : t("install.desktop")}
        </p>
        {deferred ? (
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
            onClick={() => void installNative()}
          >
            {t("install.do")}
          </button>
        ) : (
          <Link
            to="/installieren"
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            {t("install.guide")}
          </Link>
        )}
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground"
          aria-label={t("install.close")}
          onClick={close}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
