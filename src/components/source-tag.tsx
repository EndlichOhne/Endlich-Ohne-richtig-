import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const KEYS = {
  allgemein: "tag.allgemein",
  algorithmisch: "tag.algorithmisch",
  ki: "tag.ki",
  anbieter: "tag.anbieter",
  nutzer: "tag.nutzer",
  briefing: "tag.briefing",
  werbung: "tag.werbung",
  demo: "tag.demo",
} as const;

export function SourceTag({
  kind,
  className,
}: {
  kind: keyof typeof KEYS;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {t(KEYS[kind])}
    </span>
  );
}