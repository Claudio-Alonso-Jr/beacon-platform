import type { Post, PostType } from "../types";
import type {
  BucketStat,
  EngagementTrendPoint,
  PerformanceBand,
  PostAnalytics,
  PostAverages,
  PostContext,
  PostMedians,
  RankedPost,
  TypeStats,
} from "./types";

/** Objective per-post engagement: likes + comments (+ saves + shares when measured). */
export function engagementOf(post: Post): number {
  return (
    post.metrics.likes.value +
    post.metrics.comments.value +
    (post.metrics.saves?.value ?? 0) +
    (post.metrics.shares?.value ?? 0)
  );
}

export function computePostAnalytics(
  posts: Post[],
  followers: number,
  days: number,
): PostAnalytics {
  const count = posts.length;
  const ranked = rankPosts(posts);

  const byType: Record<PostType, number> = { image: 0, carousel: 0, reel: 0 };
  for (const post of posts) byType[post.type] += 1;

  const averages = computeAverages(posts);
  const fullBasis = averages.saves !== undefined || averages.shares !== undefined;

  let engagementRate: number | undefined;
  if (count > 0 && followers > 0 && averages.likes !== undefined) {
    const perPost =
      averages.likes +
      (averages.comments ?? 0) +
      (averages.saves ?? 0) +
      (averages.shares ?? 0);
    engagementRate = (perPost / followers) * 100;
  }

  const rankedDesc = [...ranked].sort((a, b) => b.engagement - a.engagement);
  const engagementValues = ranked.map((r) => r.engagement);

  return {
    count,
    byType,
    byTypeStats: computeTypeStats(posts),
    averages,
    medians: computeMedians(posts),
    engagementPerPost: {
      average:
        count > 0
          ? engagementValues.reduce((a, b) => a + b, 0) / count
          : undefined,
      median: median(engagementValues),
    },
    engagementRate,
    engagementBasis: fullBasis ? "full" : "public",
    ranked: rankedDesc,
    top: rankedDesc.slice(0, 5),
    bottom: [...ranked].sort((a, b) => a.engagement - b.engagement).slice(0, 3),
    bestByType: computeBestByType(ranked),
    frequencyPerWeek: days > 0 ? (count / days) * 7 : 0,
    byWeekday: computeWeekdayDistribution(posts),
    weeklyRanking: bucketRanking(posts, "week"),
    monthlyRanking: bucketRanking(posts, "month"),
    trend: computeTrend(posts, followers, days),
  };
}

/**
 * Objective performance band — hard rules, never a score:
 * top10 (percentile ≥ 90) · above (> 110% of mean) · average (90–110%) · below.
 */
export function performanceBand(
  engagement: number,
  meanEngagement: number | undefined,
  percentile: number,
): PerformanceBand {
  if (percentile >= 90) return "top10";
  if (meanEngagement === undefined || meanEngagement === 0) return "average";
  if (engagement > meanEngagement * 1.1) return "above";
  if (engagement >= meanEngagement * 0.9) return "average";
  return "below";
}

/** A post's objective standing in the period. Pure lookup + arithmetic. */
export function contextForPost(
  analytics: PostAnalytics,
  postId: string,
): PostContext | undefined {
  const index = analytics.ranked.findIndex((r) => r.post.id === postId);
  if (index === -1) return undefined;
  const entry = analytics.ranked[index]!;
  const mean = analytics.engagementPerPost.average;
  const typeAvg = analytics.byTypeStats[entry.post.type]?.avgEngagement;

  const change = (baseline: number | undefined): number | undefined =>
    baseline === undefined || baseline === 0
      ? undefined
      : ((entry.engagement - baseline) / baseline) * 100;

  return {
    rank: index + 1,
    of: analytics.ranked.length,
    percentile: entry.percentile,
    band: performanceBand(entry.engagement, mean, entry.percentile),
    vsProfileAvg: change(mean),
    vsTypeAvg: change(typeAvg),
    bestOfType: analytics.bestByType[entry.post.type]?.post.id === postId,
  };
}

function computeTypeStats(posts: Post[]): Record<PostType, TypeStats> {
  const stats = {} as Record<PostType, TypeStats>;
  for (const type of ["image", "carousel", "reel"] as PostType[]) {
    const ofType = posts.filter((p) => p.type === type);
    const mean = (pick: (p: Post) => number | undefined): number | undefined => {
      const values = ofType.map(pick).filter((v): v is number => v !== undefined);
      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : undefined;
    };
    stats[type] = {
      count: ofType.length,
      avgEngagement: ofType.length > 0
        ? ofType.reduce((a, p) => a + engagementOf(p), 0) / ofType.length
        : undefined,
      avgLikes: mean((p) => p.metrics.likes.value),
      avgComments: mean((p) => p.metrics.comments.value),
      avgViews: mean((p) => p.metrics.views?.value),
    };
  }
  return stats;
}

