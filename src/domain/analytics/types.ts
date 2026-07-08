import type { Post, PostType } from "../types";

/**
 * Analytics Engine types. The engine is PURE and DETERMINISTIC:
 * no AI, no scoring, no recommendations — only objective metrics
 * derived from snapshot data. Widgets are presentation-only consumers.
 */

/* Time ranges live in the domain (the engine depends on them, stores re-export). */
export const TIME_RANGES = [
  { value: "7d", label: "7d" },
  { value: "15d", label: "15d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1y" },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];

export const RANGE_DAYS: Record<TimeRange, number> = {
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "90d": 90,
  "6m": 182,
  "1y": 365,
};

/** A post with its objective performance context inside the period. */
export interface RankedPost {
  post: Post;
  /** likes + comments (+ saves + shares when measured). */
  engagement: number;
  /** Share of period posts this one matches or outperforms, 0–100. */
  percentile: number;
}

/** One calendar bucket (week or month) ranked by engagement. */
export interface BucketStat {
  key: string;   // "2026-06" | "2026-06-08" (week start)
  label: string; // "Jun 2026" | "Week of Jun 8"
  posts: number;
  totalEngagement: number;
  avgEngagement: number;
}

export interface PostAverages {
  likes?: number;
  comments?: number;
  views?: number;
  reach?: number;
  saves?: number;
  shares?: number;
}

export interface PostMedians {
  likes?: number;
  comments?: number;
}

export interface EngagementPerPost {
  average?: number;
  median?: number;
}

/** Objective performance classification — banded by hard rules, never scored.
 *  top10: percentile ≥ 90 · above: > 110% of mean · average: 90–110% of mean
 *  · below: < 90% of mean. */
export type PerformanceBand = "top10" | "above" | "average" | "below";

export interface TypeStats {
  count: number;
  avgEngagement?: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
}

/** One bucket (day, or week on long ranges) of the engagement trend. */
export interface EngagementTrendPoint {
  date: string; // bucket start, ISO date
  posts: number;
  avgEngagement: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  /** Percent, avgEngagement / followers. */
  engagementRate?: number;
}

/** A single post's objective standing inside the period. */
export interface PostContext {
  rank: number;
  of: number;
  percentile: number;
  band: PerformanceBand;
  /** Percent vs profile average engagement. */
  vsProfileAvg?: number;
  /** Percent vs same-content-type average engagement. */
  vsTypeAvg?: number;
  bestOfType: boolean;
}

export interface PostAnalytics {
  count: number;
  byType: Record<PostType, number>;
  byTypeStats: Record<PostType, TypeStats>;
  averages: PostAverages;
  medians: PostMedians;
  engagementPerPost: EngagementPerPost;
  /** Percent, e.g. 1.8. Undefined when it can't be honestly computed. */
  engagementRate?: number;
  engagementBasis: "public" | "full";
  /** ALL period posts, descending by engagement (rank order). */
  ranked: RankedPost[];
  /** Descending by engagement. */
  top: RankedPost[];
  /** Ascending by engagement (worst first). */
  bottom: RankedPost[];
  bestByType: Partial<Record<PostType, RankedPost>>;
  frequencyPerWeek: number;
  /** Monday-first, length 7 — post counts per weekday. */
  byWeekday: number[];
  weeklyRanking: BucketStat[];
  monthlyRanking: BucketStat[];
  /** Bucketed engagement-over-time series (day, or week on ranges > 45d). */
  trend: EngagementTrendPoint[];
}

export interface GrowthAnalytics {
  absolute: number;
  percent: number;
  avgWeeklyAbsolute: number;
  avgWeeklyPercent: number;
  /** Largest single-day follower gain inside the period. */
  largestSpike?: { date: string; gain: number };
}

export interface EvolutionPoint {
  date: string;
  value: number;
  /** Previous-period value aligned by day offset. */
  previous?: number;
}

/* ——— publishing / cadence ——— */

export interface WeekCount {
  /** Monday, ISO date. */
  weekStart: string;
  label: string; // "Jun 8"
  posts: number;
}

export interface DayCount {
  date: string; // ISO date
  posts: number;
}

/** Objective cadence facts — patterns stated, never judged. */
export interface PublishingAnalytics {
  frequencyPerWeek: number;
  mostActiveWeekday?: { index: number; count: number }; // Monday-first index
  /** Every week in the period, chronological, INCLUDING zero-post weeks. */
  weeklyCounts: WeekCount[];
  activeWeeks: number;
  totalWeeks: number;
  busiestWeekPosts: number;
  /** Largest gap between two consecutive posts; undefined with < 2 posts. */
  longestGapDays?: number;
  /** Every day in the period with its post count (heatmap source). */
  calendar: DayCount[];
}

/** Lightweight previous-period summary for historical comparisons. */
export interface PreviousPeriod {
  count: number;
  averages: PostAverages;
  engagementPerPost: EngagementPerPost;
  engagementRate?: number;
}

/** The engine's single output: everything widgets are allowed to show. */
export interface PeriodAnalytics {
  range: TimeRange;
  days: number;
  posts: PostAnalytics;
  publishing: PublishingAnalytics;
  /** Only when follower history covers the period — never estimated. */
  growth?: GrowthAnalytics;
  evolution: EvolutionPoint[];
  /** Previous equal-length period, when posts exist there. */
  previous?: PreviousPeriod;
}
