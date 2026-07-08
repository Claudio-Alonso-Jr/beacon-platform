/**
 * Input normalization (§ Product Vision): accepts
 *   @instagram · instagram · https://instagram.com/instagram · instagram.com/instagram/
 * and resolves to a canonical lowercase handle.
 */

export type HandleResult =
  | { ok: true; handle: string }
  | { ok: false; reason: string };

const HANDLE_PATTERN = /^[a-z0-9._]{1,30}$/;
const RESERVED_PATHS = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts"]);

export function normalizeHandle(raw: string): HandleResult {
  let input = raw.trim().toLowerCase();
  if (!input) return { ok: false, reason: "Type a profile to analyze" };

  // URL forms
  if (input.includes("instagram.com")) {
    input = input.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const path = input.slice(input.indexOf("/") + 1);
    const segment = path.split(/[/?#]/)[0] ?? "";
    if (!segment || RESERVED_PATHS.has(segment)) {
      return { ok: false, reason: "That link doesn't point to a profile" };
    }
    input = segment;
  }

  input = input.replace(/^@/, "").replace(/\/+$/, "");

  if (input.length > 30) return { ok: false, reason: "Usernames have at most 30 characters" };
  if (!HANDLE_PATTERN.test(input) || input.startsWith(".") || input.endsWith(".") || input.includes("..")) {
    return { ok: false, reason: "Letters, numbers, dots and underscores only" };
  }

  return { ok: true, handle: input };
}
