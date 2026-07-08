/** Canonical data model (§6 of the architecture doc). */

export type Provider = "scraper" | "graph_api" | "mock";
export type MetricSource = "graph_api" | "scraped" | "derived";

export type Capability =
  | "followers"
  | "engagement"
  | "views"
  | "reach"
  | "saves"
  | "shares"
  | "impressions"
  | "history";

export interface MetricValue {
  value: number;
  source: MetricSource;
}

export type PostType = "image" | "carousel" | "reel";

export interface Post {
  id: string;
  type: PostType;
  postedAt: string; // ISO
  caption: string;
  hashtags: string[];
  permalink: string;
  /** Fallback gradient hue (mock artwork + real-thumbnail error fallback). */
  thumbnailHue: number;
  /** Real thumbnail from the provider; absent on mock data. */
  thumbnailUrl?: string;
  metrics: {
    /** Absent when the account hides like counts — never fabricated as 0. */
    likes?: MetricValue;
    comments?: MetricValue;
    views?: MetricValue;
    reach?: MetricValue;
    saves?: MetricValue;
    shares?: MetricValue;
  };
}

export interface Profile {
  handle: string;
  displayName: string;
  bio: string;
  website?: string;
  isVerified: boolean;
  category?: string;
  /** Seeded hue for the avatar treatment (fallback when no photo). */
  avatarHue: number;
  /** Real profile picture from the provider; absent on mock data. */
  avatarUrl?: string;
}

export interface TimeSeriesPoint {
  date: string; // ISO date (day resolution)
  value: number;
}

export interface Snapshot {
  id: string;
  capturedAt: string;
  provider: Provider;
  /** What this snapshot can truthfully show — feeds the Capability Engine. */
  capabilities: Capability[];
  profile: Profile;
  totals: { followers: number; following: number; posts: number };
  /** Graph API only. Absent for scraped profiles — never interpolated. */
  followerHistory?: TimeSeriesPoint[];
  posts: Post[];
  schemaVersion: 1;
}

/** Legacy alias kept for the Capability Engine signature. */
export type SnapshotMeta = Pick<Snapshot, "id" | "capturedAt" | "provider" | "capabilities">;
