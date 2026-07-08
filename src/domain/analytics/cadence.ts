import type { Post } from "../types";
import type { DayCount, PublishingAnalytics, WeekCount } from "./types";

const DAY_MS = 86_400_000;

/**
 * Publishing cadence — objective facts only: how often, on which days,
 * how evenly. Consistency is described by numbers (active weeks, busiest
 * week, longest gap), never judged.
 */
export function computePublishing(
  posts: Post[],
  byWeekday: number[],
  frequencyPerWeek: number,
  days: number,
  now = new Date(),
): PublishingAnalytics {
  const start = new Date(now.getTime() - days * DAY_MS);

  // per-day counts across the WHOLE period (zero days included)
  const countsByDate = new Map<string, number>();
  for (const post of posts) {
    const key = new Date(post.postedAt).toISOString().slice(0, 10);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }
  const calendar: DayCount[] = [];
  for (let t = start.getTime(); t <= now.getTime(); t += DAY_MS) {
    const date = new Date(t).toISOString().slice(0, 10);
    calendar.push({ date, posts: countsByDate.get(date) ?? 0 });
  }

  // weekly buckets from the Monday of the start week (zero weeks included)
  const firstMonday = mondayOf(start);
  const weeklyCounts: WeekCount[] = [];
  for (let t = firstMonday.getTime(); t <= now.getTime(); t += 7 * DAY_MS) {
    const weekStartDate = new Date(t);
    const weekStart = weekStartDate.toISOString().slice(0, 10);
    const weekEnd = t + 7 * DAY_MS;
    const count = posts.filter((p) => {
      const time = new Date(p.postedAt).getTime();
      return time >= t && time < weekEnd;
    }).length;
    weeklyCounts.push({
      weekStart,
      label: weekStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      posts: count,
    });
  }

  // longest gap between consecutive posts
  const times = posts.map((p) => new Date(p.postedAt).getTime()).sort((a, b) => a - b);
  let longestGapDays: number | undefined;
  for (let i = 1; i < times.length; i++) {
    const gap = Math.round((times[i]! - times[i - 1]!) / DAY_MS);
    if (longestGapDays === undefined || gap > longestGapDays) longestGapDays = gap;
  }

  // most active weekday (Monday-first index), only when posts exist
  let mostActiveWeekday: PublishingAnalytics["mostActiveWeekday"];
  const maxCount = Math.max(...byWeekday, 0);
  if (maxCount > 0) {
    mostActiveWeekday = { index: byWeekday.indexOf(maxCount), count: maxCount };
  }

  return {
    frequencyPerWeek,
    mostActiveWeekday,
    weeklyCounts,
    activeWeeks: weeklyCounts.filter((w) => w.posts > 0).length,
    totalWeeks: weeklyCounts.length,
    busiestWeekPosts: Math.max(...weeklyCounts.map((w) => w.posts), 0),
    longestGapDays,
    calendar,
  };
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}
