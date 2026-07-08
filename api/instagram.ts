import { fetchPublicSnapshot, ProviderHttpError } from "./_lib/instagram";

const STATUS: Record<string, number> = {
  private: 403,
  not_found: 404,
  rate_limited: 429,
  unavailable: 502,
};

/** GET /api/instagram?handle=<username> → { snapshot } | { error } */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const handle = String(req.query?.handle ?? "").toLowerCase().trim();
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) {
    res.status(400).json({ error: "invalid_handle" });
    return;
  }
  try {
    const snapshot = await fetchPublicSnapshot(handle);
    // short shared cache: repeated analyses within 5 min reuse the edge copy
    res.setHeader("cache-control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ snapshot });
  } catch (error) {
    const code = error instanceof ProviderHttpError ? error.code : "unavailable";
    res.status(STATUS[code] ?? 502).json({ error: code });
  }
}
