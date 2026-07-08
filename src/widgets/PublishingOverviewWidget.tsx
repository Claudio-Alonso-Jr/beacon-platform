import type { WidgetProps } from "./types";
import type { PostType } from "@/domain/types";
import { useAnalytics } from "@/data/useAnalytics";
import { KpiCard, Skeleton } from "@/design-system/primitives";
import { WEEKDAY_LABELS } from "./weekdays";
import { POST_TYPE_LABEL } from "./PostThumbnail";

/**
 * Publishing chapter, part 1: the cadence at a glance.
 * Pure PeriodAnalytics — the widget only formats.
 */
export default function PublishingOverviewWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);

  if (!engine || !analytics) return <OverviewSkeleton />;

  const { posts, publishing } = analytics;
  const state = engine.metricState("engagement");
  const mix = contentMix(posts.byType, posts.count);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        hero
        label="Posts Published"
        value={String(posts.count)}
        state={state}
        note="In selected period"
      />
      <KpiCard
        hero
        label="Avg Posts / Week"
        value={posts.count > 0 ? publishing.frequencyPerWeek.toFixed(1) : "—"}
        state={state}
      />
      <KpiCard
        hero
        label="Most Active Day"
        value={
          publishing.mostActiveWeekday
            ? WEEKDAY_LABELS[publishing.mostActiveWeekday.index]
            : "—"
        }
        state={state}
        note={
          publishing.mostActiveWeekday
            ? `${publishing.mostActiveWeekday.count} post${publishing.mostActiveWeekday.count === 1 ? "" : "s"}`
            : undefined
        }
      />
      <KpiCard
        hero
        label="Content Mix"
        value={mix.leading ?? "—"}
        state={state}
        note={mix.rest}
      />
    </div>
  );
}

function contentMix(
  byType: Record<PostType, number>,
  total: number,
): { leading?: string; rest?: string } {
  if (total === 0) return {};
  const entries = (Object.entries(byType) as [PostType, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return {};
  const pct = (count: number) => `${Math.round((count / total) * 100)}%`;
  const [leadType, leadCount] = entries[0]!;
  return {
    leading: `${pct(leadCount)} ${POST_TYPE_LABEL[leadType]}s`,
    rest: entries
      .slice(1)
      .map(([type, count]) => `${pct(count)} ${POST_TYPE_LABEL[type].toLowerCase()}s`)
      .join(" · ") || undefined,
  };
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {["Posts Published", "Avg Posts / Week", "Most Active Day", "Content Mix"].map((l) => (
        <div key={l} className="rounded-card bg-surface p-6 shadow-card">
          <p className="text-sm font-medium text-ink-2">{l}</p>
          <Skeleton className="mt-3 h-10 w-28" />
        </div>
      ))}
    </div>
  );
}
