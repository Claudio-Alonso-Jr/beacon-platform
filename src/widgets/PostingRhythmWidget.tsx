import { motion } from "framer-motion";
import { useReportMode } from "@/app/report-mode";
import type { WidgetProps } from "./types";
import { useAnalytics } from "@/data/useAnalytics";
import { Skeleton, WidgetCard } from "@/design-system/primitives";

/**
 * Publishing chapter, part 4: rhythm. Posts per week as quiet bars,
 * described by facts — active weeks, busiest week, longest gap.
 * Objective language only; the reader draws the conclusion.
 */
export default function PostingRhythmWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);
  const reportMode = useReportMode();

  if (!engine || !analytics) {
    return (
      <WidgetCard title="Posting Rhythm">
        <Skeleton className="h-40 w-full" />
      </WidgetCard>
    );
  }

  const pub = analytics.publishing;
  if (analytics.posts.count === 0) {
    return (
      <WidgetCard title="Posting Rhythm" state="empty" emptyMessage="No posts in this period" />
    );
  }

  const max = Math.max(pub.busiestWeekPosts, 1);
  const facts = [
    `Posted in ${pub.activeWeeks} of ${pub.totalWeeks} weeks`,
    `busiest week ${pub.busiestWeekPosts} post${pub.busiestWeekPosts === 1 ? "" : "s"}`,
    pub.longestGapDays !== undefined
      ? `longest gap ${pub.longestGapDays} day${pub.longestGapDays === 1 ? "" : "s"}`
      : undefined,
  ].filter(Boolean);

  return (
    <WidgetCard title="Posting Rhythm" subtitle="Posts per week across the period">
      <div className="flex h-36 items-end gap-1.5">
        {pub.weeklyCounts.map((week, i) => {
          const height = `${Math.max((week.posts / max) * 100, week.posts > 0 ? 8 : 3)}%`;
          const title = `Week of ${week.label} — ${week.posts} post${week.posts === 1 ? "" : "s"}`;
          const className =
            week.posts > 0
              ? "min-w-1.5 flex-1 rounded-t-[3px] bg-accent/80"
              : "min-w-1.5 flex-1 rounded-t-[3px] bg-surface-2";
          return reportMode ? (
            <div key={week.weekStart} style={{ height }} title={title} className={className} />
          ) : (
            <motion.div
              key={week.weekStart}
              initial={{ height: 0 }}
              whileInView={{ height }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.015, 0.4), ease: "easeOut" }}
              title={title}
              className={className}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-3">
        <span>{pub.weeklyCounts[0]?.label}</span>
        <span>{pub.weeklyCounts[pub.weeklyCounts.length - 1]?.label}</span>
      </div>

      <p className="numeric mt-4 text-[13px] text-ink-2">{facts.join(" · ")}</p>
    </WidgetCard>
  );
}
