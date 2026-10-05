import { DEPOSIT_PERCENT, euro, splitAmount } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function DepositSplit({
  totalCents,
  compact,
}: {
  totalCents: number;
  compact?: boolean;
}) {
  const { depositCents, restCents } = splitAmount(totalCents);
  return (
    <div
      className={cn(
        "rounded-2xl bg-card shadow-[var(--shadow-border)]",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <span className="w-1/4 bg-primary" />
      </div>
      <dl className={cn("grid grid-cols-2 gap-3", compact ? "mt-3" : "mt-4")}>
        <div>
          <dt className="kicker text-primary">Jetzt {DEPOSIT_PERCENT} %</dt>
          <dd className="mt-1 font-display text-2xl tabular-nums">
            {euro(depositCents)}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">Anzahlung</dd>
        </div>
        <div>
          <dt className="kicker text-muted-foreground">Vor Ort {100 - DEPOSIT_PERCENT} %</dt>
          <dd className="mt-1 font-display text-2xl tabular-nums text-muted-foreground">
            {euro(restCents)}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">Rest bei der Sitzung</dd>
        </div>
      </dl>
      {!compact ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Sitzungsrichtwert {euro(totalCents)}. Unverbindlich, kein Angebot.
        </p>
      ) : null}
    </div>
  );
}
