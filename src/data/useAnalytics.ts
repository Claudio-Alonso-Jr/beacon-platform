import { useMemo } from "react";
import { useSnapshot } from "./useSnapshot";
import { computeAnalytics, type PeriodAnalytics, type TimeRange } from "@/domain/analytics";
import type { CapabilityEngine } from "@/domain/capabilities";
import type { Snapshot } from "@/domain/types";

/**
 * The one hook widgets consume. Snapshot + Capability Engine + derived
 * analytics, memoized per (snapshot, range). Widgets never calculate.
 */
export function useAnalytics(
  handle: string,
  range: TimeRange,
): {
  snapshot: Snapshot | undefined;
  engine: CapabilityEngine | undefined;
  analytics: PeriodAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { snapshot, engine, isLoading, isError } = useSnapshot(handle);

  const analytics = useMemo(
    () => (snapshot ? computeAnalytics(snapshot, range) : undefined),
    [snapshot, range],
  );

  return { snapshot, engine, analytics, isLoading, isError };
}
