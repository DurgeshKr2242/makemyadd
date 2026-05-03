/**
 * Restricted-content keyword filter. Runs on extracted product copy BEFORE
 * any LLM call. Whole-word matching is intentional — substring matching
 * fires false positives ("Casinopolis vinyl" should not be blocked).
 *
 * Phase 2 wires LLM-based moderation; this is the cheap MVP gate.
 */
import "server-only";

const RESTRICTED = [
  "adult toy",
  "adult dvd",
  "porn",
  "pornography",
  "escort",
  "sex toy",
  "casino",
  "gambling",
  "betting site",
  "steroid",
  "steroids",
  "anabolic",
  "viagra",
  "cocaine",
  "heroin",
  "cannabis",
  "marijuana",
  "weed delivery",
];

const PATTERN = new RegExp(
  `\\b(?:${RESTRICTED.map((w) => w.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "i",
);

export function containsRestrictedKeyword(text: string): boolean {
  return PATTERN.test(text);
}
