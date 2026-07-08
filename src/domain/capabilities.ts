import type { Capability, SnapshotMeta } from "./types";

export type MetricState = "measured" | "observed" | "locked";

/**
 * Analytics Capability Engine — the single place capability detection lives.
 *
 * Widgets NEVER inspect the provider. They ask the engine:
 *   engine.metricState("reach")  →  "measured" | "observed" | "locked"
 *   engine.has("history")        →  boolean
 *
 * Rules:
 * - capability absent from the snapshot  → locked (honest, never estimated)
 * - capability present via Graph API     → measured
 * - capability present via public data   → observed
 */
export interface CapabilityEngine {
  has: (capability: Capability) => boolean;
  metricState: (capability: Capability) => MetricState;
  /** True when at least one capability is locked — drives the "Connect" strip. */
  hasLockedMetrics: boolean;
}

const ALL_CAPABILITIES: readonly Capability[] = [
  "followers",
  "engagement",
  "views",
  "reach",
  "saves",
  "shares",
  "impressions",
  "history",
];

export function createCapabilityEngine(
  snapshot: Pick<SnapshotMeta, "provider" | "capabilities">,
): CapabilityEngine {
  const available = new Set<Capability>(snapshot.capabilities);
  const sourceState: MetricState =
    snapshot.provider === "graph_api" ? "measured" : "observed";

  return {
    has: (capability) => available.has(capability),
    metricState: (capability) =>
      available.has(capability) ? sourceState : "locked",
    hasLockedMetrics: ALL_CAPABILITIES.some((c) => !available.has(c)),
  };
}
