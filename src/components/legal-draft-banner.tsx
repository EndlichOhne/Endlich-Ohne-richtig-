import { useI18n } from "@/lib/i18n";

export function LegalDraftBanner() {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
        {t("legal.draft")}
      </p>
      <p className="text-xs text-muted-foreground">{t("legal.translationNote")}</p>
    </div>
  );
}