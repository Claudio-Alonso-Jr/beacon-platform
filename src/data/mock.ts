import type { Capability, Post, PostType, Snapshot, TimeSeriesPoint } from "@/domain/types";
import { REFERENCE_PROFILES, type GrowthSpike, type ProfileConfig } from "./profiles";

/**
 * MockProvider (§9.3) — a permanent part of the project for development,
 * testing and demos.
 *
 * Curated reference profiles (data/profiles.ts) get hand-tuned datasets;
 * any other handle falls back to a generic seeded archetype (even character
 * count → Business account, odd → public). Everything is deterministic:
 * the same handle always produces the same data.
 */

const SCRAPER_CAPABILITIES: Capability[] = ["followers", "engagement", "views"];
const GRAPH_CAPABILITIES: Capability[] = [
  "followers", "engagement", "views", "reach", "saves", "shares", "impressions", "history",
];

export async function fetchMockSnapshot(handle: string): Promise<Snapshot> {
  await sleep(250 + (hash(handle) % 200));
  const config = REFERENCE_PROFILES[handle] ?? genericConfig(handle);
  return buildSnapshot(config);
}

function buildSnapshot(config: ProfileConfig): Snapshot {
  const rand = mulberry32(hash(config.handle));

  return {
    id: `snap-${config.handle}-${Date.now()}`,
    capturedAt: new Date().toISOString(),
    provider: config.business ? "graph_api" : "scraper",
    capabilities: config.business ? GRAPH_CAPABILITIES : SCRAPER_CAPABILITIES,
    profile: {
      handle: config.handle,
      displayName: config.displayName,
      bio: config.bio,
      website: config.website,
      isVerified: config.verified,
      category: config.category,
      avatarHue: config.avatarHue,
    },
    totals: {
      followers: config.followers,
      following: config.following,
      posts: config.totalPosts,
    },
    followerHistory: config.business
      ? buildHistory(rand, config.followers, config.yearlyGrowth, config.spikes)
      : undefined,
    posts: buildPosts(rand, config),
    schemaVersion: 1,
  };
}

/* ——— posts ——— */

function buildPosts(rand: () => number, config: ProfileConfig): Post[] {
  const posts: Post[] = [];
  let daysAgo = rand() * (7 / config.postsPerWeek);
  let captionCursor = Math.floor(rand() * config.captions.length);

  while (daysAgo < 365) {
    const type = pickType(rand, config.typeMix);
    // engagement varies per post: log-normal-ish noise, occasional breakout
    const breakout = rand() > 0.93 ? 2 + rand() * 2.5 : 1;
    const noise = (0.45 + rand() * 1.4) * breakout;
    const likes = Math.max(8, Math.round(config.followers * config.engagementRate * noise));
    const comments = Math.max(1, Math.round(likes * (0.015 + rand() * 0.035)));
    const source = config.business ? "graph_api" : "scraped";
    const caption = config.captions[captionCursor % config.captions.length]!;
    captionCursor += 1 + Math.floor(rand() * 2);
    const hashtags = pickTags(rand, config.hashtags);
    const [vMin, vMax] = config.viewsMultiplier;

    posts.push({
      id: `${config.handle}-post-${posts.length}`,
      type,
      postedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      caption,
      hashtags,
      permalink: `https://instagram.com/${config.handle}`,
      thumbnailHue: (config.avatarHue + Math.floor(rand() * 140) - 70 + 360) % 360,
      metrics: {
        likes: { value: likes, source },
        comments: { value: comments, source },
        ...(type === "reel"
          ? { views: { value: Math.round(likes * (vMin + rand() * (vMax - vMin))), source } }
          : {}),
        ...(config.business
          ? {
              reach: { value: Math.round(likes * (5 + rand() * 4)), source: "graph_api" as const },
              saves: { value: Math.round(likes * (0.04 + rand() * 0.08)), source: "graph_api" as const },
              shares: { value: Math.round(likes * (0.02 + rand() * 0.05)), source: "graph_api" as const },
            }
          : {}),
      },
    });
    daysAgo += (7 / config.postsPerWeek) * (0.35 + rand() * 1.3);
  }
  return posts;
}

