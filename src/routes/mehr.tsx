import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { deleteMyAccount } from "@/lib/account";
import { endPracticeSession } from "@/lib/practice-api";
import { clearLocalAppData } from "@/lib/consent";
import { LocaleSwitch, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/mehr")({
  component: MehrPage,
  head: () => ({ meta: [{ title: `Profil · ${BRAND.name}` }] }),
});

const GROUP_DEFS = [
  {
    titleKey: "mehr.group.app",
    links: [
      { to: "/akte", labelKey: "mehr.link.akte" },
      { to: "/scanner", labelKey: "mehr.link.scanner" },
      { to: "/vorschau", labelKey: "mehr.link.preview" },
      { to: "/assistent", labelKey: "mehr.link.assistant" },
      { to: "/ergebnisse", labelKey: "mehr.link.results" },
      { to: "/erinnerungen", labelKey: "mehr.link.reminders" },
      { to: "/installieren", labelKey: "mehr.link.install" },
      { to: "/koerper", labelKey: "mehr.link.body" },
      { to: "/pro", labelKey: "mehr.link.pro" },
      { to: "/praxis", labelKey: "mehr.link.praxis" },
      { to: "/kaeufe", labelKey: "mehr.link.purchases" },
    ],
  },
  {
    titleKey: "mehr.group.orient",
    links: [
      { to: "/wissen", labelKey: "mehr.link.wissen" },
      { to: "/preise", labelKey: "mehr.link.prices" },
      { to: "/zahlung", labelKey: "mehr.link.pay" },
      { to: "/anbieter", labelKey: "mehr.link.sites" },
      { to: "/risiken", labelKey: "mehr.link.risks" },
    ],
  },
  {
    titleKey: "mehr.group.data",
    links: [
      { to: "/einwilligungen", labelKey: "mehr.link.consents" },
      { to: "/pruefung", labelKey: "mehr.link.review" },
    ],
  },
  {
    titleKey: "mehr.group.legal",
    links: [
      { to: "/hinweise", labelKey: "mehr.link.medical" },
      { to: "/widerruf", labelKey: "mehr.link.withdraw" },
      { to: "/agb", labelKey: "mehr.link.terms" },
      { to: "/datenschutz", labelKey: "mehr.link.privacy" },
      { to: "/impressum", labelKey: "mehr.link.imprint" },
      { to: "/compliance", labelKey: "mehr.link.launch" },
    ],
  },
] as const;

function MehrPage() {
  const { user, isPending } = useCurrentUserState();
  const { t } = useI18n();
  return (
    <div className="fade-up space-y-8">
      <header className="flex flex-col items-center text-center">
        <ProfileAvatar
          src={BRAND.profile}
          className="size-28 shadow-[var(--shadow-border)] ring-2 ring-border md:size-32"
          alt={`${BRAND.name} ${t("mehr.title")}`}
        />
        <p className="kicker mt-5 text-primary">{BRAND.name}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("mehr.title")}</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          {t("mehr.lead")}
        </p>
      </header>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-xs font-medium tracking-kicker text-muted-foreground uppercase">
          {t("mehr.language")}
        </h2>
        <LocaleSwitch />
      </section>

      {isPending ? (
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <section className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
          <SignedIn>
            <p className="text-xs tracking-kicker text-muted-foreground uppercase">{t("mehr.account")}</p>
            <p className="font-medium">{user?.displayName ?? t("mehr.account")}</p>
            {user?.primaryEmail ? (
              <p className="text-sm text-muted-foreground">{user.primaryEmail}</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full rounded-xl"
              onClick={() => {
                sessionStorage.removeItem("eo-email-ok");
                void endPracticeSession()
                  .catch(() => undefined)
                  .then(() => signOut("/"));
              }}
            >
              {t("mehr.signOut")}
            </Button>
            <DeleteAccount />
          </SignedIn>
          <SignedOut>
            <p className="text-sm text-muted-foreground">
              {t("mehr.needAccount")}
            </p>
            <Button asChild className="min-h-12 w-full rounded-xl">
              <Link to="/login">{t("mehr.signIn")}</Link>
            </Button>
          </SignedOut>
        </section>
      )}

      {GROUP_DEFS.map((g) => (
        <section key={g.titleKey} className="space-y-3">
          <h2 className="px-1 text-xs font-medium tracking-kicker text-muted-foreground uppercase">
            {t(g.titleKey)}
          </h2>
          <ul className="divide-y divide-border rounded-2xl bg-card shadow-[var(--shadow-border)]">
            {g.links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex min-h-12 items-center justify-between px-4 text-sm font-medium"
                >
                  {t(l.labelKey)}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DeleteAccount() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useI18n();
  return (
    <div className="space-y-2 pt-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full rounded-xl"
        disabled={busy}
        onClick={() => {
          if (!window.confirm(t("mehr.delete"))) {
            return;
          }
          setBusy(true);
          setErr(null);
          void deleteMyAccount()
            .then(async () => {
              clearLocalAppData();
              await signOut("/");
            })
            .catch(() => {
              setErr(t("mehr.deleteFail"));
              setBusy(false);
            });
        }}
      >
        {t("mehr.deleteBtn")}
      </Button>
      <p className="text-xs text-muted-foreground">
        {t("mehr.deleteNote")}
      </p>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
