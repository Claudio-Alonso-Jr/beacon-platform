import type { Post, Snapshot } from "../types";
import { RANGE_DAYS, type PeriodAnalytics, type PreviousPeriod, type TimeRange } from "./types";
import { computePostAnalytics } from "./posts";
import { computeGrowthAnalytics, followerEvolution, rangeStart } from "./growth";
import { computePublishing } from "./cadence";

/**
 * Analytics Engine — the single source of truth for every number the
 * dashboard shows (§ Phase 6 brief). Pure and deterministic: same snapshot
 * and range in, same analytics out. No AI, no scores, no recommendations.
 *
 * Widgets consume `PeriodAnalytics` and render — they never calculate.
 * Future AI modules will read this same output as their factual input.
 */
export function computeAnalytics(snapshot: Snapshot, range: TimeRange): PeriodAnalytics {
  const days = RANGE_DAYS[range];
  const now = new Date();
  const currentStart = rangeStart(range, now).getTime();
  const previousStart = currentStart - days * 86_400_000;

  const currentPosts: Post[] = [];
  const previousPosts: Post[] = [];
  for (const post of snapshot.posts) {
    const t = new Date(post.postedAt).getTime();
    if (t >= currentStart) currentPosts.push(post);
    else if (t >= previousStart) previousPosts.push(post);
  }

  const posts = computePostAnalytics(currentPosts, snapshot.totals.followers, days);

  return {
    range,
    days,
    posts,
    publishing: computePublishing(
      currentPosts,
      posts.byWeekday,
      posts.frequencyPerWeek,
      days,
      now,
    ),
    growth: computeGrowthAnalytics(snapshot.followerHistory, range, now),
    evolution: followerEvolution(snapshot, range),
    previous: computePrevious(previousPosts, snapshot.totals.followers, days),
  };
}

function computePrevious(
  posts: Post[],
  followers: number,
  days: number,
): PreviousPeriod | undefined {
  if (posts.length === 0) return undefined;
  const full = computePostAnalytics(posts, followers, days);
  return {
    count: full.count,
    averages: full.averages,
    engagementPerPost: full.engagementPerPost,
    engagementRate: full.engagementRate,
  };
}

/** Objective percent change; undefined when the baseline can't support one. */
export function percentChange(
  current: number | undefined,
  previous: number | undefined,
): number | undefined {
  if (current === undefined || previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

/* public surface */
export { contextForPost, engagementOf, median, performanceBand, rankPosts } from "./posts";
export { followerEvolution, rangeStart } from "./growth";
export * from "./types";
export * from "./format";

/** Posts inside the selected period (kept for gallery filtering). */
export function postsInRange(posts: Post[], range: TimeRange): Post[] {
  const cutoff = rangeStart(range).getTime();
  return posts.filter((p) => new Date(p.postedAt).getTime() >= cutoff);
}
