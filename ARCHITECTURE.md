# Instagram Performance Dashboard
## Architecture & Design Document — v1.0
**Growth Boss** · July 2026 · Status: **Approved with scope adjustments (v1.1 of this doc)** — implementation started at Phase 1

> **Scope adjustments applied:** V1 storage is in-memory (StorageAdapter kept; IndexedDB persistence → V1.1) · History, Snapshot Timeline, Settings → V1.1 · Command Palette → postponed · Stronger Apple-Health visual hierarchy (§7.6) · New Profile Snapshot hero card (§8, W3).

---

## 0. Executive Summary & Key Recommendations

Before the nine deliverables, five architectural decisions I recommend that go beyond the brief:

1. **Capability-aware metrics, not "N/A" labels.** With the hybrid data model (public scraping + Instagram Graph API), every metric carries a `source` and `confidence`. The UI renders three states per metric: *measured* (Graph API), *observed* (scraped), and *locked* (needs Business connection — shown as an elegant upsell state, never a fake number). This makes honesty a design feature instead of a footnote.

2. **Snapshot-first data model.** Instead of treating snapshots as an export side-effect, make the snapshot the atomic unit of the whole system: every analysis *is* a snapshot, and the dashboard always renders *from* a snapshot. This gives you time-series comparison, re-viewing within a session (persistent history arrives with V1.1 storage), PDF export, and caching for free — and it's what turns V1 into a commercial product later.

3. **Derived metrics computed client-side from raw data.** Store raw post/profile data; compute engagement rate, averages, and growth in a pure `analytics/` layer. When you later change the engagement formula or add AI insights, historical snapshots recompute instantly without re-scraping.

4. **Storage behind an adapter, in-memory for V1.** V1 needs no backend of its own beyond a thin proxy for the scraper API key. The `StorageAdapter` interface ships with an `InMemoryAdapter` (session-scoped); IndexedDB persistence lands in V1.1 and Postgres/Supabase later — no UI changes at any step.

5. **Export = print stylesheet, not canvas hacking.** A dedicated `/report/:snapshotId` route renders the dashboard in a paginated, print-optimized layout. PDF comes from the browser print engine (and later Playwright server-side). This preserves dashboard fidelity far better than html2canvas screenshots.

Everything else follows the brief. Deliverables below.

---

## 1. Product Architecture

### 1.1 Conceptual layers

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION      Screens · Widgets · Design System     │
├─────────────────────────────────────────────────────────┤
│  APPLICATION       Stores (Zustand) · Queries (React     │
│                    Query) · Router · Widget Registry     │
├─────────────────────────────────────────────────────────┤
│  DOMAIN            Analytics engine · Normalizers ·      │
│                    Snapshot builder · Period filters     │
├─────────────────────────────────────────────────────────┤
│  DATA              DataProvider interface                │
│                    ├── MockProvider        (build phase) │
│                    ├── ScraperProvider     (any public)  │
│                    └── GraphApiProvider    (business)    │
│                    StorageAdapter (memory→IDB→cloud)     │
└─────────────────────────────────────────────────────────┘
```

Rules: presentation never touches DATA directly; widgets consume typed view-models from DOMAIN; providers are swappable behind one interface. This is what lets you build the entire UI on `MockProvider` first (per the development strategy) and flip to live data with zero UI changes.

### 1.2 Hybrid data strategy

| | ScraperProvider | GraphApiProvider |
|---|---|---|
| Works on | Any public profile | Connected Business/Creator accounts only |
| Followers, posts, likes, comments | ✅ | ✅ |
| Views (Reels) | ✅ (public play counts) | ✅ |
| Reach, saves, shares, impressions | ❌ | ✅ |
| Follower history | ❌ (built up from snapshots over time) | ✅ (last 30d natively) |
| Demographics (future) | ❌ | ✅ |

The system resolves a profile through a **ProviderResolver**: if the analyzed handle matches a connected Business account → GraphApiProvider (full metrics); otherwise → ScraperProvider (observed metrics + locked states). Both normalize into the same canonical `Snapshot` shape (§6).

**Important consequence:** for scraped profiles, follower *evolution* is only as deep as your snapshot history. The product should therefore encourage recurring analysis (and later, scheduled snapshots) — the chart shows real history where it exists and an honest empty state where it doesn't. Never interpolate fake curves. *(With V1's in-memory storage, cross-session history begins when V1.1 persistence ships; the data model is already shaped for it.)*

### 1.3 Core product loop

```
Search → Resolve provider → Fetch → Normalize → Persist Snapshot
      → Compute analytics → Render dashboard → (optional) Export
