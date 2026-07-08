import { motion } from "framer-motion";
import { useReportMode } from "@/app/report-mode";
import type { WidgetProps } from "./types";
import type { PostType } from "@/domain/types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact } from "@/domain/analytics";
import { Skeleton, WidgetCard } from "@/design-system/primitives";
import { POST_TYPE_LABEL } from "./PostThumbnail";

const TYPE_ORDER: PostType[] = ["reel", "carousel", "image"];
const TYPE_COLOR: Record<PostType, string> = {
  reel: "var(--ds-accent)",
  carousel: "var(--ds-accent-soft)",
  image: "var(--ds-accent-faint)",
};

/**
 * Publishing chapter, part 3: what the account publishes.
 * One stacked share bar + quiet rows pairing quantity with response.
 */
export default function ContentTypeDistributionWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);
  const reportMode = useReportMode();

  if (!engine || !analytics) {
    return (
      <WidgetCard title="Content Type Distribution">
        <Skeleton className="h-32 w-full" />
      </WidgetCard>
    );
  }

  const { byTypeStats, count } = analytics.posts;
  const present = TYPE_ORDER.filter((t) => byTypeStats[t].count > 0);
  if (present.length === 0) {
    return (
      <WidgetCard title="Content Type Distribution" state="empty" emptyMessage="No posts in this period" />
    );
  }

  return (
    <WidgetCard
      title="Content Type Distribution"
      subtitle="What was published, and how each format performed"
    >
      {/* one stacked share bar */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {present.map((type) =>
          reportMode ? (
            <div
              key={type}
              className="h-full"
              style={{
                width: `${(byTypeStats[type].count / count) * 100}%`,
                background: TYPE_COLOR[type],
              }}
            />
          ) : (
            <motion.div
              key={type}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full origin-left"
              style={{
                width: `${(byTypeStats[type].count / count) * 100}%`,
                background: TYPE_COLOR[type],
              }}
            />
          ),
        )}
      </div>

      {/* quantity + response per format */}
      <div className="mt-5 space-y-2.5">
        {present.map((type) => {
          const s = byTypeStats[type];
          const share = Math.round((s.count / count) * 100);
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[type] }} />
              <span className="w-24 text-sm font-medium text-ink">{POST_TYPE_LABEL[type]}s</span>
              <span className="numeric w-20 text-sm text-ink-2">
                {s.count} · {share}%
              </span>
              <span className="numeric ml-auto text-sm text-ink-2">
                {s.avgEngagement !== undefined ? (
                  <>
                    <span className="font-semibold text-ink">{formatCompact(Math.round(s.avgEngagement))}</span>{" "}
                    avg engagement
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
