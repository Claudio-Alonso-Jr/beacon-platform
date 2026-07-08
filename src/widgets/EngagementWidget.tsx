import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WidgetProps } from "./types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact, formatDate, formatDateLong, type EngagementTrendPoint } from "@/domain/analytics";
import { SegmentedControl, Skeleton, WidgetCard } from "@/design-system/primitives";

/**
 * Engagement chapter, part 2: ONE clear chart. A quiet metric switcher
 * replaces chart clutter — each metric answers the same question from a
 * different angle. Data comes bucketed from PeriodAnalytics.trend.
 */

type Metric = "engagement" | "likes" | "comments" | "views" | "rate";

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "engagement", label: "Engagement" },
  { value: "likes", label: "Likes" },
  { value: "comments", label: "Comments" },
  { value: "views", label: "Views" },
  { value: "rate", label: "Eng. Rate" },
];

function metricValue(point: EngagementTrendPoint, metric: Metric): number | undefined {
  switch (metric) {
    case "engagement": return point.avgEngagement;
    case "likes": return point.avgLikes;
    case "comments": return point.avgComments;
    case "views": return point.avgViews;
    case "rate": return point.engagementRate;
  }
}

export default function EngagementWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);
  const [metric, setMetric] = useState<Metric>("engagement");

  const options = useMemo(
    () => METRIC_OPTIONS.filter((o) => o.value !== "views" || engine?.has("views")),
    [engine],
  );

  if (!engine || !analytics) {
    return (
      <WidgetCard title="Engagement Trend">
        <Skeleton className="h-[320px] w-full" />
      </WidgetCard>
    );
  }

  const trend = analytics.posts.trend;
  if (trend.length === 0) {
    return (
      <WidgetCard title="Engagement Trend" state="empty" emptyMessage="No posts in this period" />
    );
  }

  const data = trend.map((p) => ({ ...p, value: metricValue(p, metric) ?? null }));
  const isRate = metric === "rate";
  const bucketNote = analytics.days > 45 ? "weekly averages" : "daily averages";

  return (
    <WidgetCard
      title="Engagement Trend"
      subtitle={`Per-post ${bucketNote} across the period`}
      action={
        <SegmentedControl
          aria-label="Trend metric"
          options={options}
          value={metric}
          onChange={setMetric}
        />
      }
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--ds-hairline)" strokeDasharray="3 5" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              ticks={sparseTicks(data.map((d) => d.date))}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--ds-ink-3)", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              tickFormatter={(v: number) => (isRate ? `${v.toFixed(1)}%` : formatCompact(v))}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--ds-ink-3)", fontSize: 12 }}
              width={52}
              tickCount={4}
            />
            <Tooltip
              content={<TrendTooltip isRate={isRate} />}
              cursor={{ stroke: "var(--ds-ink-3)", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--ds-accent)"
              strokeWidth={2}
              fill="url(#engagementFill)"
              connectNulls
              dot={{ r: 2.5, fill: "var(--ds-accent)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}

function sparseTicks(dates: string[]): string[] {
  if (dates.length < 3) return dates;
  return [dates[0]!, dates[Math.floor(dates.length / 2)]!, dates[dates.length - 1]!];
}

interface TooltipEntry {
  value?: number | string;
  payload?: { posts?: number };
}

function TrendTooltip({
  active,
  payload,
  label,
  isRate,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  isRate: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]!;
  const value = typeof entry.value === "number" ? entry.value : undefined;
  const posts = entry.payload?.posts;

  return (
    <div className="rounded-control bg-surface px-3.5 py-2.5 shadow-overlay">
      <p className="text-xs text-ink-3">{label ? formatDateLong(label) : ""}</p>
      {value !== undefined && (
        <p className="numeric mt-1 text-sm font-semibold text-ink">
          {isRate ? `${value.toFixed(2)}%` : formatCompact(Math.round(value))}
        </p>
      )}
      {posts !== undefined && (
        <p className="mt-0.5 text-xs text-ink-2">
          {posts} post{posts === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
