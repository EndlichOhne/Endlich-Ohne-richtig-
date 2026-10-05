import { createFileRoute } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { LegalDraftBanner } from "@/components/legal-draft-banner";
import { PageIntro } from "@/components/page-intro";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/hinweise")({
  component: HinweisePage,
  head: () => ({ meta: [{ title: "Avvertenze · ENDLICH OHNE" }] }),
});

function HinweisePage() {
  const { t } = useI18n();
  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="ENDLICH OHNE" title={t("legal.notes")}>
        {t("notes.lead")}
      </PageIntro>
      <LegalDraftBanner />
      <Disclaimer />
    </div>
  );
}
