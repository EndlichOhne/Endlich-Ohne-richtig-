import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  children,
  tag,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
  tag?: ReactNode;
}) {
  return (
    <div>
      {tag}
      {kicker ? <p className="kicker mt-3 text-primary">{kicker}</p> : null}
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{title}</h1>
      {children ? (
        <div className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {children}
        </div>
      ) : null}
    </div>
  );
}
