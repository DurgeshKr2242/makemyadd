/**
 * URL → product info scraper — TODO §6.1.
 *
 * Stub. The real implementation:
 *   - Validates URL is HTTPS, public hostname (SSRF guard, blocks RFC1918,
 *     link-local, 169.254.169.254).
 *   - Fetches with 5s timeout, custom UA, max body 2MB.
 *   - Extracts og:title / og:description / og:image / JSON-LD Product.
 *   - Re-uploads og:image to R2 (no hotlinking at render time).
 */
import "server-only";

export type ScrapedProduct = {
  productName: string;
  productDesc: string;
  productImageUrl?: string;
  category?: string;
};

export async function scrapeProductUrl(_url: string): Promise<ScrapedProduct> {
  throw new Error("scrapeProductUrl not implemented yet — see TODO §6.1");
}
