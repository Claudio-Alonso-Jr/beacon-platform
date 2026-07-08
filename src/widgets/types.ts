import type { ComponentType, LazyExoticComponent } from "react";
import type { Capability } from "@/domain/types";
import type { TimeRange } from "@/stores/dashboard";

export type SectionId =
  | "overview"
  | "performance"
  | "engagement"
  | "content"
  | "publishing"
  | "export";

/** Every widget receives only this — pure, mockable, provider-blind (§5).
 *  Phase 5 adds `snapshot`; widgets then consult the Capability Engine. */
export interface WidgetProps {
  handle: string;
  range: TimeRange;
}

export interface WidgetDefinition {
  id: string;
  /** Which narrative chapter this widget belongs to. */
  section: SectionId;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
  /** Capabilities the widget needs; the Capability Engine decides locked states. */
  requiredCapabilities: Capability[];
  exportable: boolean;
}
