/**
 * ScraperProvider server core — the ONLY place that talks to Instagram.
 * Runs inside the Vercel serverless function (api/instagram.ts) and the
 * Vite dev-server middleware; the browser never calls Instagram directly
 * (CORS + key/UA hygiene, §9.3).
 *
 * Honesty contract: everything returned comes verbatim from Instagram's
 * public web profile endpoint. Metrics Instagram doesn't expose (reach,
 * saves, shares, impressions, follower history) are simply absent —
 * the Capability Engine renders them locked. Nothing is estimated.
 */

import type { Capability, Post, PostType, Snapshot } from "../../src/domain/types";

export type ProviderErrorCode = "private" | "not_found" | "rate_limited" | "unavailable";

export class ProviderHttpError extends Error {
  constructor(
    public code: ProviderErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

/* ——— vendor adapters ———
 * One contract: handle → RawUser (Instagram's web-profile shape).
 * Every vendor below returns that shape, so mapping stays identical and
 * switching providers is a matter of which adapter is selected. */

type VendorAdapter = (handle: string) => Promise<RawUser>;

/** ScrapeCreators (https://scrapecreators.com) — returns IG's web shape verbatim. */
const scrapeCreatorsAdapter =
  (apiKey: string): VendorAdapter =>
  async (handle) => {
    const response = await safeFetch(
      `https://api.scrapecreators.com/v1/instagram/profile?handle=${encodeURIComponent(handle)}`,
      { headers: { "x-api-key": apiKey, accept: "application/json" } },
    );
    if (response.status === 404) throw new ProviderHttpError("not_found");
    if (response.status === 429) throw new ProviderHttpError("rate_limited");
    if (response.status === 401 || response.status === 402 || response.status === 403) {
      throw new ProviderHttpError("unavailable", `Vendor auth/credits issue (${response.status})`);
    }
    if (!response.ok) throw new ProviderHttpError("unavailable", `Vendor returned ${response.status}`);
    const payload = await safeJson(response);
    const user = (payload as { data?: { user?: RawUser | null } })?.data?.user;
    if (!user) throw new ProviderHttpError("not_found");
    return user;
  };

/** Instagram's own public web endpoint — keyless; often login-walled from datacenter IPs. */
const directAdapter: VendorAdapter = async (handle) => {
  const response = await safeFetch(
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
    {
      headers: {
        "x-ig-app-id": "936619743392459", // Instagram web client app id (public)
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        accept: "*/*",
      },
    },
  );
  if (response.status === 404) throw new ProviderHttpError("not_found");
  if (response.status === 429) throw new ProviderHttpError("rate_limited");
  if (!response.ok) throw new ProviderHttpError("unavailable", `Instagram returned ${response.status}`);
  const payload = await safeJson(response);
  const user = (payload as { data?: { user?: RawUser | null } })?.data?.user;
  if (!user) throw new ProviderHttpError("not_found");
  return user;
};

function resolveAdapter(): VendorAdapter {
  const key = process.env.SCRAPECREATORS_API_KEY;
  return key ? scrapeCreatorsAdapter(key) : directAdapter;
}

export async function fetchPublicSnapshot(handle: string): Promise<Snapshot> {
  const user = await resolveAdapter()(handle);
  if (user.is_private) throw new ProviderHttpError("private");
  return mapUser(handle, user);
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ProviderHttpError("unavailable", "Network error reaching provider");
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ProviderHttpError("unavailable", "Unexpected response format");
  }
}

/* ——— mapping ——— */

interface RawUser {
  is_private?: boolean;
  full_name?: string;
  biography?: string;
  external_url?: string | null;
  is_verified?: boolean;
  category_name?: string | null;
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  edge_followed_by?: { count?: number };
  edge_follow?: { count?: number };
  edge_owner_to_timeline_media?: { count?: number; edges?: { node: RawMedia }[] };
}

interface RawMedia {
  id?: string;
  shortcode?: string;
  __typename?: string;
  product_type?: string;
  is_video?: boolean;
  taken_at_timestamp?: number;
  display_url?: string;
  thumbnail_src?: string;
  video_view_count?: number;
  edge_media_to_caption?: { edges?: { node?: { text?: string } }[] };
  edge_liked_by?: { count?: number };
  edge_media_preview_like?: { count?: number };
  edge_media_to_comment?: { count?: number };
}

function mapUser(handle: string, user: RawUser): Snapshot {
  const edges = user.edge_owner_to_timeline_media?.edges ?? [];
  const posts = edges
    .map((edge, index) => mapMedia(handle, edge.node, index))
    .filter((p): p is Post => p !== null);

  const capabilities: Capability[] = ["followers"];
  if (posts.some((p) => p.metrics.likes || p.metrics.comments)) capabilities.push("engagement");
  if (posts.some((p) => p.metrics.views)) capabilities.push("views");

  return {
    id: `snap-${handle}-${Date.now()}`,
    capturedAt: new Date().toISOString(),
    provider: "scraper",
    capabilities,
    profile: {
      handle,
      displayName: user.full_name?.trim() || handle,
      bio: user.biography ?? "",
      website: cleanUrl(user.external_url),
      isVerified: Boolean(user.is_verified),
      category: user.category_name ?? undefined,
      avatarHue: hueOf(handle),
      avatarUrl: user.profile_pic_url_hd ?? user.profile_pic_url,
    },
    totals: {
      followers: user.edge_followed_by?.count ?? 0,
      following: user.edge_follow?.count ?? 0,
      posts: user.edge_owner_to_timeline_media?.count ?? posts.length,
    },
    // no followerHistory: Instagram does not expose it publicly (§1.2)
    posts,
    schemaVersion: 1,
  };
}

function mapMedia(handle: string, node: RawMedia, index: number): Post | null {
  if (!node?.id && !node?.shortcode) return null;
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const likeCount = node.edge_liked_by?.count ?? node.edge_media_preview_like?.count;
  const commentCount = node.edge_media_to_comment?.count;

  return {
    id: node.id ?? node.shortcode!,
    type: mediaType(node),
    postedAt: node.taken_at_timestamp
      ? new Date(node.taken_at_timestamp * 1000).toISOString()
      : new Date().toISOString(),
    caption,
    hashtags: extractHashtags(caption),
    permalink: node.shortcode
      ? `https://www.instagram.com/p/${node.shortcode}/`
      : `https://www.instagram.com/${handle}/`,
    thumbnailHue: (hueOf(handle) + index * 37) % 360,
    thumbnailUrl: node.thumbnail_src ?? node.display_url,
    metrics: {
      // hidden like counts arrive as -1 → metric is absent, never zero
      ...(likeCount !== undefined && likeCount >= 0
        ? { likes: { value: likeCount, source: "scraped" as const } }
        : {}),
      ...(commentCount !== undefined && commentCount >= 0
        ? { comments: { value: commentCount, source: "scraped" as const } }
        : {}),
      ...(node.is_video && typeof node.video_view_count === "number" && node.video_view_count >= 0
        ? { views: { value: node.video_view_count, source: "scraped" as const } }
        : {}),
    },
  };
}

function mediaType(node: RawMedia): PostType {
  if (node.product_type === "clips") return "reel";
  if (node.__typename === "GraphSidecar") return "carousel";
  if (node.is_video || node.__typename === "GraphVideo") return "reel";
  return "image";
}

function extractHashtags(caption: string): string[] {
  return [...new Set(caption.match(/#[\p{L}\p{N}_]+/gu) ?? [])].slice(0, 12);
}

function cleanUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function hueOf(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
