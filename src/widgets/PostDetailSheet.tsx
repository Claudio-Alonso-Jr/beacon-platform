import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Post } from "@/domain/types";
import type { CapabilityEngine } from "@/domain/capabilities";
import {
  contextForPost,
  formatCompact,
  formatDateLong,
  type PostAnalytics,
} from "@/domain/analytics";
import {
  CloseIcon,
  CommentIcon,
  EyeIcon,
  HeartIcon,
  LockIcon,
  TrendBadge,
} from "@/design-system/primitives";
import { PostThumbnail, POST_TYPE_LABEL } from "./PostThumbnail";
import { BandChip } from "./BandChip";

interface PostDetailSheetProps {
  post: Post | null;
  onClose: () => void;
  engine: CapabilityEngine;
  /** Period analytics from the engine — the sheet renders, never calculates. */
  postAnalytics: PostAnalytics;
}

/**
 * Side panel opened from the gallery and rankings (§2.1 step 6). The
 * "Performance in period" block renders the engine's PostContext: rank,
 * percentile, band, and objective comparisons.
 */
export function PostDetailSheet({ post, onClose, engine, postAnalytics }: PostDetailSheetProps) {
  const context = post ? contextForPost(postAnalytics, post.id) : undefined;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // lock background scroll while the sheet is open
  useEffect(() => {
    if (!post) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [post]);

  return (
    <AnimatePresence>
      {post && (
        <>
          <motion.button
            aria-label="Close details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-label="Post details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col overflow-y-auto bg-surface p-6 shadow-overlay md:p-8"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {POST_TYPE_LABEL[post.type]}
                  {context?.bestOfType && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
                      Best {POST_TYPE_LABEL[post.type]}
                    </span>
                  )}
                </p>
                <p className="text-[13px] text-ink-3">{formatDateLong(post.postedAt)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-control text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <CloseIcon size={17} />
              </button>
            </div>

            <PostThumbnail
              hue={post.thumbnailHue}
              type={post.type}
              url={post.thumbnailUrl}
              className="aspect-square w-full"
            />

            <p className="mt-5 text-[15px] leading-relaxed text-ink">{post.caption}</p>

            {post.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* metrics — absent metrics show an honest em dash */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <SheetMetric icon={<HeartIcon size={15} />} label="Likes" value={post.metrics.likes?.value} />
              <SheetMetric icon={<CommentIcon size={15} />} label="Comments" value={post.metrics.comments?.value} />
              <SheetMetric
                icon={<EyeIcon size={15} />}
                label="Views"
                value={post.metrics.views?.value}
                unavailableHint={post.type === "reel" ? undefined : "Images & carousels don't expose views"}
              />
            </div>

            {/* full-metrics row — locked elegantly when public data */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <SheetMetric label="Reach" value={post.metrics.reach?.value} locked={engine.metricState("reach") === "locked"} />
              <SheetMetric label="Saves" value={post.metrics.saves?.value} locked={engine.metricState("saves") === "locked"} />
              <SheetMetric label="Shares" value={post.metrics.shares?.value} locked={engine.metricState("shares") === "locked"} />
            </div>

            {/* performance in period — the engine's PostContext, rendered */}
            {context && (
              <div className="mt-7">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">
                  Performance in period
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <span className="numeric rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink">
                    #{context.rank} of {context.of}
                  </span>
                  <span className="numeric rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2">
                    {ordinal(context.percentile)} percentile
                  </span>
                  <BandChip band={context.band} />
                </div>
                <div className="mt-3.5 space-y-1.5">
                  <ComparisonRow label="vs profile average" value={context.vsProfileAvg} />
                  <ComparisonRow
                    label={`vs ${POST_TYPE_LABEL[post.type].toLowerCase()} average`}
                    value={context.vsTypeAvg}
                  />
                </div>
              </div>
            )}

            <div className="flex-1" />

            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-control bg-surface-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Open on Instagram ↗
            </a>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SheetMetric({
  icon,
  label,
  value,
  locked = false,
  unavailableHint,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | undefined;
  locked?: boolean;
  unavailableHint?: string;
}) {
  return (
    <div className="rounded-control bg-surface-2 px-3 py-2.5">
      <p className="flex items-center gap-1 text-xs text-ink-2">
        {icon} {label} {locked && <LockIcon size={11} className="text-ink-3" />}
      </p>
      <p className="numeric mt-1 text-[15px] font-semibold text-ink" title={unavailableHint}>
        {locked ? <span className="text-[13px] font-normal text-ink-3">Business only</span> : value !== undefined ? formatCompact(value) : "—"}
      </p>
    </div>
  );
}

function ComparisonRow({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-2">{label}</span>
      <TrendBadge value={Math.round(value * 10) / 10} />
    </div>
  );
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}
