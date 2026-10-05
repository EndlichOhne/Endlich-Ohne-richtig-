import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function PracticeNav({ role }: { role: string }) {
  const links = [
    ["/praxis", "Heute"],
    ["/praxis/kalender", "Kalender"],
    ["/praxis/zahlungen", "Zahlungen"],
  ];
  if (role === "admin") links.push(["/praxis/verwaltung", "Verwaltung"]);
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 text-sm">
      {links.map(([to, label]) => (
        <Link
          key={to}
          to={to}
          className="shrink-0 rounded-full bg-muted px-3 py-2"
          activeProps={{ className: "shrink-0 rounded-full bg-primary px-3 py-2 text-primary-foreground" }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function DeskMessage({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Wird geladen.</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (empty) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return <>{children}</>;
}
