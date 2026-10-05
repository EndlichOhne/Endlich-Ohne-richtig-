import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function KiStatus({
  online,
  className,
}: {
  online: boolean | null;
  className?: string;
}) {
  const { t } = useI18n();
  if (online === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        <span className="size-2 rounded-full bg-border" />
        {t("ki.checking")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-border)]",
        online ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          online ? "bg-accent animate-pulse" : "bg-muted-foreground",
        )}
      />
      {online ? t("ki.online") : t("ki.guide")}
    </span>
  );
}