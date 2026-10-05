import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const MEDICAL_DISCLAIMER =
  "Diese App dient ausschließlich der allgemeinen Information und Orientierung. Sie ersetzt keine ärztliche Untersuchung, professionelle Beratung oder individuelle Behandlungsempfehlung. Angaben zu Kosten, Sitzungsanzahl und Behandlungserfolg sind unverbindliche Richtwerte und können individuell erheblich abweichen. Vorher-/Nachher-Bilder sind keine typischen Ergebnisse und keine Garantie.";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <p
      className={cn(
        "text-muted-foreground",
        compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed",
      )}
    >
      {t("disclaimer.full")}
    </p>
  );
}