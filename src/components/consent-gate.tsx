import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConsentCheck } from "@/components/consent-check";
import { Disclaimer } from "@/components/disclaimer";
import { explicitConsentReady } from "@/lib/consent";
import { useConsent } from "@/lib/consent-store";
import { LocaleSwitch, useI18n } from "@/lib/i18n";

const LEGAL = new Set([
  "/agb",
  "/datenschutz",
  "/impressum",
  "/hinweise",
  "/widerruf",
  "/zahlung/erfolg",
  "/zahlung/abbruch",
]);

export function isLegalPath(path: string) {
  return LEGAL.has(path);
}

export function ConsentGate() {
  const { accepted, acceptRequired, ready } = useConsent();
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [agb, setAgb] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [medical, setMedical] = useState(false);
  const [age18, setAge18] = useState(false);
  const canEnter = explicitConsentReady({ agb, privacy, medical, age18 });

  if (!ready) return null;

  if (accepted || isLegalPath(path)) return null;

  function enter() {
    if (!explicitConsentReady({ agb, privacy, medical, age18 })) return;
    acceptRequired({ agb: true, privacy: true, medical: true, age18: true });
  }

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-5 pb-28 pt-10">
        <img
          src="/brand/avatar.webp"
          alt=""
          width={64}
          height={64}
          className="size-16 self-start rounded-full object-cover shadow-[var(--shadow-border)]"
        />
        <img
          src="/brand/logo.webp"
          alt="ENDLICH OHNE"
          className="h-8 w-auto self-start"
          width={340}
          height={124}
        />
        <h1 id="consent-title" className="font-display text-3xl">
          {t("consent.welcome")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("consent.body")}</p>

        <ConsentCheck
          id="gate-agb"
          checked={agb}
          onChange={setAgb}
          required
          label={t("consent.agbCheck")}
        />
        <ConsentCheck
          id="gate-privacy"
          checked={privacy}
          onChange={setPrivacy}
          required
          label={t("consent.privacyCheck")}
        />
        <ConsentCheck
          id="gate-medical"
          checked={medical}
          onChange={setMedical}
          required
          label={t("consent.medicalCheck")}
        />
        <ConsentCheck
          id="gate-age18"
          checked={age18}
          onChange={setAge18}
          required
          label={t("consent.age18")}
        />

        <Button
          type="button"
          className="min-h-16 w-full rounded-xl text-base"
          disabled={!canEnter}
          onClick={enter}
        >
          {t("consent.accept")}
        </Button>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">{t("lang.choose")}</p>
          <LocaleSwitch compact />
        </div>

        <p className="text-xs text-muted-foreground">
          <Link to="/agb" className="underline">
            {t("consent.agb")}
          </Link>
          {" · "}
          <Link to="/datenschutz" className="underline">
            {t("consent.privacy")}
          </Link>
          {" · "}
          <Link to="/hinweise" className="underline">
            {t("consent.notes")}
          </Link>
          {" · "}
          <Link to="/impressum" className="underline">
            {t("consent.imprint")}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">{t("consent.foot")}</p>
        <Disclaimer compact />
      </div>
    </div>
  );
}