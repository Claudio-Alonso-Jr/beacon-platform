import { useState } from "react";
import { cn } from "@/design-system/cn";

/**
 * Profile picture with the seeded-gradient initial as fallback —
 * used by the hero, the dashboard top bar, and the report cover.
 * Size and type scale come from className.
 */
export function Avatar({
  handle,
  hue,
  url,
  className,
}: {
  handle: string;
  hue?: number;
  url?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = url !== undefined && !failed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        className,
      )}
      style={
        hue !== undefined
          ? {
              background: `linear-gradient(140deg,
                hsl(${hue} 55% 55%),
                hsl(${(hue + 45) % 360} 60% 42%))`,
            }
          : { background: "var(--ds-surface-2)" }
      }
    >
      {handle.charAt(0).toUpperCase()}
      {showImage && (
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}
