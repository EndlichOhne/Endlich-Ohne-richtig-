import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandFilm } from "@/components/brand-film";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getProStatus } from "@/lib/pro-api";
import { PRO_PRICE_LABEL, PRO_TEASER_KEY } from "@/lib/pro";
import { useI18n } from "@/lib/i18n";

export function ProTeaser() {
  const { user, isPending } = useCurrentUserState();
  const { t } = useI18n();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (typeof window !== "undefined" && localStorage.getItem(PRO_TEASER_KEY) === "1") {
      setHidden(true);
      return;
    }
    if (!user) {
      setHidden(false);
      return;
    }
    void getProStatus()
      .then((s) => setHidden(s.isPro))
      .catch(() => setHidden(false));
  }, [user, isPending]);

  if (hidden) return null;

  function dismiss() {
    localStorage.setItem(PRO_TEASER_KEY, "1");
    setHidden(true);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
      <BrandFilm variant="strip" className="rounded-none" />
      <button
        type="button"
        className="absolute right-2 top-2 z-10 inline-flex size-11 items-center justify-center rounded-full text-hero-foreground"
        aria-label={t("pro.teaserClose")}
        onClick={dismiss}
      >
        <X className="size-4" />
      </button>
      <div className="p-5 pr-14">
        <p className="kicker text-primary">PRO</p>
        <h2 className="mt-2 font-display text-xl md:text-2xl">{t("pro.teaserTitle")}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("pro.teaserBody", { price: PRO_PRICE_LABEL })}
        </p>
        <Button asChild variant="outline" className="mt-4 min-h-11 rounded-xl">
          <Link to="/pro">{t("pro.teaserCta")}</Link>
        </Button>
      </div>
    </section>
  );
}
