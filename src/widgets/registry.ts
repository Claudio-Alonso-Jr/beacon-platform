import { lazy } from "react";
import type { SectionId, WidgetDefinition } from "./types";

/**
 * Widget Registry — the extension point (§1.4).
 *
 * Phase 4 philosophy: the registry lists ONLY finished, client-ready widgets.
 * A three-chapter dashboard that feels complete beats five chapters of
 * skeletons. Engagement, Top Posts, Publishing and Export re-enter as each
 * reaches the same bar (their stub files remain in src/widgets/).
 */
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: "quick-metrics",
    section: "overview",
    component: lazy(() => import("./QuickMetricsWidget")),
    requiredCapabilities: ["followers", "engagement"],
    exportable: true,
  },
  {
    id: "followers-evolution",
    section: "performance",
    component: lazy(() => import("./FollowersWidget")),
    requiredCapabilities: ["followers"],
    exportable: true,
  },
  {
    id: "engagement-overview",
    section: "engagement",
    component: lazy(() => import("./EngagementOverviewWidget")),
    requiredCapabilities: ["engagement"],
    exportable: true,
  },
  {
    id: "engagement-trend",
    section: "engagement",
    component: lazy(() => import("./EngagementWidget")),
    requiredCapabilities: ["engagement"],
    exportable: true,
  },
  {
    id: "engagement-by-type",
    section: "engagement",
    component: lazy(() => import("./EngagementByTypeWidget")),
    requiredCapabilities: ["engagement"],
    exportable: true,
  },
  {
    id: "top-bottom-posts",
    section: "engagement",
    component: lazy(() => import("./TopBottomPostsWidget")),
    requiredCapabilities: ["engagement"],
    exportable: true,
  },
  {
    id: "posts-gallery",
    section: "content",
    component: lazy(() => import("./PostsGalleryWidget")),
    requiredCapabilities: ["engagement"],
    exportable: true,
  },
  {
    id: "publishing-overview",
    section: "publishing",
    component: lazy(() => import("./PublishingOverviewWidget")),
    requiredCapabilities: [],
    exportable: true,
  },
  {
    id: "publishing-calendar",
    section: "publishing",
    component: lazy(() => import("./PublishingCalendarWidget")),
    requiredCapabilities: [],
    exportable: true,
  },
  {
    id: "content-type-distribution",
    section: "publishing",
    component: lazy(() => import("./ContentTypeDistributionWidget")),
    requiredCapabilities: ["engagement"],
    exportable: true,
  },
  {
    id: "posting-rhythm",
    section: "publishing",
    component: lazy(() => import("./PostingRhythmWidget")),
    requiredCapabilities: [],
    exportable: true,
  },
];

/** The narrative spine. Each chapter answers one business question. */
export const DASHBOARD_SECTIONS: ReadonlyArray<{
  id: SectionId;
  title: string;
  description: string;
}> = [
  { id: "overview", title: "Overview", description: "How the account performed in the selected period" },
  { id: "performance", title: "Performance", description: "How the audience is growing" },
  { id: "engagement", title: "Engagement", description: "How the audience responds to this account's content" },
  { id: "content", title: "Content", description: "What was published, and what worked" },
  { id: "publishing", title: "Publishing", description: "How consistently the account publishes, and the patterns behind it" },
];

export function widgetsForSection(section: SectionId): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter((w) => w.section === section);
}
