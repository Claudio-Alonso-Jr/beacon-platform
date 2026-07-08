import { useMemo } from "react";
import type { WidgetProps } from "./types";
import type { DayCount } from "@/domain/analytics";
import { useAnalytics } from "@/data/useAnalytics";
import { formatDateLong } from "@/domain/analytics";
import { Skeleton, WidgetCard } from "@/design-system/primitives";
import { WEEKDAY_SHORT } from "./weekdays";

/**
 * Publishing chapter, part 2: the calendar heatmap. Weeks as columns,
 * Monday-first rows, cell intensity = posts that day. Data is the engine's
 * per-day calendar; the widget only arranges it spatially.
 */
export default function PublishingCalendarWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);

  const columns = useMemo(
    () => (analytics ? toWeekColumns(analytics.publishing.calendar) : []),
    [analytics],
  );

  if (!engine || !analytics) {
    return (
      <WidgetCard title="Publishing Calendar">
        <Skeleton className="h-40 w-full" />
      </WidgetCard>
    );
  }

  if (analytics.posts.count === 0) {
    return (
      <WidgetCard
        title="Publishing Calendar"
        state="empty"
        emptyMessage="Nothing was published in this period"
      />
    );
  }

  return (
    <WidgetCard title="Publishing Calendar" subtitle="Posting activity by day">
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-3">
          {/* weekday labels — Mon / Wed / Fri only, calm */}
          <div className="grid shrink-0 grid-rows-7 gap-1 pr-1 text-right">
            {WEEKDAY_SHORT.map((label, i) => (
              <span key={label} className="flex h-3 items-center justify-end text-[10px] leading-none text-ink-3">
                {i % 2 === 0 ? label : ""}
              </span>
            ))}
          </div>
          {/* week columns */}
          <div className="flex gap-1">
            {columns.map((week) => (
              <div key={week.key} className="grid grid-rows-7 gap-1">
                {week.days.map((day, i) =>
                  day ? (
                    <span
                      key={day.date}
                      title={`${formatDateLong(day.date)} — ${day.posts} post${day.posts === 1 ? "" : "s"}`}
                      className="size-3 rounded-[3px]"
                      style={{ background: cellColor(day.posts) }}
                    />
                  ) : (
                    <span key={`pad-${week.key}-${i}`} className="size-3" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* objective legend */}
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-ink-3">
        <span className="mr-1">posts per day</span>
        {[0, 1, 2, 3].map((n) => (
          <span key={n} className="flex items-center gap-1">
            <span className="size-3 rounded-[3px]" style={{ background: cellColor(n) }} />
            <span>{n === 3 ? "3+" : n}</span>
          </span>
        ))}
      </div>
    </WidgetCard>
  );
}

function cellColor(posts: number): string {
  if (posts <= 0) return "var(--ds-surface-2)";
  if (posts === 1) return "var(--ds-accent-faint)";
  if (posts === 2) return "var(--ds-accent-soft)";
  return "var(--ds-accent)";
}

interface WeekColumn {
  key: string;
  /** Monday-first; null pads days outside the period. */
  days: (DayCount | null)[];
}

function toWeekColumns(calendar: DayCount[]): WeekColumn[] {
  const columns: WeekColumn[] = [];
  let current: WeekColumn | null = null;

  for (const day of calendar) {
    const weekday = (new Date(day.date).getUTCDay() + 6) % 7; // Monday-first
    if (weekday === 0 || current === null) {
      current = { key: day.date, days: Array.from({ length: 7 }, () => null) };
      columns.push(current);
    }
    current.days[weekday] = day;
  }
  return columns;
}