```

### 1.4 Extension points reserved for the roadmap

- **Widget Registry** (§5): future widgets (AI Insights, Benchmark, Demographics) register themselves; layout config decides visibility. V1 config is hardcoded; the mechanism exists.
- **`Snapshot.extensions`** map: typed, versioned bucket for future modules' data without schema migrations.
- **Insight pipeline stub:** `analytics/` exposes `deriveInsights(snapshot): Insight[]` returning `[]` in V1 — the seam where AI plugs in.
- **Multi-tenancy seam:** every entity carries `workspaceId` (constant `"default"` in V1).
- **Report templates:** export route takes a `template` param (`"standard"` only in V1; white-label later).

---

## 2. User Journey

### 2.1 Primary journey — Analyze a profile

| Step | User | System | Feel |
|---|---|---|---|
| 1 | Opens app | Home: single centered search field, recent analyses below | Calm, focused, one obvious action |
| 2 | Types `@nike`, `nike`, or a URL | Input normalized live; validated handle shown as a chip with avatar preview (debounced lookup) | Confidence before committing |
| 3 | Clicks **Analyze** (or ⏎) | Loading sequence: staged checkmarks (§ wireframe W2), real progress mapped to actual fetch stages | Premium, trustworthy; 3–15 s |
| 4 | Lands on dashboard | Snapshot saved automatically; header → KPIs → charts render with staggered fade-up animation | "Wow" moment |
| 5 | Adjusts time filter | All widgets recompute from cached snapshot data — instant, no refetch | Fluid |
| 6 | Explores posts, opens post detail | Detail sheet slides over; deep-linkable | Depth without leaving context |
| 7 | Exports PDF | Report route renders, print dialog / download | Shareable artifact |

### 2.2 Secondary journeys

- **Re-analyze known profile (V1, session-scoped):** Home shows profiles analyzed this session → one click re-runs analysis → new snapshot appended.
- **Failure paths (V1):** private profile → friendly explainer card; rate-limited/network fail → retry with cached last snapshot offered; handle not found → inline suggestion.
- **Revisit past analysis (V1.1):** History screen → pick profile → pick snapshot date → dashboard renders from stored data, no network.
- **Business account connect (V1.1, hybrid):** Settings → "Connect Instagram Business" (Meta OAuth) → locked KPI cards become measured ones.

---

## 3. Screen Map

```
V1 — Search → Dashboard → Export
S0  Shell (minimal sidebar + top bar, theme toggle)
│
├── S1  Home / Search            /
│       └── search hero, profiles analyzed this session
├── S2  Loading (overlay state, not a route — cancellable)
├── S3  Dashboard                /p/:handle
│       ├── S3a Post Detail      /p/:handle/post/:postId   (sheet over S3)
│       └── S3b Snapshot picker  ?snapshot=:id             (param, not page)
├── S5  Report (print/export)    /report/:snapshotId
└── S7  Empty/error states (private profile, not found, offline)

