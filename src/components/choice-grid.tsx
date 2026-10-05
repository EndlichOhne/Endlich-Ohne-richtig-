import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChoiceGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

export function Choice({
  selected,
  children,
  onClick,
  disabled,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "min-h-12 rounded-xl bg-card px-4 py-3 text-left text-sm font-medium shadow-[var(--shadow-border)] transition-[transform,background-color,box-shadow] duration-150 ease-out active:not-disabled:scale-[0.96]",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        !selected && "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
