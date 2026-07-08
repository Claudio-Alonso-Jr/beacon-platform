import type { Snapshot } from "@/domain/types";

/**
 * ScraperProvider client: talks only to our own /api/instagram proxy.
 * Errors arrive as typed codes so the UI can explain honestly.
 */

export type ProviderErrorCode =
  | "private"
  | "not_found"
  | "rate_limited"
  | "unavailable"
  | "invalid_handle";

export class ProviderError extends Error {
  constructor(public code: ProviderErrorCode) {
    super(code);
    this.name = "ProviderError";
  }
}

const KNOWN_CODES: ProviderErrorCode[] = [
  "private",
  "not_found",
  "rate_limited",
  "unavailable",
  "invalid_handle",
];

export async function fetchScraperSnapshot(handle: string): Promise<Snapshot> {
  let response: Response;
  try {
    response = await fetch(`/api/instagram?handle=${encodeURIComponent(handle)}`);
  } catch {
    throw new ProviderError("unavailable");
  }

  let body: { snapshot?: Snapshot; error?: string };
  try {
    body = (await response.json()) as { snapshot?: Snapshot; error?: string };
  } catch {
    throw new ProviderError("unavailable");
  }

  if (!response.ok || !body.snapshot) {
    const code = KNOWN_CODES.find((c) => c === body.error) ?? "unavailable";
    throw new ProviderError(code);
  }
  return body.snapshot;
}
