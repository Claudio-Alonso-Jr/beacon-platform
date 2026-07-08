import type { PostType } from "@/domain/types";
import { CarouselIcon, ImageIcon, PlayIcon } from "@/design-system/primitives";
import { cn } from "@/design-system/cn";

/**
 * Seeded-gradient thumbnail treatment for dev/mock data; live providers
 * replace the gradient with a cached image, the frame stays identical.
 */
export function PostThumbnail({
  hue,
  type,
  className,
}: {
  hue: number;
  type: PostType;
  className?: string;
}) {
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
      <Icon size={18} className="absolute right-2.5 top-2.5 text-white/90 drop-shadow" />
    </div>
  );
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  reel: "Reel",
  carousel: "Carousel",
  image: "Image",
};
