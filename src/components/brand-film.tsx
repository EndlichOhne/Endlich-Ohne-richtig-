import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "hero" | "card" | "strip";

export function BrandFilm({
  className,
  innerClassName,
  children,
  showMark = true,
  variant = "hero",
  priority = false,
}: {
  className?: string;
  innerClassName?: string;
  children?: ReactNode;
  showMark?: boolean;
  variant?: Variant;
  priority?: boolean;
}) {
  const card = variant === "card";
  return (
    <section className={cn("brand-film", variant === "strip" && "brand-film--strip", className)}>
      <picture className="brand-film-pic">
        {card ? (
          <source srcSet="/images/brand-film-card.webp" type="image/webp" />
        ) : (
          <source
            media="(max-width: 640px)"
            srcSet="/images/brand-film-mobile.webp"
            type="image/webp"
          />
        )}
        <source media="(min-width: 1440px)" srcSet="/images/brand-film-4k.webp" type="image/webp" />
        <img
          src={card ? "/images/brand-film-card.webp" : "/images/brand-film.webp"}
          alt=""
          width={card ? 1600 : 1920}
          height={card ? 1067 : 1080}
          className="brand-film-media"
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
        />
      </picture>
      <div className="brand-film-veil" aria-hidden />
      <div className={cn("brand-film-inner", innerClassName)}>
        {showMark ? (
          <img
            src="/brand/logo-white.svg"
            alt="ENDLICH OHNE"
            className="brand-film-mark"
            width={170}
            height={62}
          />
        ) : null}
        {children}
      </div>
    </section>
  );
}
