import type { PostType } from "@/domain/types";

/**
 * Reference datasets (Phase 5) — the permanent development, testing and demo
 * fixtures. Two simulate connected Business accounts (full metrics + history),
 * three simulate public profiles (observed metrics, locked reach/saves/shares,
 * no follower history) so every honesty state stays demoable.
 */

export interface GrowthSpike {
  /** Center of the spike, days before today. */
  daysAgo: number;
  /** Peak extra daily growth, as a fraction of followers (e.g. 0.002). */
  magnitude: number;
  durationDays: number;
}

export interface ProfileConfig {
  handle: string;
  displayName: string;
  bio: string;
  website?: string;
  verified: boolean;
  category: string;
  avatarHue: number;
  followers: number;
  following: number;
  totalPosts: number;
  /** true → graph_api provider: full capabilities + follower history. */
  business: boolean;
  /** Base per-post engagement as a fraction of followers. */
  engagementRate: number;
  postsPerWeek: number;
  typeMix: Record<PostType, number>; // weights, sum ~1
  /** Reel views as a multiple of likes: [min, max]. */
  viewsMultiplier: [number, number];
  captions: string[];
  hashtags: string[];
  yearlyGrowth: number;
  spikes?: GrowthSpike[];
}

export const REFERENCE_PROFILES: Record<string, ProfileConfig> = {
  halifaxhoney: {
    handle: "halifaxhoney",
    displayName: "Halifax Honey Co.",
    bio: "Raw honey from our hives on the Northumberland shore 🍯 Small-batch, never blended. Find us Saturdays at the Seaport Market.",
    website: "halifaxhoney.ca",
    verified: false,
    category: "Food & Beverage",
    avatarHue: 42,
    followers: 8_460,
    following: 612,
    totalPosts: 486,
    business: true,
    engagementRate: 0.046,
    postsPerWeek: 2.6,
    typeMix: { image: 0.55, carousel: 0.25, reel: 0.2 },
    viewsMultiplier: [10, 22],
    yearlyGrowth: 0.31,
    spikes: [{ daysAgo: 60, magnitude: 0.003, durationDays: 18 }], // summer market season
    captions: [
      "First harvest of the season is in. Wildflower, and it tastes like July.",
      "Meet the ladies of Hive 4 — our hardest workers and worst listeners.",
      "Creamed honey is back on the shelf. It sold out in 9 days last time, just saying.",
      "Why raw honey crystallizes (and why that's a good sign). Save this one.",
      "Saturday, 8am, Seaport Market. Come say hi, leave with a jar.",
      "From frame to jar in one video. No shortcuts, no blending, no nonsense.",
      "Our buckwheat honey is dark, malty, and completely divisive. You'll love it or you won't.",
      "Behind every jar: about 1,152 bee-hours. We did the math.",
      "New stockist alert — you can now find us at Local Source on Agricola.",
      "The frost came early this year. Here's what that means for the fall harvest.",
      "Gift boxes are live on the site. Three jars, one wooden dipper, zero effort for you.",
    ],
    hashtags: ["#halifaxhoney", "#rawhoney", "#novascotia", "#supportlocal", "#seaportmarket", "#beekeeping", "#eastcoastliving"],
  },

  buildit: {
    handle: "buildit",
    displayName: "BUILD IT",
    bio: "Design-build studio · Kitchens, additions, full renovations. We show the mess, not just the reveal. HRM + surrounding.",
    website: "builditstudio.ca",
    verified: false,
    category: "Construction Company",
    avatarHue: 214,
    followers: 23_150,
    following: 890,
    totalPosts: 742,
    business: true,
    engagementRate: 0.033,
    postsPerWeek: 4.1,
    typeMix: { reel: 0.5, carousel: 0.3, image: 0.2 },
    viewsMultiplier: [14, 30],
    yearlyGrowth: 0.42,
    spikes: [{ daysAgo: 95, magnitude: 0.006, durationDays: 10 }], // viral before/after reel
    captions: [
      "Six weeks, one load-bearing wall, zero regrets. Full walkthrough in this reel.",
      "The before and after you've been waiting for. Swipe to the 1968 original.",
      "Day 14: drywall week. The least glamorous, most important week of any reno.",
      "Client asked for 'quiet luxury but make it survive three kids.' Delivered.",
      "What $85k actually gets you in a kitchen reno right now — honest breakdown.",
      "We found THIS behind the wall. Every old house has one surprise. This one had four.",
      "Cabinet install day. The moment a site starts feeling like a home.",
      "Why we always over-order tile by 10% (learn from our 2019 mistake).",
      "Meet the crew: Dario has framed 212 houses and still checks every level twice.",
      "Small bathroom, big moves. 48 square feet, completely reimagined.",
      "The reveal 🏠 Nine months from first sketch to final walkthrough.",
      "Answering your top 5 questions about additions — costs, timelines, permits.",
    ],
    hashtags: ["#buildit", "#renovation", "#beforeandafter", "#halifaxbuilder", "#designbuild", "#kitchenreno", "#hrm"],
  },

  onelovemarket: {
    handle: "onelovemarket",
    displayName: "One Love Market",
    bio: "Caribbean grocery & kitchen 🇯🇲🇹🇹 Fresh produce Thursdays · Hot food till 7 · One love, one market.",
    website: "onelovemarket.ca",
    verified: false,
    category: "Grocery Store",
    avatarHue: 130,
    followers: 12_720,
    following: 1_140,
    totalPosts: 903,
    business: false, // public profile — prospect view
    engagementRate: 0.052,
    postsPerWeek: 3.4,
    typeMix: { image: 0.45, reel: 0.35, carousel: 0.2 },
    viewsMultiplier: [9, 20],
    yearlyGrowth: 0.24,
    captions: [
      "Fresh shipment just landed: scotch bonnets, callaloo, green banana, and yes — the good festival mix.",
      "Thursday produce drop 🥭 First come, first served, no exceptions (sorry Marcus).",
      "The oxtail special is back Friday. You already know what to do.",
      "How to pick a ripe plantain — a public service announcement.",
      "Doubles day. If you know, you're already in line.",
      "New in the freezer: saltfish fritters ready to fry at home.",
      "Big up everyone who came through for the long weekend. We're restocked and ready.",
      "Curry goat Sunday. Pot's on from 11.",
      "Ask Auntie P anything: this week, the difference between yam and yampi.",
      "Community fridge is stocked. Take what you need, leave what you can. One love.",
      "We taste-tested 6 hot sauces so you don't have to. Ranking in the carousel.",
    ],
    hashtags: ["#onelovemarket", "#caribbeanfood", "#halifaxeats", "#jamaicanfood", "#trinifood", "#supportlocal", "#islandvibes"],
  },

  nike: {
    handle: "nike",
    displayName: "Nike",
    bio: "Spotlighting athlete* stories. *If you have a body, you're an athlete.",
    website: "nike.com",
    verified: true,
    category: "Sportswear & Athletic",
    avatarHue: 0,
    followers: 302_400_000,
    following: 158,
    totalPosts: 1_243,
    business: false, // competitor view — public data only
    engagementRate: 0.0011,
    postsPerWeek: 4.6,
    typeMix: { reel: 0.55, image: 0.25, carousel: 0.2 },
    viewsMultiplier: [22, 45],
    yearlyGrowth: 0.05,
    captions: [
      "Greatness isn't given. It's 4:45am, every morning, for eleven years.",
      "She was told to slow down. She set a national record instead.",
      "The shoes don't run the race. But they've never missed one.",
      "From a village pitch to the world stage. Same ball. Same love.",
      "Rest is part of the work. Recovery week with the marathon squad.",
      "You don't rise to the occasion. You fall to your training.",
      "New colorway. Same promise: Just Do It.",
      "90 seconds with the fastest woman in the world.",
      "What losing taught the champion. Full story, link in bio.",
      "Every pro was once the kid who didn't make the team.",
    ],
    hashtags: ["#justdoit", "#nike", "#nikerunning", "#airmax", "#training"],
  },

  apple: {
    handle: "apple",
    displayName: "Apple",
    bio: "Everyone has a story to tell. Tag #ShotoniPhone to take part.",
    website: "apple.com",
    verified: true,
    category: "Consumer Electronics",
    avatarHue: 220,
    followers: 34_100_000,
    following: 9,
    totalPosts: 1_087,
    business: false, // public data only
    engagementRate: 0.0038,
    postsPerWeek: 1.6,
    typeMix: { image: 0.6, carousel: 0.28, reel: 0.12 },
    viewsMultiplier: [15, 28],
    yearlyGrowth: 0.07,
    captions: [
      "Golden hour in Jodhpur. Shot on iPhone by Priya S.",
      "One wave, one breath. Shot on iPhone by Keahi M., Oahu.",
      "The city that never sleeps, at its quietest. 4:52am, Manhattan.",
      "Macro mode meets morning frost. Shot on iPhone by Tomas L.",
      "A grandmother's kitchen, three generations, one table. Shot on iPhone.",
      "Northern lights over Tromsø — handheld, no tripod. Shot on iPhone by Elin B.",
      "Every color of Lagos on market day. Shot on iPhone by Chidi O.",
      "Slow Shutter, fast river. Shot on iPhone by Mara V., Patagonia.",
      "The last light of harvest season. Shot on iPhone by Jun T., Hokkaido.",
    ],
    hashtags: ["#shotoniphone", "#apple", "#iphonephotography"],
  },
};

/** Suggestion chips for the Home screen. */
export const REFERENCE_HANDLES = Object.keys(REFERENCE_PROFILES);