V1.1 — deferred
├── S4  History                  /history   (snapshot timeline per profile)
├── S6  Settings                 /settings  (theme, providers, Business connect)
└── Command palette ⌘K
```

V1 is deliberately shallow: two primary screens (Home, Dashboard) plus the report route. Sidebar renders Search + theme toggle only; History and Settings slots are reserved in the layout so V1.1 adds entries without redesign. No auth screens in V1 (internal tool).

---

## 4. Navigation Structure

- **Persistent left sidebar** (collapsible to icons, 64 px collapsed / 240 px expanded): Search (Home) + theme toggle in V1; History and Settings entries arrive in V1.1. Linear-style.
- **Dashboard top bar** (sticky within S3): profile identity (avatar + handle) · time-filter segmented control · snapshot date selector · Export button. The time filter lives here — global to the page, always visible.
- **In-page anchor rail** (right side, desktop ≥1280 px): dots for Overview / Growth / Engagement / Content / Activity — the dashboard is one scrollable page, not tabs. Scrolling > tab-hunting for an executive overview.
- **Keyboard (V1):** `/` focuses search · `1–7` time-filter presets · `E` export · `esc` closes sheets. Command palette ⌘K postponed to V1.1.
- **Mobile:** sidebar becomes bottom tab bar (Search · History · Settings); anchor rail hidden; time filter becomes horizontal scroll chips under the header.

---

## 5. Component Hierarchy

```
<App>
└── <AppShell>                        sidebar, top bar, theme provider
    ├── <HomeScreen>
    │   ├── <ProfileSearch>           input + normalizer + validation chip
    │   └── <RecentProfiles>          card grid from stored snapshots
    ├── <AnalysisOverlay>             staged loading experience
    ├── <DashboardScreen>             /p/:handle
    │   ├── <DashboardHeader>         profile identity, TimeFilter, SnapshotPicker, ExportMenu
    │   └── <WidgetGrid>              renders from Widget Registry config
    │       ├── <ProfileSnapshotWidget>  premium identity hero card (§8 W3)
    │       │                            (compact identity lives in sticky top bar)
    │       ├── <QuickMetricsWidget>  → <KpiCard metric state={measured|observed|locked}>
    │       ├── <FollowersWidget>     line chart + period comparison
    │       ├── <EngagementWidget>    likes/comments/views trends, ER donut
    │       ├── <PostsGalleryWidget>  → <PostCard> → opens <PostDetailSheet>
    │       ├── <TopPostsWidget>      sortable ranking (TanStack Table)
    │       ├── <PublishingCalendarWidget>  heatmap + frequency bars
    │       └── <ExportWidget>        (slot in header, not grid, in V1)
    ├── <ReportScreen>                print-layout composition of same widgets
    └── (V1.1: <HistoryScreen>, <SettingsScreen>)
```

### Widget contract (the key abstraction)

```ts
interface WidgetDefinition {
  id: string;                       // "followers-evolution"
  title: string;
  component: React.LazyExoticComponent<WidgetComponent>;
  requiredCapabilities: Capability[];  // e.g. ["reach"] → auto-locked on scraper data
  gridSpan: { desktop: number; tablet: number; mobile: number };
  exportable: boolean;
}
type WidgetComponent = (props: { snapshot: Snapshot; range: DateRange }) => JSX.Element;
```

Every widget receives only `snapshot + range` — pure, mockable, independently developable, and future enable/disable is a config array change. Shared primitives underneath: `<WidgetCard>` (frame: title, subtitle, skeleton, error, locked overlay), `<KpiCard>`, `<TrendBadge>`, `<EmptyState>`, `<LockedState>`, `<ChartTooltip>`.

---

## 6. Data Model

Canonical TypeScript types (persisted shapes; all provider output normalizes into these):

```ts
type MetricSource = "graph_api" | "scraped" | "derived";
type Capability = "followers" | "engagement" | "views" | "reach"
                | "saves" | "shares" | "impressions" | "history";

interface Profile {
  id: string;                    // internal UUID
  workspaceId: string;           // "default" in V1
  handle: string;                // normalized, lowercase, no @
  displayName: string;
  bio?: string;
  website?: string;
  avatarUrl: string;             // cached locally at snapshot time
  isVerified: boolean;
  isBusinessConnected: boolean;
  category?: string;
  firstAnalyzedAt: string;       // ISO
}

