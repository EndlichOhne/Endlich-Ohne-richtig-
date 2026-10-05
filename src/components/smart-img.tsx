import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  webp?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
};

export function SmartImg({
  src,
  webp,
  alt,
  className,
  sizes = "(min-width: 1024px) 36rem, 100vw",
  priority = false,
  width,
  height,
}: Props) {
  const [failed, setFailed] = useState(false);
  const img = (
    <img
      src={failed ? "" : src}
      alt={alt}
      width={width}
      height={height}
      className={cn("bg-hero object-cover", failed && "opacity-0", className)}
      sizes={sizes}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );

  if (!webp) return img;

  return (
    <picture className="contents">
      <source srcSet={webp} type="image/webp" />
      {img}
    </picture>
  );
}

export function HeroPhoto({ className }: { className?: string }) {
  return (
    <picture className="absolute inset-0 block size-full">
      <source
        media="(max-width: 640px)"
        srcSet="/images/hero-mobile.webp"
        type="image/webp"
      />
      <source
        media="(min-width: 1440px)"
        srcSet="/images/kaiserstrasse-hq.webp"
        type="image/webp"
      />
      <img
        src="/images/hero.webp"
        alt=""
        width={1600}
        height={2000}
        className={cn("size-full bg-hero object-cover", className)}
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </picture>
  );
}
