import { motion } from "framer-motion";
import { useReportMode } from "@/app/report-mode";
import type { WidgetProps } from "./types";
import type { PostType } from "@/domain/types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact } from "@/domain/analytics";
import { Skeleton, WidgetCard } from "@/design-system/primitives";
import { POST_TYPE_LABEL } from "./PostThumbnail";

const TYPE_ORDER: PostType[] = ["reel", "carousel", "image"];

/**
 * Engagement chapter, part 3: which formats the audience responds to.
 * Comparison cards with a single relative bar each — engine numbers only.
 */
export default function EngagementByTypeWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);
  const reportMode = useReportMode();

  if (!engine || !analytics) {
    return (
      <WidgetCard title="Engagement by Content Type">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-card" />
          ))}
        </div>
      </WidgetCard>
    );
  }

  const stats = analytics.posts.byTypeStats;
  const present = TYPE_ORDER.filter((t) => stats[t].count > 0);
  if (present.length === 0) {
    return (
      <WidgetCard title="Engagement by Content Type" state="empty" emptyMessage="No posts in this period" />
    );
  }

  const maxAvg = Math.max(...present.map((t) => stats[t].avgEngagement ?? 0));

  return (
    <WidgetCard
      title="Engagement by Content Type"
      subtitle="Average interactions per post, by format"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {present.map((type) => {
          const s = stats[type];
          const share = maxAvg > 0 ? (s.avgEngagement ?? 0) / maxAvg : 0;
          const leading = share === 1 && present.length > 1;
          return (
            <div key={type} className="rounded-card bg-surface-2/60 p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-ink">{plural(type)}</p>
                <p className="text-xs text-ink-3">
                  {s.count} post{s.count === 1 ? "" : "s"}
                </p>
              </div>

              <p className="kpi-value mt-3 text-[26px] font-semibold leading-none">
                {s.avgEngagement !== undefined ? formatCompact(Math.round(s.avgEngagement)) : "—"}
              </p>
              <p className="mt-1 text-xs text-ink-2">avg engagement / post</p>

              {/* single relative bar — the comparison at a glance */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                {reportMode ? (
                  <div
                    style={{ width: `${Math.max(share * 100, 3)}%` }}
                    className={leading ? "h-full rounded-full bg-accent" : "h-full rounded-full bg-accent-faint"}
                  />
                ) : (
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max(share * 100, 3)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={leading ? "h-full rounded-full bg-accent" : "h-full rounded-full bg-accent-faint"}
                  />
                )}
              </div>

              <dl className="mt-4 space-y-1.5">
                <Row label="Avg likes" value={s.avgLikes} />
                <Row label="Avg comments" value={s.avgComments} />
                <Row
                  label="Avg views"
                  value={s.avgViews}
                  unavailable={type !== "reel" ? "n/a" : undefined}
                />
              </dl>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

function Row({
  label,
  value,
  unavailable,
}: {
  label: string;
  value: number | undefined;
  unavailable?: string;
}) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <dt className="text-ink-2">{label}</dt>
      <dd className="numeric font-medium text-ink">
        {value !== undefined ? (
          formatCompact(Math.round(value))
        ) : (
          <span className="font-normal text-ink-3">{unavailable ?? "—"}</span>
        )}
      </dd>
    </div>
  );
}

function plural(type: PostType): string {
  return `${POST_TYPE_LABEL[type]}s`;
}