interface Snapshot {
  id: string;
  profileId: string;
  capturedAt: string;
  provider: "scraper" | "graph_api" | "mock";
  capabilities: Capability[];    // what this snapshot can truthfully show
  totals: { followers: number; following: number; posts: number };
  followerHistory?: TimeSeriesPoint[];   // Graph API only
  posts: Post[];                 // posts visible at capture time
  accountInsights?: AccountInsights;     // Graph API only (reach, impressions…)
  extensions: Record<string, unknown>;   // future modules (versioned)
  schemaVersion: 1;
}

interface Post {
  id: string;                    // IG media id / shortcode
  type: "image" | "carousel" | "reel" | "video";
  postedAt: string;
  caption?: string;
  thumbnailUrl: string;          // cached
  permalink: string;
  metrics: {
    likes: MetricValue;
    comments: MetricValue;
    views?: MetricValue;         // reels/video
    reach?: MetricValue;         // graph only
    saves?: MetricValue;         // graph only
    shares?: MetricValue;        // graph only
  };
}

interface MetricValue { value: number; source: MetricSource; }
interface TimeSeriesPoint { date: string; value: number; }

// ——— Derived at render time, never persisted ———
interface PeriodAnalytics {
  range: DateRange;
  postsPublished: number;
  avgLikes: number; avgComments: number; avgViews?: number;
  engagementRate: number;        // (likes+comments[+saves+shares]) / followers, per post, averaged
  engagementRateBasis: "public" | "full";   // formula transparency
  followerGrowth?: { absolute: number; percent: number };  // needs ≥2 snapshots or graph history
  postingFrequency: { perWeek: number; byWeekday: number[]; byHour?: number[] };
  topPosts: RankedPost[];
  comparison?: PeriodAnalytics;  // previous equal-length period, when data allows
}
```

**Storage (V1, `InMemoryAdapter` behind `StorageAdapter`):** holds `profiles` and `snapshots` (keyed by profileId+capturedAt) for the session. V1.1 swaps in IndexedDB with the same interface, adding persistence plus thumbnail/avatar blob caching so history and PDF export survive Instagram CDN URL expiry — that detail matters and is easy to miss.

**Engagement-rate honesty:** the ER formula adapts to available capabilities and the basis is displayed in the widget's info tooltip. Scraped ER (likes+comments) and full ER (incl. saves/shares) are labeled differently so numbers are never silently incomparable.

---

## 7. Design System

### 7.1 Foundations

- **Type:** Inter (UI) with `font-feature-settings: "tnum"` for all numerics; scale 12 / 13 / 14 / 16 / 20 / 24 / 32 / 48. KPI values use 32–48 semibold with tight tracking. Optional display face for the KPI numerals later; V1 stays Inter-only for discipline.
- **Spacing:** 4 px base grid; card padding 24; inter-card gap 16 (tablet) / 24 (desktop); page gutter 32–48. Generous by default — whitespace is the aesthetic.
- **Radius:** cards 16 px, inputs/buttons 10 px, chips 999 px.
- **Shadow:** single soft ambient shadow (`0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`); elevation via blur, never borders. Dark mode swaps shadows for subtle surface-tint elevation.

### 7.2 Color

```
Light                             Dark
bg        #F7F7F8   canvas        #0B0B0E
surface   #FFFFFF   cards         #16161A
text-1    #17171A                 #F4F4F5
text-2    #6E6E76                 #A0A0AB
accent    #5B5BD6 (indigo)        #7C7CF0
positive  #1DA07A                 #2BC496
negative  #D6455B                 #F06A7E
chart ramp: accent → #8B8BE8 → #B7B7F2 (monochrome family, Apple-Health-style)
```

One accent. Charts are monochromatic variations of it; green/red reserved exclusively for deltas. Semantic tokens (`--color-surface`, `--color-text-secondary`…) as Tailwind v4 `@theme` variables — dark mode is a token swap, components never hardcode color.

### 7.3 Motion (Framer Motion)

- Dashboard entrance: widgets stagger fade-up (12 px, 40 ms stagger, 300 ms, ease-out). Once per load, never on filter change.
- Number transitions: KPI values animate count-up on first render, cross-fade on filter change.
- Charts: draw-in on entrance only; instant on filter change (responsiveness > spectacle).
- Sheets/overlays: spring, slight scale. `prefers-reduced-motion` respected globally.

### 7.4 Component states

Every widget ships five states from day one: **loading** (skeleton matching final layout), **populated**, **empty** ("No posts in this period"), **error** (retry), **locked** (blurred preview + "Requires Instagram Business connection" + connect CTA). Locked states are designed, not apologized for — they're V1's honest answer to unavailable metrics and V2's upgrade funnel.

### 7.5 Stack mapping

shadcn/ui for primitives (Button, Input, Sheet, Dialog, DropdownMenu, Tabs, Tooltip, Skeleton) restyled by tokens; Recharts styled to spec (no default grids — 1 px dashed hairlines at 8% opacity, custom tooltip card, gradient area fills at 8→0% opacity); TanStack Table headless under TopPosts.

### 7.6 Visual hierarchy — Apple Health rhythm

The dashboard reads as **chapters, not a grid**. Rules:

- **One idea per viewport.** Each section (Overview → Growth → Engagement → Content → Activity) roughly fills a screen height on desktop; the eye rests between them.
- **Section rhythm:** 96 px vertical separation between sections (48 px tablet, 40 px mobile); oversized section titles (24 px semibold) with a one-line secondary description in `text-2` — like Apple Health's category headers.
- **Hero, then detail.** The KPI row shows only **4 hero metrics** (Followers, Growth, Engagement Rate, Posts). Remaining averages live in a quieter, smaller "More metrics" strip below — visible but visually subordinate (14 px values vs 40 px heroes).
- **One chart per row** in the Growth and Engagement chapters — charts get full content width and generous height (320–380 px) rather than competing side-by-side.
- **Max content width 1080 px, centered**, with the canvas breathing on both sides (the Apple Health single-column feel), instead of edge-to-edge BI density.
- **De-emphasize chrome:** no card borders in light mode, section titles outside the cards, tooltips/controls appear on hover only.

---

## 8. Dashboard Wireframes

### W1 — Home / Search

```
┌────────────────────────────────────────────────────────────┐
│ ▍IG Dash            (sidebar: 🔍 Search · 🕘 History · ⚙)   │
│                                                            │
│                                                            │
│               Instagram Performance Dashboard              │
│          Analyze any public Instagram profile              │
│                                                            │
│        ┌──────────────────────────────────┐  ┌─────────┐  │
│        │ @  nike                       ✓  │  │ Analyze │  │
│        └──────────────────────────────────┘  └─────────┘  │
│              ⌐ chip: [◉ nike · Nike ✔ · 302M]              │
│                                                            │
│   Recent                                                   │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│   │ ◉ nike  │ │ ◉ client│ │ ◉ comp  │ │ ◉ pros  │         │
│   │ 2d ago  │ │ 5d ago  │ │ 1w ago  │ │ 2w ago  │         │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
└────────────────────────────────────────────────────────────┘
```

### W2 — Loading overlay

```
        ┌──────────────────────────────┐
        │        ◉ (avatar pulse)      │
        │      Analyzing @nike…        │
        │                              │
        │  ✓ Loading profile           │
        │  ✓ Collecting posts          │
        │  ◌ Gathering metrics         │
        │  ·  Processing data          │
        │  ·  Building dashboard       │
        │                              │
        │  ▓▓▓▓▓▓▓▓░░░░░░  (Cancel)    │
        └──────────────────────────────┘
   Steps bind to real fetch stages; last step completes
   only when first widgets are ready to paint.
