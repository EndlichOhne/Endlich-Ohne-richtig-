import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getEmailStatus } from "@/lib/verify-api";
import { useI18n } from "@/lib/i18n";

export function RequireAuth({
  children,
  needVerified = true,
}: {
  children: ReactNode;
  needVerified?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [gate, setGate] = useState<"load" | "ok" | "need">(
    needVerified ? "load" : "ok",
  );

  useEffect(() => {
    if (!needVerified) {
      setGate("ok");
      return;
    }
    if (isPending) return;
    if (!user) {
      setGate("ok");
      return;
    }
    if (user.isDevFallback) {
      setGate("ok");
      return;
    }
    if (sessionStorage.getItem("eo-email-ok") === user.id) {
      setGate("ok");
      return;
    }
    let live = true;
    void getEmailStatus()
      .then((s) => {
        if (!live) return;
        if (s.verified) {
          sessionStorage.setItem("eo-email-ok", user.id);
          setGate("ok");
        } else {
          setGate("need");
          void navigate({ to: "/bestaetigen" });
        }
      })
      .catch(() => {
        if (live) setGate("ok");
      });
    return () => {
      live = false;
    };
  }, [isPending, needVerified, user, navigate]);

  if (isPending || (needVerified && gate === "load" && user)) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (needVerified && gate === "need") {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  return <>{children}</>;
}

export function AuthCallout() {
  const { t } = useI18n();
  return (
    <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
      {t("auth.callout")}{" "}
      <Link to="/login" className="font-medium text-primary underline">
        {t("auth.signIn")}
      </Link>
    </p>
  );
}