/** Bucketed by day (≤ 45-day ranges) or by week, averaged per bucket. */
function computeTrend(posts: Post[], followers: number, days: number): EngagementTrendPoint[] {
  const weekly = days > 45;
  const buckets = new Map<string, Post[]>();

  for (const post of posts) {
    const date = new Date(post.postedAt);
    let key: string;
    if (weekly) {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      key = monday.toISOString().slice(0, 10);
    } else {
      key = date.toISOString().slice(0, 10);
    }
    const list = buckets.get(key) ?? [];
    list.push(post);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .map(([date, bucketPosts]) => {
      const n = bucketPosts.length;
      const sum = (pick: (p: Post) => number | undefined): number =>
        bucketPosts.reduce((a, p) => a + (pick(p) ?? 0), 0);
      const viewValues = bucketPosts
        .map((p) => p.metrics.views?.value)
        .filter((v): v is number => v !== undefined);
      const avgEngagement = bucketPosts.reduce((a, p) => a + engagementOf(p), 0) / n;
      return {
        date,
        posts: n,
        avgEngagement,
        avgLikes: sum((p) => p.metrics.likes.value) / n,
        avgComments: sum((p) => p.metrics.comments.value) / n,
        avgViews:
          viewValues.length > 0
            ? viewValues.reduce((a, b) => a + b, 0) / viewValues.length
            : undefined,
        engagementRate: followers > 0 ? (avgEngagement / followers) * 100 : undefined,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Percentile = share of period posts this one matches or outperforms (0–100). */
export function rankPosts(posts: Post[]): RankedPost[] {
  const n = posts.length;
  if (n === 0) return [];
  const sortedValues = posts.map(engagementOf).sort((a, b) => a - b);
  return posts.map((post) => {
    const engagement = engagementOf(post);
    // count of values <= engagement (upper bound via binary search)
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedValues[mid]! <= engagement) lo = mid + 1;
      else hi = mid;
    }
    return { post, engagement, percentile: Math.round((lo / n) * 100) };
  });
}

function computeAverages(posts: Post[]): PostAverages {
  const mean = (pick: (p: Post) => number | undefined): number | undefined => {
    const values = posts.map(pick).filter((v): v is number => v !== undefined);
    if (values.length === 0) return undefined;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };
  return {
    likes: mean((p) => p.metrics.likes.value),
    comments: mean((p) => p.metrics.comments.value),
    views: mean((p) => p.metrics.views?.value),
    reach: mean((p) => p.metrics.reach?.value),
    saves: mean((p) => p.metrics.saves?.value),
    shares: mean((p) => p.metrics.shares?.value),
  };
}

function computeMedians(posts: Post[]): PostMedians {
  return {
    likes: median(posts.map((p) => p.metrics.likes.value)),
    comments: median(posts.map((p) => p.metrics.comments.value)),
  };
}

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function computeBestByType(ranked: RankedPost[]): Partial<Record<PostType, RankedPost>> {
  const best: Partial<Record<PostType, RankedPost>> = {};
  for (const entry of ranked) {
    const current = best[entry.post.type];
    if (!current || entry.engagement > current.engagement) {
      best[entry.post.type] = entry;
    }
  }
  return best;
}

/** Monday-first weekday counts. */
function computeWeekdayDistribution(posts: Post[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const post of posts) {
    const day = (new Date(post.postedAt).getDay() + 6) % 7;
    counts[day] += 1;
  }
  return counts;
}

/** Calendar buckets ranked by average engagement, best first. */
function bucketRanking(posts: Post[], unit: "week" | "month"): BucketStat[] {
  const buckets = new Map<string, { label: string; posts: number; total: number }>();

  for (const post of posts) {
    const date = new Date(post.postedAt);
    const { key, label } = unit === "month" ? monthBucket(date) : weekBucket(date);
    const bucket = buckets.get(key) ?? { label, posts: 0, total: 0 };
    bucket.posts += 1;
    bucket.total += engagementOf(post);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([key, b]) => ({
      key,
      label: b.label,
      posts: b.posts,
      totalEngagement: b.total,
      avgEngagement: b.total / b.posts,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

function monthBucket(date: Date): { key: string; label: string } {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return { key, label };
}

function weekBucket(date: Date): { key: string; label: string } {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const key = monday.toISOString().slice(0, 10);
  const label = `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return { key, label };
}
