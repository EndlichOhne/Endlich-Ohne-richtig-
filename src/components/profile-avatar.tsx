import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export function ProfileAvatar({
  className,
  alt = BRAND.name,
  src = BRAND.avatar,
}: {
  className?: string;
  alt?: string;
  src?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={128}
      height={128}
      className={cn("rounded-full bg-primary object-cover", className)}
      draggable={false}
      decoding="async"
    />
  );
}
