/**
 * Heuristic — does this page look like an auth wall, not a product page?
 * Keep deliberately fuzzy. A false positive opens the ManualEntryDialog,
 * which the user can dismiss. A false negative gives them a "no_metadata"
 * generic error, which is worse.
 */
import "server-only";

const TITLE_RE =
  /sign\s*in|log\s*in|account\s*login|access\s*denied|page\s*not\s*found|404/i;

const URL_PATH_RE = /\/(login|signin|sign-in|account\/login|auth\/login)/i;

const BODY_PHRASES = [
  /please\s+log\s+in/i,
  /sign\s+in\s+to\s+continue/i,
  /you\s+must\s+be\s+logged\s+in/i,
];

export function isLoginWall(input: {
  title: string;
  finalUrl: string;
  hasNoIndex: boolean;
  bodyText: string;
}): boolean {
  if (input.hasNoIndex && TITLE_RE.test(input.title)) return true;
  try {
    const u = new URL(input.finalUrl);
    if (URL_PATH_RE.test(u.pathname)) return true;
  } catch {
    // bad URL — can't determine login-wall this way
  }
  if (BODY_PHRASES.some((re) => re.test(input.bodyText))) return true;
  return false;
}