function pickType(rand: () => number, mix: Record<PostType, number>): PostType {
  const r = rand() * (mix.reel + mix.image + mix.carousel);
  if (r < mix.reel) return "reel";
  if (r < mix.reel + mix.image) return "image";
  return "carousel";
}

function pickTags(rand: () => number, pool: string[]): string[] {
  const count = Math.min(pool.length, 2 + Math.floor(rand() * 3));
  const tags = [...pool];
  // seeded partial shuffle
  for (let i = tags.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tags[i], tags[j]] = [tags[j]!, tags[i]!];
  }
  return tags.slice(0, count);
}

/* ——— follower history (Business accounts only) ——— */

function buildHistory(
  rand: () => number,
  followers: number,
  yearlyGrowth: number,
  spikes: GrowthSpike[] = [],
): TimeSeriesPoint[] {
  const start = followers / (1 + yearlyGrowth);
  const dailyFactor = (followers / start) ** (1 / 365);
  const raw: number[] = [];
  let value = start;

  for (let i = 364; i >= 0; i--) {
    const wobble = 1 + (rand() - 0.48) * 0.0015;
    let spikeBoost = 0;
    for (const spike of spikes) {
      // gaussian bump centered at spike.daysAgo
      const distance = (i - spike.daysAgo) / (spike.durationDays / 2);
      spikeBoost += spike.magnitude * Math.exp(-distance * distance);
    }
    value = value * dailyFactor * wobble * (1 + spikeBoost);
    raw.push(value);
  }

  // normalize so the series lands EXACTLY on the follower total —
  // the hero card and the chart must never disagree
  const scale = followers / raw[raw.length - 1]!;
  return raw.map((v, index) => {
    const daysAgo = 364 - index;
    const date = new Date(Date.now() - daysAgo * 86_400_000);
    return {
      date: date.toISOString().slice(0, 10),
      value: Math.round(v * scale),
    };
  });
}

/* ——— generic fallback for unknown handles ——— */

const GENERIC_CATEGORIES = [
  "Digital Creator", "Restaurant", "Beauty & Cosmetics", "Fitness Studio",
  "Real Estate", "Photography", "Fashion Brand", "Coffee Shop", "Agency",
];

const GENERIC_BIOS = [
  "Building something people love, one post at a time.",
  "Est. 2016 · crafted with obsession",
  "Your daily dose of inspiration ✦",
  "We make the good stuff.",
  "Quality over everything.",
];

const GENERIC_CAPTIONS = [
  "Behind the scenes of our latest drop — the details make the difference.",
  "New week, new goals. Who's with us?",
  "This one took months to get right. Worth every minute.",
  "The response to this has been unreal. Thank you 🙏",
  "Small team, big dreams.",
  "Everything you need to know, in 30 seconds.",
  "We asked. You answered. Here's what's changing.",
  "Sneak peek at what's coming next month.",
];

function genericConfig(handle: string): ProfileConfig {
  const rand = mulberry32(hash(`cfg:${handle}`));
  const business = handle.length % 2 === 0;
  return {
    handle,
    displayName: handle
      .split(/[._]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    bio: GENERIC_BIOS[Math.floor(rand() * GENERIC_BIOS.length)]!,
    website: rand() > 0.25 ? `${handle.replace(/[._]/g, "")}.com` : undefined,
    verified: rand() > 0.8,
    category: GENERIC_CATEGORIES[Math.floor(rand() * GENERIC_CATEGORIES.length)]!,
    avatarHue: Math.floor(rand() * 360),
    followers: Math.round(10 ** (3.5 + rand() * 3.4)),
    following: Math.round(80 + rand() * 1500),
    totalPosts: Math.round(200 + rand() * 2400),
    business,
    engagementRate: 0.008 + rand() * 0.03,
    postsPerWeek: 1.5 + rand() * 3.5,
    typeMix: { reel: 0.45, image: 0.3, carousel: 0.25 },
    viewsMultiplier: [8, 20],
    captions: GENERIC_CAPTIONS,
    hashtags: [`#${handle.replace(/[._]/g, "")}`, "#instagood", "#local"],
    yearlyGrowth: 0.04 + rand() * 0.25,
  };
}

/* ——— seeded RNG ——— */

function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
