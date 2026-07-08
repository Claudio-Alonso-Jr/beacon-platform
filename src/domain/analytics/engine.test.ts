import { describe, expect, it } from "vitest";
import {
  computeAnalytics,
  contextForPost,
  median,
  percentChange,
  performanceBand,
  rankPosts,
} from "./index";
import { computeGrowthAnalytics } from "./growth";
import type { MetricValue, Post, PostType, Snapshot, TimeSeriesPoint } from "../types";

/* ——— synthetic fixtures (hand-computable) ——— */

function metric(value: number): MetricValue {
  return { value, source: "scraped" };
}

function post(
  daysAgo: number,
  likes: number,
  comments: number,
  type: PostType = "image",
  extra: Partial<Post["metrics"]> = {},
): Post {
  return {
    id: `p-${daysAgo}-${likes}`,
    type,
    postedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    caption: "test",
    hashtags: [],
    permalink: "https://instagram.com/test",
    thumbnailHue: 0,
    metrics: { likes: metric(likes), comments: metric(comments), ...extra },
  };
}

function snapshot(posts: Post[], history?: TimeSeriesPoint[]): Snapshot {
  return {
    id: "snap-test",
    capturedAt: new Date().toISOString(),
    provider: "scraper",
    capabilities: ["followers", "engagement", "views"],
    profile: {
      handle: "test",
      displayName: "Test",
      bio: "",
      isVerified: false,
      avatarHue: 0,
    },
    totals: { followers: 10_000, following: 100, posts: posts.length },
    followerHistory: history,
    posts,
    schemaVersion: 1,
  };
}

function history(values: number[]): TimeSeriesPoint[] {
  // values[0] is oldest; last is today
  return values.map((value, i) => ({
    date: new Date(Date.now() - (values.length - 1 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10),
    value,
  }));
}

/* ——— tests ——— */

describe("median", () => {
  it("handles odd and even counts", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBeUndefined();
  });
});

describe("percentChange", () => {
  it("is objective and guards the baseline", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
    expect(percentChange(100, 0)).toBeUndefined();
    expect(percentChange(undefined, 100)).toBeUndefined();
  });
});

describe("rankPosts", () => {
  it("assigns percentiles by engagement", () => {
    const ranked = rankPosts([
      post(1, 100, 0),
      post(2, 200, 0),
      post(3, 300, 0),
      post(4, 400, 0),
    ]);
    const byLikes = new Map(ranked.map((r) => [r.post.metrics.likes!.value, r]));
    expect(byLikes.get(400)!.percentile).toBe(100);
    expect(byLikes.get(100)!.percentile).toBe(25);
    expect(byLikes.get(300)!.engagement).toBe(300);
  });
});

describe("computeAnalytics — posts", () => {
  const posts = [
    post(2, 100, 10, "image"),
    post(5, 300, 30, "reel", { views: metric(5000) }),
    post(8, 200, 20, "carousel"),
    // previous period (30d range → 30–60 days ago)
    post(40, 50, 5, "image"),
    post(50, 150, 15, "image"),
  ];
  const analytics = computeAnalytics(snapshot(posts), "30d");

  it("filters by period and splits previous window", () => {
    expect(analytics.posts.count).toBe(3);
    expect(analytics.previous?.count).toBe(2);
  });

  it("computes averages and medians", () => {
    expect(analytics.posts.averages.likes).toBe(200);
    expect(analytics.posts.medians.likes).toBe(200);
    expect(analytics.posts.averages.views).toBe(5000); // only the reel exposes views
  });

  it("computes engagement rate on the public basis", () => {
    // (avg likes 200 + avg comments 20) / 10k followers = 2.2%
    expect(analytics.posts.engagementRate).toBeCloseTo(2.2);
    expect(analytics.posts.engagementBasis).toBe("public");
  });

  it("ranks top and bottom and best-by-type", () => {
    expect(analytics.posts.top[0]!.post.type).toBe("reel"); // 330 engagement
    expect(analytics.posts.bottom[0]!.post.metrics.likes!.value).toBe(100);
    expect(analytics.posts.bestByType.reel!.engagement).toBe(330);
    expect(analytics.posts.bestByType.image!.engagement).toBe(110);
  });

  it("counts type distribution and frequency", () => {
    expect(analytics.posts.byType).toEqual({ image: 1, carousel: 1, reel: 1 });
    expect(analytics.posts.frequencyPerWeek).toBeCloseTo((3 / 30) * 7);
  });

  it("builds weekly and monthly rankings ordered by avg engagement", () => {
    const weekly = analytics.posts.weeklyRanking;
    expect(weekly.length).toBeGreaterThan(0);
    for (let i = 1; i < weekly.length; i++) {
      expect(weekly[i - 1]!.avgEngagement).toBeGreaterThanOrEqual(weekly[i]!.avgEngagement);
    }
  });

  it("is deterministic", () => {
    const again = computeAnalytics(snapshot(posts), "30d");
    expect(again).toEqual(analytics);
  });
});

