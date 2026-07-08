import type { WidgetProps } from "./types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact, percentChange } from "@/domain/analytics";
import { KpiCard, Skeleton } from "@/design-system/primitives";

/**
 * Overview chapter — presentation only. Every number comes from the
 * Analytics Engine; every availability decision from the Capability Engine.
 * Unavailable → locked. No posts in range → em dash. Never zeros, never estimates.
 */
export default function QuickMetricsWidget({ handle, range }: WidgetProps) {
  const { snapshot, engine, analytics } = useAnalytics(handle, range);

  if (!snapshot || !engine || !analytics) return <MetricsSkeleton />;

  const { posts, growth, previous } = analytics;
  const erNote =
    posts.engagementBasis === "full"
      ? "Includes saves & shares"
      : "Public basis: likes + comments";

  const historyLocked = engine.metricState("history") === "locked";

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          hero
          label="Followers"
          value={formatCompact(snapshot.totals.followers)}
          state={engine.metricState("followers")}
        />
        <KpiCard
          hero
          label="Follower Growth"
          state={engine.metricState("history")}
          value={historyLocked ? undefined : growth ? formatCompact(growth.absolute) : "—"}
          delta={growth ? round1(growth.percent) : undefined}
          note={growth ? "vs start of period" : undefined}
        />
        <KpiCard
          hero
          label="Engagement Rate"
          state={posts.engagementRate !== undefined ? engine.metricState("engagement") : "locked"}
          value={posts.engagementRate !== undefined ? `${posts.engagementRate.toFixed(2)}%` : undefined}
          delta={roundOpt(percentChange(posts.engagementRate, previous?.engagementRate))}
          note={posts.engagementRate !== undefined ? erNote : undefined}
        />
        <KpiCard
          hero
          label="Posts Published"
          value={String(posts.count)}
          state={engine.metricState("engagement")}
          delta={roundOpt(percentChange(posts.count, previous?.count))}
          note="In selected period"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StripMetric
          label="Avg Likes"
          value={posts.averages.likes}
          delta={percentChange(posts.averages.likes, previous?.averages.likes)}
          state={engine.metricState("engagement")}
        />
        <StripMetric
          label="Avg Comments"
          value={posts.averages.comments}
          delta={percentChange(posts.averages.comments, previous?.averages.comments)}
          state={engine.metricState("engagement")}
        />
        <StripMetric
          label="Avg Views"
          value={posts.averages.views}
          delta={percentChange(posts.averages.views, previous?.averages.views)}
          state={engine.metricState("views")}
          note="Reels"
        />
        <StripMetric label="Avg Reach" value={posts.averages.reach} state={engine.metricState("reach")} />
        <StripMetric label="Avg Saves" value={posts.averages.saves} state={engine.metricState("saves")} />
        <StripMetric label="Avg Shares" value={posts.averages.shares} state={engine.metricState("shares")} />
      </div>
    </div>
  );
}

function StripMetric({
  label,
  value,
  delta,
  state,
  note,
}: {
  label: string;
  value: number | undefined;
  delta?: number | undefined;
  state: "measured" | "observed" | "locked";
  note?: string;
}) {
  const display =
    state === "locked" ? undefined : value === undefined ? "—" : formatCompact(value);
  return (
    <KpiCard
      label={label}
      value={display}
      delta={state !== "locked" ? roundOpt(delta) : undefined}
      state={state}
      note={state !== "locked" ? note : undefined}
    />
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundOpt(n: number | undefined): number | undefined {
  return n === undefined ? undefined : round1(n);
}

function MetricsSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Followers", "Follower Growth", "Engagement Rate", "Posts Published"].map((l) => (
          <div key={l} className="rounded-card bg-surface p-6 shadow-card">
            <p className="text-sm font-medium text-ink-2">{l}</p>
            <Skeleton className="mt-3 h-10 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-card bg-surface px-5 py-4 shadow-card">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="mt-2.5 h-6 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
