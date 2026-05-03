/**
 * URL → product info scraper — TODO §6.1.
 *
 * Public-internet scraping, called from /api/generate/extract. Hard
 * security constraints:
 *
 *   - HTTPS only
 *   - Public hostnames only (block IP literals + hostnames whose A/AAAA
 *     records resolve to private space — see ./dns-guard)
 *   - 5s timeout via AbortSignal
 *   - 2 MB response cap (bail before reading the whole body)
 *   - User-Agent header set so polite servers don't block us
 *   - Sanitise extracted strings via isomorphic-dompurify before they
 *     touch the DB or render in the dashboard
 *
 * Parse priority: JSON-LD Product schema → og:* meta tags → <title> /
 * <meta name="description"> / <h1>. JSON-LD wins because it gives us
 * brand + price + structured image alongside name + description.
 */
import "server-only";
import { load } from "cheerio";
import DOMPurify from "isomorphic-dompurify";

import { containsRestrictedKeyword } from "./blocklist";
import { resolvePublicHostname } from "./dns-guard";
import { extractJsonLdProduct } from "./json-ld";
import { isLoginWall } from "./login-wall";
import { fetchAndRehostImage } from "./rehost-image";

const FETCH_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_DESC_LEN = 500;
const ALLOWED_NAME_LEN = 200;

export type ScrapedProduct = {
  productName: string;
  productDesc: string;
  productImageUrl?: string;
  brand?: string;
  price?: { amount: number; currency: string };
};

export class ScrapeError extends Error {
  constructor(
    public readonly code:
      | "invalid_url"
      | "dns_blocked"
      | "blocked_host"
      | "fetch_failed"
      | "timeout"
      | "body_too_large"
      | "no_metadata"
      | "login_wall"
      | "restricted_content",
    message: string,
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}

/** SSRF guard. Reject anything that could pivot a request into our
 *  internal network or to cloud metadata endpoints. */
export function isPublicHttpsUrl(
  input: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "not a URL" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "must be https" };
  }
  const host = url.hostname.toLowerCase();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return { ok: false, reason: "IP literals not allowed" };
  }
  if (host.includes(":")) {
    return { ok: false, reason: "IP literals not allowed" };
  }
  const BLOCKED = ["localhost", "metadata.google.internal", "metadata"];
  if (
    BLOCKED.includes(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return { ok: false, reason: `blocked host: ${host}` };
  }
  return { ok: true, url };
}

export async function scrapeProductUrl(input: string): Promise<ScrapedProduct> {
  const guard = isPublicHttpsUrl(input);
  if (!guard.ok) throw new ScrapeError("invalid_url", guard.reason);
  const { url } = guard;

  // DNS-level SSRF guard — closes the "evil.com → A 10.0.0.1" bypass.
  const dnsCheck = await resolvePublicHostname(url.hostname);
  if (!dnsCheck.ok) {
    throw new ScrapeError("dns_blocked", dnsCheck.reason);
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.href, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AdCreatorBot/1.0 (+https://adcreator.in)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ScrapeError(
        "timeout",
        `fetch timeout after ${FETCH_TIMEOUT_MS}ms`,
      );
    }
    throw new ScrapeError(
      "fetch_failed",
      err instanceof Error ? err.message : String(err),
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new ScrapeError("fetch_failed", `upstream ${response.status}`);
  }

  const declaredLen = Number(response.headers.get("content-length") ?? "0");
  if (declaredLen > MAX_BODY_BYTES) {
    throw new ScrapeError(
      "body_too_large",
      `${declaredLen} bytes > ${MAX_BODY_BYTES}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("xml")) {
    throw new ScrapeError(
      "fetch_failed",
      `unsupported content-type: ${contentType}`,
    );
  }

  const html = await readWithLimit(response, MAX_BODY_BYTES);

  // ─── JSON-LD takes priority — richer data when available ────────────────
  const ld = extractJsonLdProduct(html);

  // ─── OG / fallback parse ─────────────────────────────────────────────────
  const $ = load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const docTitle = $("title").first().text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  const h1 = $("h1").first().text().trim();
  const robots = $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
  const hasNoIndex = robots.includes("noindex");
  const bodyText = $("body").text().slice(0, 4000);

  // Login-wall detection runs against the assembled signal set.
  if (
    isLoginWall({
      title: ld?.name ?? ogTitle ?? docTitle ?? "",
      finalUrl: response.url,
      hasNoIndex,
      bodyText,
    })
  ) {
    throw new ScrapeError("login_wall", "page looks like an auth wall");
  }

  const productName = sanitize(
    ld?.name ?? ogTitle ?? docTitle ?? h1 ?? "",
    ALLOWED_NAME_LEN,
  );
  const productDesc = sanitize(
    ld?.description ?? ogDesc ?? metaDesc ?? "",
    ALLOWED_DESC_LEN,
  );

  if (!productName && !productDesc) {
    throw new ScrapeError(
      "no_metadata",
      "could not find product metadata on page",
    );
  }

  // Restricted-content gate — runs only after we have something to check.
  const haystack = `${productName} ${productDesc}`;
  if (containsRestrictedKeyword(haystack)) {
    throw new ScrapeError(
      "restricted_content",
      "page contains restricted keywords",
    );
  }

  // Re-host the og:image to R2 so the canvas isn't dependent on the
  // merchant's CDN at render time. Falls back to the original URL when R2
  // isn't configured or the image is hot-link-protected.
  const imageRaw = ld?.image ?? ogImage;
  let finalImageUrl: string | undefined;
  if (imageRaw) {
    const absolute = resolveAbsolute(url, imageRaw);
    const rehost = await fetchAndRehostImage(absolute);
    finalImageUrl = "rehostedUrl" in rehost ? rehost.rehostedUrl : absolute;
  }

  return {
    productName: productName || "Untitled product",
    productDesc,
    productImageUrl: finalImageUrl,
    brand: ld?.brand ? sanitize(ld.brand, 80) : undefined,
    price: ld?.price,
  };
}

/** Stream the body up to maxBytes and abort the stream if it overflows.
 *  Avoids loading a 50 MB malicious HTML response into memory. */
async function readWithLimit(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ScrapeError("body_too_large", `streamed > ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

/** Defensive — DOMPurify strips any HTML/script that snuck into a meta
 *  string (rare in og:title etc., but cheap insurance). Then collapse
 *  whitespace and truncate. */
function sanitize(input: string, maxLen: number): string {
  const stripped = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return stripped.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function resolveAbsolute(base: URL, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}
