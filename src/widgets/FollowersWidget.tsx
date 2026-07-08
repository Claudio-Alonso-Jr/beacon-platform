import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WidgetProps } from "./types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact, formatDate, formatDateLong } from "@/domain/analytics";
import { Skeleton, WidgetCard } from "@/design-system/primitives";

/**
 * The centerpiece of the Performance chapter. Chart styling per §7.5:
 * hairline dashed grid, gradient area fill 8→0%, custom tooltip card,
 * dashed previous-period overlay. When history doesn't exist (scraped
 * profiles), an honest empty state — never a fake curve.
 */
export default function FollowersWidget({ handle, range }: WidgetProps) {
  const { snapshot, engine, analytics } = useAnalytics(handle, range);

  if (!snapshot || !engine || !analytics) {
    return (
      <WidgetCard title="Followers Evolution">
        <Skeleton className="h-[360px] w-full" />
      </WidgetCard>
    );
  }

  if (!engine.has("history")) {
    return (
      <WidgetCard title="Followers Evolution" subtitle="Growth over the selected period">
        <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="kpi-value text-3xl font-semibold">
            {formatCompact(snapshot.totals.followers)}
          </p>
          <p className="text-sm font-medium text-ink-2">followers today — history starts now</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-3">
            Public profiles don't expose past follower counts. Each new analysis
            saves a snapshot, and this chart draws itself from your own history
            over time.
          </p>
        </div>
      </WidgetCard>
    );
  }

  const data = analytics.evolution;
  const growth = analytics.growth;
  const hasComparison = data.some((d) => d.previous !== undefined);
  const last = data[data.length - 1]?.value ?? 0;

  return (
    <WidgetCard
      title="Followers Evolution"
      subtitle={
        hasComparison
          ? "Solid line: selected period · dashed: previous period"
          : "Growth over the selected period"
      }
    >
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="kpi-value text-[28px] font-semibold">{formatCompact(last)}</span>
        {growth && (
          <span className="numeric text-sm text-ink-2">
            {growth.absolute >= 0 ? "+" : ""}
            {formatCompact(growth.absolute)} in period · avg{" "}
            {growth.avgWeeklyAbsolute >= 0 ? "+" : ""}
            {formatCompact(Math.round(growth.avgWeeklyAbsolute))}/week
            {growth.largestSpike && (
              <> · best day +{formatCompact(growth.largestSpike.gain)} on {formatDate(growth.largestSpike.date)}</>
            )}
          </span>
        )}
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--ds-hairline)"
              strokeDasharray="3 5"
            />
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
              tickFormatter={(v: number) => formatCompact(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--ds-ink-3)", fontSize: 12 }}
              width={48}
              domain={["dataMin", "dataMax"]}
              tickCount={4}
            />
            <Tooltip content={<EvolutionTooltip />} cursor={{ stroke: "var(--ds-ink-3)", strokeWidth: 1, strokeDasharray: "3 3" }} />
            {hasComparison && (
              <Area
                type="monotone"
                dataKey="previous"
                stroke="var(--ds-accent-faint)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                dot={false}
                isAnimationActive
                animationDuration={700}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--ds-accent)"
              strokeWidth={2}
              fill="url(#followersFill)"
              dot={false}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}

/** start · middle · end — quiet axis, no tick clutter */
function sparseTicks(dates: string[]): string[] {
  if (dates.length < 3) return dates;
  return [dates[0]!, dates[Math.floor(dates.length / 2)]!, dates[dates.length - 1]!];
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: number | string;
}

function EvolutionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const current = payload.find((p) => p.dataKey === "value")?.value;
  const previous = payload.find((p) => p.dataKey === "previous")?.value;

  return (
    <div className="rounded-control bg-surface px-3.5 py-2.5 shadow-overlay">
      <p className="text-xs text-ink-3">{label ? formatDateLong(label) : ""}</p>
      {typeof current === "number" && (
        <p className="numeric mt-1 text-sm font-semibold text-ink">
          {formatCompact(current)} followers
        </p>
      )}
      {typeof previous === "number" && (
        <p className="numeric mt-0.5 text-xs text-ink-2">
          prev period: {formatCompact(previous)}
        </p>
      )}
    </div>
  );
}
