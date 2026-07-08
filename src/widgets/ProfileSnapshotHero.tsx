import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSnapshot } from "@/data/useSnapshot";
import { formatDateLong, formatFull, formatCompact } from "@/domain/analytics";
import { Skeleton, VerifiedIcon } from "@/design-system/primitives";

/**
 * The cover page of the report (§ Phase 4 brief): identity before analytics.
 * Elegant, spacious, never a form. Renders immediately; numbers count up
 * once real data arrives — nothing is ever fabricated.
 */
export function ProfileSnapshotHero({ handle }: { handle: string }) {
  const { snapshot } = useSnapshot(handle);
  const profile = snapshot?.profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-card p-8 shadow-card md:p-12"
      style={{
        background:
          "linear-gradient(135deg, var(--ds-accent-wash) 0%, var(--ds-surface) 55%)",
        backgroundColor: "var(--ds-surface)",
      }}
    >
      <div className="flex items-start gap-5 md:items-center md:gap-7">
        {/* profile picture — seeded gradient treatment in dev; photo with live data */}
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-card md:size-24 md:text-4xl"
          style={
            profile
              ? {
                  background: `linear-gradient(140deg,
                    hsl(${profile.avatarHue} 55% 55%),
                    hsl(${(profile.avatarHue + 45) % 360} 60% 42%))`,
                }
              : { background: "var(--ds-surface-2)" }
          }
        >
          {handle.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          {profile ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] md:text-[28px]">
                <span className="truncate">{profile.displayName}</span>
                {profile.isVerified && (
                  <VerifiedIcon size={20} className="shrink-0 text-accent" aria-label="Verified" />
                )}
              </p>
              <p className="mt-0.5 text-sm text-ink-2">
                @{profile.handle}
                {profile.category && <> · {profile.category}</>}
              </p>
              <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink">
                {profile.bio}
              </p>
              {profile.website && (
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-sm font-medium text-accent hover:underline"
                >
                  {profile.website} ↗
                </a>
              )}
            </motion.div>
          ) : (
            <div>
              <Skeleton className="h-6 w-44" />
              <Skeleton className="mt-2 h-4 w-32" />
              <Skeleton className="mt-3 h-4 w-64" />
            </div>
          )}
        </div>
      </div>

      {/* the three account totals — large, quiet, tabular */}
      <div className="mt-9 flex flex-wrap gap-x-10 gap-y-6 md:mt-12 md:gap-x-16">
        <HeroStat label="Followers" value={snapshot?.totals.followers} compactAbove={100_000} />
        <HeroStat label="Following" value={snapshot?.totals.following} />
        <HeroStat label="Posts" value={snapshot?.totals.posts} />
      </div>

      <div className="mt-7 flex items-center justify-end gap-1.5 text-[13px] text-ink-3">
        {snapshot ? (
          <>
            Analyzed {formatDateLong(snapshot.capturedAt)} ·{" "}
            {snapshot.provider === "graph_api" ? "Business account data" : "public data"}
          </>
        ) : (
          <Skeleton className="h-3.5 w-44" />
        )}
      </div>
    </motion.div>
  );
}

function HeroStat({
  label,
  value,
  compactAbove = Infinity,
}: {
  label: string;
  value: number | undefined;
  compactAbove?: number;
}) {
  const animated = useCountUp(value);
  return (
    <div>
      {value === undefined || animated === undefined ? (
        <Skeleton className="h-8 w-20 md:h-10 md:w-24" />
      ) : (
        <p className="kpi-value text-[28px] font-semibold leading-none md:text-[38px]">
          {animated >= compactAbove ? formatCompact(animated) : formatFull(animated)}
        </p>
      )}
      <p className="mt-2 text-sm text-ink-2">{label}</p>
    </div>
  );
}

/** 700ms ease-out count-up; returns undefined until a target exists. */
function useCountUp(target: number | undefined, duration = 700): number | undefined {
  const [value, setValue] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (target === undefined) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
