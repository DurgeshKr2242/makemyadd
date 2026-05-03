/**
 * Fetch an external image and re-upload to the R2 `processed` bucket.
 * Returns `{ skipped }` instead of throwing on any failure — caller falls
 * back to the original URL. Better to ship a hot-link-fragile ad than to
 * break the funnel.
 */
import "server-only";

import { isR2Configured, uploadToR2 } from "@/lib/r2/client";
import { processedKey } from "@/lib/r2/keys";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type RehostResult =
  | { rehostedUrl: string; rehostedKey: string }
  | { skipped: true; reason: string };

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function fetchAndRehostImage(
  imageUrl: string,
  opts?: { timeoutMs?: number; maxBytes?: number },
): Promise<RehostResult> {
  if (!isR2Configured()) {
    return { skipped: true, reason: "r2_not_configured" };
  }
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(imageUrl, {
      signal: ac.signal,
      redirect: "follow",
      headers: { "User-Agent": "AdCreatorBot/1.0 (+https://adcreator.in)" },
    });
  } catch (err) {
    clearTimeout(timer);
    return {
      skipped: true,
      reason: `fetch_failed:${(err as Error).message ?? "unknown"}`,
    };
  }
  clearTimeout(timer);

  if (!res.ok) return { skipped: true, reason: `upstream_${res.status}` };

  const contentType = (res.headers.get("content-type") ?? "")
    .split(";")[0]!
    .trim()
    .toLowerCase();
  if (contentType.includes("svg")) {
    return { skipped: true, reason: "svg_disallowed" };
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return { skipped: true, reason: `unsupported_type:${contentType}` };
  }

  const declaredLen = Number(res.headers.get("content-length") ?? "0");
  if (declaredLen > maxBytes) {
    return { skipped: true, reason: "body_too_large" };
  }

  const reader = res.body?.getReader();
  if (!reader) return { skipped: true, reason: "no_body" };
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { skipped: true, reason: "body_too_large" };
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const key = processedKey();
    const { publicUrl } = await uploadToR2(
      merged,
      key,
      contentType,
      "processed",
    );
    return { rehostedUrl: publicUrl, rehostedKey: key };
  } catch (err) {
    return {
      skipped: true,
      reason: `upload_failed:${(err as Error).message ?? "unknown"}`,
    };
  }
}
