import type { ErrorComponentProps } from "@tanstack/react-router";
import { AppError } from "@/components/app-error";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return <AppError error={error} reset={reset} />;
}
