import { useState } from "react";
import type { PostType } from "@/domain/types";
import { CarouselIcon, ImageIcon, PlayIcon } from "@/design-system/primitives";
import { cn } from "@/design-system/cn";

/**
 * Post artwork: the provider's real thumbnail when available, with the
 * seeded gradient as mock artwork and load-error fallback.
 */
export function PostThumbnail({
  hue,
  type,
  url,
  className,
}: {
  hue: number;
  type: PostType;
  url?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = type === "reel" ? PlayIcon : type === "carousel" ? CarouselIcon : ImageIcon;
  return (
    <div
      className={cn("relative overflow-hidden rounded-card", className)}
      style={{
        background: `linear-gradient(150deg,
          hsl(${hue} 42% 72%) 0%,
          hsl(${(hue + 40) % 360} 45% 52%) 100%)`,
      }}
    >
      {url !== undefined && !failed && (
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <Icon size={18} className="absolute right-2.5 top-2.5 z-10 text-white/90 drop-shadow" />
    </div>
  );
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  reel: "Reel",
  carousel: "Carousel",
  image: "Image",
};
