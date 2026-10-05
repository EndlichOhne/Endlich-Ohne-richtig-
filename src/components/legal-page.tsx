import type { ReactNode } from "react";
import { LegalDraftBanner } from "@/components/legal-draft-banner";

export function LegalPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="fade-up space-y-6 pb-4">
      <p className="kicker text-primary">{kicker}</p>
      <h1 className="font-display text-4xl">{title}</h1>
      <LegalDraftBanner />
      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </article>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function H({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 font-display text-2xl">{children}</h2>;
}