describe("engagement analytics", () => {
  const posts = [
    post(2, 100, 10, "image"),   // engagement 110
    post(5, 300, 30, "reel", { views: metric(5000) }), // 330
    post(8, 200, 20, "carousel"), // 220
    post(10, 400, 40, "reel", { views: metric(9000) }), // 440
  ];
  const analytics = computeAnalytics(snapshot(posts), "30d");

  it("computes engagement per post (average and median)", () => {
    expect(analytics.posts.engagementPerPost.average).toBe((110 + 330 + 220 + 440) / 4);
    expect(analytics.posts.engagementPerPost.median).toBe((220 + 330) / 2);
  });

  it("computes per-type stats", () => {
    const reels = analytics.posts.byTypeStats.reel;
    expect(reels.count).toBe(2);
    expect(reels.avgEngagement).toBe((330 + 440) / 2);
    expect(reels.avgViews).toBe(7000);
    expect(analytics.posts.byTypeStats.image.avgViews).toBeUndefined();
  });

  it("keeps the full ranked list in rank order", () => {
    expect(analytics.posts.ranked.map((r) => r.engagement)).toEqual([440, 330, 220, 110]);
  });

  it("buckets the trend by day on short ranges", () => {
    expect(analytics.posts.trend).toHaveLength(4);
    expect(analytics.posts.trend[0]!.date <= analytics.posts.trend[1]!.date).toBe(true);
    expect(analytics.posts.trend.every((t) => t.posts === 1)).toBe(true);
  });

  it("classifies performance bands objectively", () => {
    expect(performanceBand(500, 100, 95)).toBe("top10");
    expect(performanceBand(150, 100, 80)).toBe("above");
    expect(performanceBand(100, 100, 50)).toBe("average");
    expect(performanceBand(50, 100, 10)).toBe("below");
  });

  it("builds post context: rank, percentile, comparisons, best-of-type", () => {
    const bestReel = analytics.posts.ranked[0]!.post; // 440, reel
    const ctx = contextForPost(analytics.posts, bestReel.id)!;
    expect(ctx.rank).toBe(1);
    expect(ctx.of).toBe(4);
    expect(ctx.percentile).toBe(100);
    expect(ctx.bestOfType).toBe(true);
    // vs profile mean 275 → +60%
    expect(ctx.vsProfileAvg).toBeCloseTo(60);
    // vs reel avg 385 → +14.3%
    expect(ctx.vsTypeAvg).toBeCloseTo((440 - 385) / 3.85, 1);

    const weakest = analytics.posts.ranked[3]!.post; // 110, image
    const weakCtx = contextForPost(analytics.posts, weakest.id)!;
    expect(weakCtx.rank).toBe(4);
    expect(weakCtx.band).toBe("below");
    expect(weakCtx.bestOfType).toBe(true); // only image in period
  });
});

