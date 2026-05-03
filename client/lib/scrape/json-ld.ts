/**
 * JSON-LD Product schema parser. Tried before OG tags because schema.org
 * Product gives us name, description, image, brand, AND price/currency in
 * one machine-readable payload — the foundation for the rich extracted card.
 */
import "server-only";

import { load } from "cheerio";

export type LdProduct = {
  name?: string;
  description?: string;
  image?: string;
  brand?: string;
  price?: { amount: number; currency: string };
};

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function asString(v: Json): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function flattenType(t: Json): string[] {
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.flatMap(flattenType);
  return [];
}

function isProduct(node: Json): node is Record<string, Json> {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  return flattenType((node as Record<string, Json>)["@type"] ?? null).includes(
    "Product",
  );
}

function extractImage(v: Json): string | undefined {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) {
    for (const item of v) {
      const u = extractImage(item);
      if (u) return u;
    }
    return undefined;
  }
  if (v && typeof v === "object" && "url" in v) {
    const u = (v as Record<string, Json>)["url"];
    return typeof u === "string" ? u : undefined;
  }
  return undefined;
}

function extractBrand(v: Json): string | undefined {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const name = (v as Record<string, Json>)["name"];
    return typeof name === "string" ? name.trim() : undefined;
  }
  return undefined;
}

function extractPrice(
  v: Json,
): { amount: number; currency: string } | undefined {
  if (!v || typeof v !== "object") return undefined;
  // offers can be an object OR an array of offers — take the first.
  const offers = Array.isArray(v) ? v[0] : (v as Record<string, Json>);
  if (!offers || typeof offers !== "object" || Array.isArray(offers)) {
    return undefined;
  }
  const rawPrice = offers["price"];
  const currency = offers["priceCurrency"];
  if (typeof currency !== "string" || currency.length < 3) return undefined;
  const amount =
    typeof rawPrice === "number"
      ? rawPrice
      : typeof rawPrice === "string"
        ? Number(rawPrice)
        : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return { amount, currency: currency.slice(0, 3).toUpperCase() };
}

function findProduct(node: Json): Record<string, Json> | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProduct(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (isProduct(node)) return node as Record<string, Json>;
  for (const v of Object.values(node)) {
    const found = findProduct(v as Json);
    if (found) return found;
  }
  return null;
}

export function extractJsonLdProduct(html: string): LdProduct | null {
  const $ = load(html);
  const blocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).contents().text())
    .get();

  for (const raw of blocks) {
    let parsed: Json;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const product = findProduct(parsed);
    if (!product) continue;
    return {
      name: asString(product["name"] ?? null),
      description: asString(product["description"] ?? null),
      image: extractImage(product["image"] ?? null),
      brand: extractBrand(product["brand"] ?? null),
      price: extractPrice(product["offers"] ?? null),
    };
  }
  return null;
}
