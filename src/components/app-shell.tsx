import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Calendar, Home, Phone, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { InstallBanner } from "@/components/install-banner";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";

const NAV = [
  { to: "/", key: "nav.home" as const, icon: Home },
  { to: "/akte", key: "nav.file" as const, icon: BookOpen },
  { to: "/check", key: "nav.check" as const, icon: ScanSearch },
  { to: "/planer", key: "nav.appointments" as const, icon: Calendar },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  const home = pathname === "/";
  const mehrActive = pathname === "/mehr" || pathname.startsWith("/mehr/");

  return (
    <div className="app-frame">
      {!home ? (
        <header className="safe-top sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-5 md:px-8">
          <Link to="/" className="flex min-h-11 items-center">
            <img
              src="/brand/logo.webp"
              alt="ENDLICH OHNE"
              className="h-7 w-auto"
              width={340}
              height={124}
              decoding="async"
            />
          </Link>
          <div className="flex items-center gap-1">
            <AuthChip />
            <a
              href={BRAND.phoneHref}
              className="inline-flex size-11 items-center justify-center rounded-full text-primary"
              aria-label={t("nav.call", { phone: BRAND.phoneDisplay })}
            >
              <Phone className="size-5" />
            </a>
          </div>
        </header>
      ) : null}
      <main className={cn("page flex-1", home ? "px-0 pt-0" : "page-pad pt-5")}>
        {children}
      </main>
      <InstallBanner />
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"
        aria-label={t("nav.main")}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1 nav-safe lg:max-w-3xl">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute top-0 h-0.5 w-6 rounded-full bg-primary" />
                  ) : null}
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              to="/mehr"
              aria-current={mehrActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                mehrActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {mehrActive ? (
                <span className="absolute top-0 h-0.5 w-6 rounded-full bg-primary" />
              ) : null}
              <ProfileAvatar
                className={cn(
                  "size-5",
                  mehrActive ? "ring-1 ring-primary" : "",
                )}
                alt=""
              />
              {t("nav.more")}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  const { t } = useI18n();
  if (isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-muted" />;
  }
  return (
    <>
      <SignedIn>
        <Link
          to="/mehr"
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-primary"
        >
          {user?.displayName?.split(" ")[0] ?? t("nav.account")}
        </Link>
      </SignedIn>
      <SignedOut>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-primary"
        >
          {t("nav.signIn")}
        </Link>
      </SignedOut>
    </>
  );
}
