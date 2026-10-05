import { cn } from "@/lib/utils";
import { SmartImg } from "@/components/smart-img";

export function PhotoTile({
  img,
  webp,
  title,
  hint,
  className,
  imgClass,
}: {
  img: string;
  webp?: string;
  title: string;
  hint?: string;
  className?: string;
  imgClass?: string;
}) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-2xl bg-hero",
        className,
      )}
    >
      <SmartImg
        src={img}
        webp={webp}
        alt=""
        className={cn("h-44 w-full md:h-56", imgClass)}
        sizes="(min-width: 1024px) 18rem, (min-width: 768px) 22rem, 50vw"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-hero via-hero/40 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-3 text-hero-foreground">
        <span className="block text-sm font-medium">{title}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-hero-foreground/75">
            {hint}
          </span>
        ) : null}
      </span>
    </span>
  );
}