describe("period anchoring", () => {
  it("anchors windows to the snapshot capture time, not the wall clock", () => {
    // snapshot captured months ago; posts dated relative to THAT moment
    const captured = "2026-01-31T12:00:00.000Z";
    const at = (iso: string, likes: number): Post => ({
      ...post(0, likes, 0),
      id: `abs-${iso}`,
      postedAt: iso,
    });
    const snap: Snapshot = {
      ...snapshot([
        at("2026-01-30T10:00:00.000Z", 100), // 1 day before capture → in 7d window
        at("2026-01-10T10:00:00.000Z", 50),  // 21 days before capture → outside 7d
      ]),
      capturedAt: captured,
    };
    const a = computeAnalytics(snap, "7d");
    expect(a.posts.count).toBe(1);
    expect(a.posts.averages.likes).toBe(100);
    // and the 30d window catches both
    expect(computeAnalytics(snap, "30d").posts.count).toBe(2);
  });
});

describe("publishing analytics", () => {
  const posts = [
    post(1, 10, 1),
    post(2, 10, 1),
    post(2, 10, 1), // same day as above
    post(16, 10, 1), // 14-day gap from day-2 post
  ];
  const analytics = computeAnalytics(snapshot(posts), "30d");
  const pub = analytics.publishing;

  it("builds a full calendar including zero days", () => {
    expect(pub.calendar.length).toBeGreaterThanOrEqual(30);
    const totalPosts = pub.calendar.reduce((a, d) => a + d.posts, 0);
    expect(totalPosts).toBe(4);
    const twoPostDay = pub.calendar.find((d) => d.posts === 2);
    expect(twoPostDay).toBeDefined();
  });

  it("builds chronological weekly counts including empty weeks", () => {
    expect(pub.totalWeeks).toBeGreaterThanOrEqual(4);
    expect(pub.weeklyCounts.reduce((a, w) => a + w.posts, 0)).toBe(4);
    for (let i = 1; i < pub.weeklyCounts.length; i++) {
      expect(pub.weeklyCounts[i - 1]!.weekStart < pub.weeklyCounts[i]!.weekStart).toBe(true);
    }
    expect(pub.activeWeeks).toBeLessThan(pub.totalWeeks); // there IS an empty week
  });

  it("finds the longest gap between consecutive posts", () => {
    expect(pub.longestGapDays).toBe(14);
  });

  it("reports the most active weekday consistent with the distribution", () => {
    expect(pub.mostActiveWeekday).toBeDefined();
    const { index, count } = pub.mostActiveWeekday!;
    expect(analytics.posts.byWeekday[index]).toBe(count);
    expect(count).toBe(Math.max(...analytics.posts.byWeekday));
  });

  it("returns honest empties with no posts", () => {
    const empty = computeAnalytics(snapshot([]), "30d").publishing;
    expect(empty.mostActiveWeekday).toBeUndefined();
    expect(empty.longestGapDays).toBeUndefined();
    expect(empty.activeWeeks).toBe(0);
    expect(empty.busiestWeekPosts).toBe(0);
  });
});

describe("computeAnalytics — growth", () => {
  it("returns undefined without history (never estimates)", () => {
    const analytics = computeAnalytics(snapshot([post(1, 10, 1)]), "30d");
    expect(analytics.growth).toBeUndefined();
    expect(analytics.evolution).toEqual([]);
  });

  it("computes growth, weekly average, and the largest spike", () => {
    // 8 days: 1000 → 1290, with a +200 jump on one day.
    // Anchor `now` at UTC midnight so the 7-day cutoff includes the oldest
    // point deterministically (history dates are day-resolution).
    const utcMidnight = new Date(new Date().toISOString().slice(0, 10));
    const growth = computeGrowthAnalytics(
      history([1000, 1010, 1020, 1030, 1230, 1250, 1270, 1290]),
      "7d",
      utcMidnight,
    );
    expect(growth).toBeDefined();
    expect(growth!.absolute).toBe(290);
    expect(growth!.percent).toBeCloseTo(29);
    expect(growth!.avgWeeklyAbsolute).toBeCloseTo(290);
    expect(growth!.largestSpike!.gain).toBe(200);
  });

  it("aligns the previous-period comparison in evolution", () => {
    const values = Array.from({ length: 20 }, (_, i) => 1000 + i * 10);
    const analytics = computeAnalytics(snapshot([], history(values)), "7d");
    expect(analytics.evolution).toHaveLength(7);
    // previous[i] should be the value exactly `days` earlier
    expect(analytics.evolution[0]!.previous).toBe(analytics.evolution[0]!.value - 70);
  });
});