```

### W3 — Dashboard (desktop, single scroll page, 1080 px centered column)

```
┌──────────────────────────────────────────────────────────────────┐
│ ▍  ◉ @nike ✔        [7d 15d 30d 90d 6m 1y ⧉]   Jul 8 ▾  [Export] │ ← sticky
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──── PROFILE SNAPSHOT (hero card, gradient wash) ──────────┐  │
│   │                                                           │  │
│   │        ◉◉  (80px avatar)   Nike ✔                         │  │
│   │        @nike · Sportswear & Athletic                      │  │
│   │        "Just do it."  ·  nike.com ↗                       │  │
│   │                                                           │  │
│   │      302.4M          158           1,240                  │  │
│   │      Followers       Following     Posts                  │  │
│   │                                        Analyzed Jul 8 ·   │  │
│   │                                        via public data    │  │
│   └───────────────────────────────────────────────────────────┘  │
│                            (96px air)                            │
│   Overview                                                       │
│   How the account performed in the selected period               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│   │Followers │ │ Growth   │ │ Eng.Rate │ │ Posts    │  ← 4 heroes│
│   │ 302.4M   │ │ +1.2% ↑  │ │ 1.8% ◔   │ │ 24       │            │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│   more · Avg Likes 412K · Avg Comments 3.1K · Avg Views 2.9M     │
│   more · 🔒 Reach · Saves · Shares — requires Business [Connect] │
│                            (96px air)                            │
│   Growth                                                         │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │ Followers Evolution        (full width, 360px tall)       │  │
│   │        ╭──╮      ____╱     + previous period ----         │  │
│   │  _____╱    ╲____╱                                         │  │
│   └───────────────────────────────────────────────────────────┘  │
│                            (96px air)                            │
│   Engagement                                                     │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │ Likes · Comments · Views trend (full width)   ER donut ◔  │  │
│   └───────────────────────────────────────────────────────────┘  │
│                            (96px air)                            │
│   Content                                                        │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │ Gallery  ▣ ▣ ▣ ▣ ▣ ▣            [type ▾] [sort ▾]         │  │
│   └───────────────────────────────────────────────────────────┘  │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │ Top Posts   1 ▣ … 2 ▣ … 3 ▣ …   [rank by: Engagement ▾]   │  │
│   └───────────────────────────────────────────────────────────┘  │
│                            (96px air)                            │
│   Activity                                                       │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │ Publishing heatmap M–S · 4.2 posts/week · streak 12w      │  │
│   └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
     Right edge: ○●○○○ anchor rail (Overview/Growth/Engagement/…)
