# Instagram Performance Dashboard

Premium Instagram analytics for Growth Boss. **Phases 1–5 + Analytics Engine + Engagement chapter complete** ✅

## Publishing chapter

Answers one question: *how consistently is this account publishing, and what
patterns are visible?* Four widgets on `PeriodAnalytics.publishing`
(engine module `cadence.ts`, tested): KPI quartet (posts, avg/week, most
active weekday, content mix) → calendar heatmap (weeks as columns, per-day
intensity, objective 0/1/2/3+ legend) → content-type distribution (stacked
share bar pairing quantity with avg engagement) → posting rhythm (posts per
week including empty weeks, described in facts: "Posted in 9 of 13 weeks ·
busiest week 6 posts · longest gap 11 days" — never judged).

## Engagement chapter

Answers one question: *how is the audience responding to this account's content?*
Four widgets, all rendering `PeriodAnalytics` with zero component-side math:
KPI trio (ER with basis note, avg & median engagement per post, previous-period
deltas) → single trend chart with a quiet metric switcher (Engagement / Likes /
Comments / Views / Eng. Rate; views hidden when the capability is absent) →
by-content-type comparison cards with one relative bar each → top & bottom
posts with objective band labels (Top 10% / Above average / Average / Below
average — hard banding rules in the engine, never scores). The post detail
sheet now shows rank in period, percentile, band, vs-profile and vs-type
comparisons, and Best Reel/Carousel/Image badges.

## Analytics Engine

`src/domain/analytics/` — the single source of truth for every number on the
dashboard. Pure and deterministic: no AI, no scores, no recommendations.
One entry point, `computeAnalytics(snapshot, range) → PeriodAnalytics`:
averages & medians, engagement rate (basis-aware), top/bottom posts,
best-by-type, performance percentiles, weekly & monthly rankings, type
distribution, posting frequency, weekday distribution, growth stats (weekly
average, largest spike), aligned previous-period comparisons, and the follower
evolution series. Widgets consume it via `useAnalytics(handle, range)` and are
presentation-only. Covered by `npm test` (Vitest, 13 assertions on synthetic
fixtures). Future AI modules read this same output as their factual input.

## Try it

`npm run dev`, then pick a reference profile (suggested on the Home screen):

| Handle | Simulates | Data basis |
|---|---|---|
| `@halifaxhoney` | Client, connected Business | Full metrics + history (summer growth bump) |
| `@buildit` | Client, connected Business | Full metrics + history (viral spike ~3 months ago) |
| `@onelovemarket` | Prospect, public profile | Observed metrics, locked reach/saves/shares |
| `@nike` | Competitor, 302M followers | Public mega-brand: low ER, huge reel views |
| `@apple` | Competitor, curated feed | Public: sparse posting, image-heavy |

Each has its own brand voice (captions + hashtags), content mix, cadence and
growth story. Data is deterministic — same handle, same dataset, every run.
Any other handle falls back to a generic seeded archetype (even length =
Business, odd = public). The mock provider is a **permanent** part of the
project for development, testing and demos.

## Design principle (Phase 3+)

**Build a narrative, not a dashboard.** The page reads as chapters — Overview,
Performance, Content, Publishing, Export — each telling one story, revealed
sequentially after the Profile Snapshot hero lands.

## Run it

```bash
npm install
npm run dev      # opens the Home screen
npm run build    # strict tsc + production build
```

Routes: `/` Home (Spotlight-style search → staged analysis → dashboard route) ·
`/p/:handle` dashboard placeholder (Phase 3) · `/design-system` living style reference.

## What's in Phase 5

- `src/data/profiles.ts` — five curated reference datasets: profile identity, follower counts, growth stories (incl. spikes), engagement levels, posting cadence, content-type mix, brand-voice captions, hashtag pools
- `src/data/mock.ts` — config-driven generator; history normalized to land exactly on follower totals (chart and hero never disagree); hashtags in the data model
- Post detail sheet shows hashtag chips; Home suggests the reference profiles on first visit

## What's in Phase 4

- **Profile Snapshot hero** — real identity data (name, bio, website, verified, category), count-up totals, gradient avatar treatment
- **Quick Metrics** — 4 hero KPIs + subordinate strip, fully capability-driven: locked states, em-dashes for no-data, never zeros or estimates
- **Followers Evolution** — Recharts area chart (hairline grid, gradient fill, custom tooltip, dashed previous-period overlay) with an honest "history starts now" state for scraped profiles
- **Content Gallery** — hover-reveal metrics, staggered entrance, pagination, post detail side panel (vs-average comparisons, locked Business-only metrics)
- **Data layer pulled forward from Phase 5 (lean)**: seeded deterministic mock provider, pure analytics engine (`domain/analytics.ts`), `useSnapshot` hook returning snapshot + Capability Engine
- **Registry trimmed to finished work**: Overview / Performance / Content only — unfinished chapters return when they meet the bar

## What's in Phase 3

- `src/design-system/primitives/DashboardSection.tsx` — the narrative unit: standardized rhythm (96/48/40px), out-of-card headings, fade-up reveal
- `src/widgets/registry.ts` — widget registry (each widget lazy-loads as its own chunk) + the five-chapter spine
- `src/widgets/ProfileSnapshotHero.tsx` — centerpiece hero; renders immediately, totals stay skeletons until data binds (never fabricated)
- `src/screens/Dashboard.tsx` — sticky top bar (compact identity · time filter · export), progressive chapter reveal (`useProgressiveReveal` — timer now, data-readiness in Phase 5)
- `src/app/AnchorRail.tsx` — scroll-spy dots, the narrative's table of contents
- Widget stubs with layout-true skeletons: KPI grid, charts, gallery, ranking, heatmap

## What's in Phase 2

- `src/domain/handle.ts` — input normalization: `@nike`, `nike`, `instagram.com/nike`, full URLs → canonical handle
- `src/domain/capabilities.ts` — **Analytics Capability Engine**: single source of truth for measured / observed / locked; widgets never see the provider
- `src/screens/Home.tsx` — minimal centered search; `/` focuses, ⏎ analyzes, inline quiet validation, session recents
- `src/app/AnalysisOverlay.tsx` — staged loading experience (checkmark sequence + determinate bar, no spinners); simulated timings until Phase 5 binds real fetch stages
- `src/stores/analysis.ts` — analysis progress + session recents (in-memory per V1 scope)

## What's in Phase 1

- `src/design-system/tokens.css` — semantic tokens (Tailwind v4 `@theme`); dark mode is a variable swap
- `src/design-system/primitives/` — Button, Input, Skeleton, TrendBadge, SegmentedControl, SectionHeader, WidgetCard (5 states: ready/loading/empty/error/locked), KpiCard (measured/observed/locked), icons
- `src/app/AppShell.tsx` — V1 shell (Search + theme toggle; History/Settings slots reserved for V1.1)
- `src/stores/ui.ts` — Zustand UI store (theme)

## Build order (from the architecture doc)

1. ✅ Design system
2. ✅ Navigation + Home
3. ✅ Dashboard layout + widget registry
4. ✅ Widgets: Profile Snapshot, Quick Metrics, Followers Evolution, Content Gallery
5. ✅ MockProvider (lean, pulled into Phase 4) — remaining: bind loading overlay to real fetch stages
6. Charts (Recharts) + analytics engine
7. Interactions
8. Responsive + dark-mode pass
9. Report route + export
10. Live providers (scraper → Graph API)

Full spec: `instagram-performance-dashboard-architecture.md` (sibling file).
