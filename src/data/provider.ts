import type { Snapshot } from "@/domain/types";
import { REFERENCE_PROFILES } from "./profiles";
import { fetchMockSnapshot } from "./mock";
import { fetchScraperSnapshot } from "./scraper";

/**
 * Provider resolver (§1.2): curated demo handles stay on the MockProvider;
 * every other handle fetches real public Instagram data via ScraperProvider.
 */
export function fetchSnapshot(handle: string): Promise<Snapshot> {
  if (handle in REFERENCE_PROFILES) return fetchMockSnapshot(handle);
  return fetchScraperSnapshot(handle);
}
