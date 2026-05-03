/**
 * DNS-based SSRF guard. The string-level guard in cheerio.ts blocks IP
 * literals like https://10.0.0.1; this layer also blocks hostnames whose
 * A/AAAA records resolve to private space — closes the
 * "register evil.com → A 10.0.0.1" bypass.
 */
import "server-only";

import * as dns from "node:dns/promises";

/** RFC1918 + link-local + loopback + cloud metadata + CGNAT. */
export function isPrivateAddress(ip: string): boolean {
  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  // IPv6
  const v6 = ip.toLowerCase();
  if (v6 === "::1") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // fc00::/7
  if (
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb")
  ) {
    return true; // fe80::/10
  }
  return false;
}

export async function resolvePublicHostname(
  hostname: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const answers = await dns.lookup(hostname, { all: true });
    for (const a of answers) {
      if (isPrivateAddress(a.address)) {
        return { ok: false, reason: `resolves_to_private:${a.address}` };
      }
    }
    return { ok: true };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code ?? "lookup_failed";
    return { ok: false, reason: `dns_lookup_failed:${code}` };
  }
}
