import { useQuery } from "@tanstack/react-query";
import { fetchSnapshot } from "./provider";
import { ProviderError, type ProviderErrorCode } from "./scraper";
import { createCapabilityEngine, type CapabilityEngine } from "@/domain/capabilities";
import type { Snapshot } from "@/domain/types";

/**
 * The one hook widgets use for data. Returns the canonical snapshot plus its
 * Capability Engine — widgets never learn which provider supplied the data.
 */
export function useSnapshot(handle: string): {
  snapshot: Snapshot | undefined;
  engine: CapabilityEngine | undefined;
  isLoading: boolean;
  isError: boolean;
  errorCode: ProviderErrorCode | undefined;
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: ["snapshot", handle],
    queryFn: () => fetchSnapshot(handle),
    staleTime: Infinity, // a snapshot is immutable by definition (§ exec summary #2)
    retry: false, // provider errors are surfaced, never hammered (rate limits)
    enabled: handle.length > 0,
  });

  return {
    snapshot: query.data,
    engine: query.data ? createCapabilityEngine(query.data) : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    errorCode:
      query.error instanceof ProviderError ? query.error.code : query.isError ? "unavailable" : undefined,
    refetch: () => void query.refetch(),
  };
}
