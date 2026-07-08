import type { Snapshot, TimeSeriesPoint } from "../types";
import { RANGE_DAYS, type EvolutionPoint, type GrowthAnalytics, type TimeRange } from "./types";

/**
 * Growth analytics — only from real follower history. When history doesn't
 * cover the period, the answer is `undefined`, never an estimate.
 */
export function computeGrowthAnalytics(
  history: TimeSeriesPoint[] | undefined,
  range: TimeRange,
  now = new Date(),
): GrowthAnalytics | undefined {
  if (!history || history.length < 2) return undefined;
  const cutoff = rangeStart(range, now).getTime();
  const inRange = history.filter((p) => new Date(p.date).getTime() >= cutoff);
  if (inRange.length < 2) return undefined;

  const first = inRange[0]!.value;
  const last = inRange[inRange.length - 1]!.value;
  const absolute = last - first;
  const percent = first > 0 ? (absolute / first) * 100 : 0;
  const weeks = (inRange.length - 1) / 7;

  let largestSpike: GrowthAnalytics["largestSpike"];
  for (let i = 1; i < inRange.length; i++) {
    const gain = inRange[i]!.value - inRange[i - 1]!.value;
    if (!largestSpike || gain > largestSpike.gain) {
      largestSpike = { date: inRange[i]!.date, gain };
    }
  }

  return {
    absolute,
    percent,
    avgWeeklyAbsolute: weeks > 0 ? absolute / weeks : absolute,
    avgWeeklyPercent: weeks > 0 ? percent / weeks : percent,
    largestSpike: largestSpike && largestSpike.gain > 0 ? largestSpike : undefined,
  };
}

/** Current period series + aligned previous-period overlay. */
export function followerEvolution(snapshot: Snapshot, range: TimeRange): EvolutionPoint[] {
  const history = snapshot.followerHistory;
  if (!history || history.length === 0) return [];
  const days = RANGE_DAYS[range];
  const current = history.slice(-days);
  const previous = history.slice(-(days * 2), -days);
  return current.map((point, i) => ({
    date: point.date,
    value: point.value,
    previous: previous[i]?.value,
  }));
}

export function rangeStart(range: TimeRange, from = new Date()): Date {
  const start = new Date(from);
  start.setDate(start.getDate() - RANGE_DAYS[range]);
  return start;
}
