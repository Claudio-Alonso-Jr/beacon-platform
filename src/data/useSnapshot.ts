import { useQuery } from "@tanstack/react-query";
import { fetchMockSnapshot } from "./mock";
import { createCapabilityEngine, type CapabilityEngine } from "@/domain/capabilities";
import type { Snapshot } from "@/domain/types";

/**
 * The one hook widgets use for data. Returns the canonical snapshot plus its
 * Capability Engine — widgets never learn which provider supplied the data.
 * React Query dedupes across widgets; the mock provider swaps for live
 * providers in Phase 10 behind this same hook.
 */
export function useSnapshot(handle: string): {
  snapshot: Snapshot | undefined;
  engine: CapabilityEngine | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useQuery({
    queryKey: ["snapshot", handle],
    queryFn: () => fetchMockSnapshot(handle),
    staleTime: Infinity, // a snapshot is immutable by definition (§ exec summary #2)
    enabled: handle.length > 0,
  });

  return {
    snapshot: query.data,
    engine: query.data ? createCapabilityEngine(query.data) : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
