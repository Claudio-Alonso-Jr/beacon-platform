import type { WidgetProps } from "./types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact, percentChange } from "@/domain/analytics";
import { KpiCard, Skeleton } from "@/design-system/primitives";

/**
 * Engagement chapter, part 1: the three numbers that answer "how is the
 * audience responding?" — all straight from PeriodAnalytics.
 */
export default function EngagementOverviewWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);

  if (!engine || !analytics) return <OverviewSkeleton />;

  const { posts, previous } = analytics;
  const state = engine.metricState("engagement");
  const basisNote =
    posts.engagementBasis === "full"
      ? "Full basis: likes + comments + saves + shares"
      : "Public basis: likes + comments";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        hero
        label="Engagement Rate"
        state={posts.engagementRate !== undefined ? state : "locked"}
        value={posts.engagementRate !== undefined ? `${posts.engagementRate.toFixed(2)}%` : undefined}
        delta={round1(percentChange(posts.engagementRate, previous?.engagementRate))}
        note={posts.engagementRate !== undefined ? basisNote : undefined}
      />
      <KpiCard
        hero
        label="Avg Engagement / Post"
        state={state}
        value={display(posts.engagementPerPost.average)}
        delta={round1(percentChange(posts.engagementPerPost.average, previous?.engagementPerPost.average))}
        note="Interactions per post"
      />
      <KpiCard
        hero
        label="Median Engagement / Post"
        state={state}
        value={display(posts.engagementPerPost.median)}
        delta={round1(percentChange(posts.engagementPerPost.median, previous?.engagementPerPost.median))}
        note="Typical post, outliers excluded"
      />
    </div>
  );
}

function display(value: number | undefined): string | undefined {
  return value === undefined ? "—" : formatCompact(Math.round(value));
}

function round1(n: number | undefined): number | undefined {
  return n === undefined ? undefined : Math.round(n * 10) / 10;
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {["Engagement Rate", "Avg Engagement / Post", "Median Engagement / Post"].map((l) => (
        <div key={l} className="rounded-card bg-surface p-6 shadow-card">
          <p className="text-sm font-medium text-ink-2">{l}</p>
          <Skeleton className="mt-3 h-10 w-28" />
        </div>
      ))}
    </div>
  );
}