```

The Profile Snapshot card is the identity moment before analytics begin: oversized avatar, name, bio, and the three account totals as large quiet numerals, on a subtle accent-tinted gradient wash. It replaces the flat profile header strip (the compact identity remains in the sticky top bar). The old dense KPI grid is split per §7.6 into 4 heroes + a subordinate "more metrics" strip.

### W4 — Post Detail (sheet over dashboard)

```
                    ┌──────────────── Sheet ────────────────┐
                    │ ▣ full thumbnail        Reel · Jul 2   │
                    │ Caption (expandable)                   │
                    │ ♥ 412K   💬 3.1K   ▶ 2.9M   ER 2.4%    │
                    │ 🔒 Reach · Saves · Shares  [Connect]   │
                    │ vs profile average:  ♥ +38% ↑ 💬 +12% ↑│
                    │ [Open on Instagram ↗]                  │
                    └────────────────────────────────────────┘
```

Tablet: KPI row wraps 3+3; chart pair stacks. Mobile: everything single-column, time filter as chips, gallery 2-up, top-posts table becomes ranked cards.

---

## 9. Technical Architecture

### 9.1 Repository structure

```
src/
├── app/                 router, providers, shell
├── design-system/       tokens.css, primitives (restyled shadcn), charts/theme
├── widgets/             one folder per widget (component + logic + mock story)
│   └── registry.ts      WidgetDefinition[]  ← extension point
├── domain/
│   ├── analytics/       pure functions: computePeriodAnalytics, rankPosts…
│   ├── normalize/       scraper→Snapshot, graph→Snapshot mappers
│   └── types/           Profile, Snapshot, Post, MetricValue
├── data/
│   ├── providers/       DataProvider iface, MockProvider, ScraperProvider, GraphApiProvider
│   ├── storage/         StorageAdapter iface, InMemoryAdapter (V1.1: IndexedDb)
│   └── queries/         React Query hooks (useSnapshot, useAnalyze, useHistory)
├── stores/              Zustand: ui.ts (theme, sidebar, filter), analysis.ts (loading stages)
└── screens/             Home, Dashboard, History, Report, Settings
mocks/                   realistic fixture profiles (small/mid/huge account shapes)
server/ (thin)           key-holding proxy for scraper API + Meta OAuth callback
```

### 9.2 State ownership

- **React Query** owns all server/async data (analysis fetches, cached snapshots). Query key: `["snapshot", profileId, snapshotId]`.
- **Zustand** owns UI-only state: time filter, theme, sidebar, loading-stage progress, sort choices. Time filter changes never trigger refetch — analytics recompute in a memoized selector over the loaded snapshot.
- **URL** owns shareable state: handle, snapshot id, selected post → any dashboard view is deep-linkable, which the Report route reuses.

### 9.3 Provider layer

```ts
interface DataProvider {
  id: "mock" | "scraper" | "graph_api";
  capabilities(profile: ProfileRef): Capability[];
  fetchProfile(handle: string): Promise<RawProfile>;
  fetchPosts(handle: string, opts: { limit: number }): Promise<RawPost[]>;
  fetchInsights?(handle: string, range: DateRange): Promise<RawInsights>;
}
```

- **MockProvider** ships first (dev phases 1–7): fixtures with realistic distributions, simulated latency to build the loading UX properly, three account archetypes.
- **ScraperProvider** calls the third-party scraping API through the thin server proxy (never expose keys client-side; also solves CORS). Includes rate-limit backoff and response caching (a profile analyzed <1 h ago serves the stored snapshot with a "refresh" affordance).
- **GraphApiProvider** uses Meta Graph API with tokens from Settings OAuth; token refresh handled server-side.

### 9.4 Export pipeline

`/report/:snapshotId` → same widgets, `ReportLayout` (fixed 1280 px, page-break rules, cover block with logo/profile/date range) → `window.print()` with print CSS for PDF; PNG via `html-to-image` on the report container only. Later: server-side Playwright for scheduled/white-label reports — same route, zero rework.

### 9.5 Performance & quality

- Route-level code splitting; each widget `React.lazy` via the registry.
- Virtualized gallery (TanStack Virtual) beyond ~60 posts.
- Thumbnail blob caching arrives with V1.1 IndexedDB storage (CDN expiry protection, §6).
- Recharts wrapped in a `<Chart>` facade — if animation/perf disappoints, swapping the chart lib touches one folder.
- Tooling: Vitest (analytics functions are pure = trivially testable), Storybook-style widget harness pages driven by MockProvider, Playwright smoke for the analyze loop, strict TS, ESLint.

### 9.6 Build order (maps to your development strategy)

| Phase | Deliverable | Depends on |
|---|---|---|
| 1 | Tokens + design-system primitives + shell | — |
| 2 | Navigation, Home | 1 |
| 3 | Dashboard layout, WidgetGrid, registry | 1 |
| 4 | Widgets with skeleton/empty/locked states | 3 |
| 5 | MockProvider + fixtures + loading overlay | — (parallel) |
| 6 | Charts themed, analytics engine + tests | 4, 5 |
| 7 | Interactions: filter, sort, post sheet, ⌘K | 6 |
| 8 | Responsive + dark mode pass | 7 |
| 9 | Report route + PDF/PNG export | 7 |
| 10 | ScraperProvider + proxy; then GraphApiProvider + OAuth | 9 |

---

## 10. Open Questions Before Implementation

1. Which scraping vendor (affects rate limits, cost/profile, and whether Reels view counts are included) — I can shortlist current options when we start Phase 10.
2. Post fetch depth per analysis (last 50? 100? affects cost + 1-year filter usefulness on active accounts).
3. Should V1 auto-refresh recent profiles on open, or only analyze on demand? (Snapshot cadence directly determines follower-evolution quality for scraped profiles.)
4. Brand: Growth Boss visual identity on the report cover from day one?

---

*End of document. Awaiting approval to begin Phase 1 (Design System).*
