import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandFilm } from "@/components/brand-film";
import { useI18n } from "@/lib/i18n";

export function PreviewPromo() {
  const { t } = useI18n();
  return (
    <section className="overflow-hidden rounded-2xl bg-hero text-hero-foreground shadow-[var(--shadow-border)]">
      <div className="grid md:grid-cols-2">
        <BrandFilm
          variant="card"
          className="h-52 min-h-0 rounded-none md:h-full md:min-h-[18rem]"
          innerClassName="justify-end"
        />
        <div className="flex flex-col justify-center p-5 md:p-8">
          <p className="kicker text-accent">{t("home.previewKicker")}</p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl">{t("home.previewTitle")}</h2>
          <p className="mt-2 text-sm text-hero-foreground/75">{t("home.previewLead")}</p>
          <Button asChild className="mt-5 min-h-12 w-full rounded-xl sm:w-auto">
            <Link to="/vorschau">{t("home.previewCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
