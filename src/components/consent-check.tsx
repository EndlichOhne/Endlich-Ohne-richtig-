import { cn } from "@/lib/utils";

export function ConsentCheck({
  id,
  checked,
  onChange,
  label,
  hint,
  required,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-primary"
        required={required}
      />
      <span>
        <span className="block text-sm font-medium leading-snug">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </span>
        {hint ? (
          <span className={cn("mt-1 block text-xs text-muted-foreground")}>
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}
