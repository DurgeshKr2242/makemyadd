/**
 * Extract product info from a URL or photo — TODO §6.
 *
 * URL branch: Cheerio scrape + SSRF guard, no external creds needed.
 * Photo branch: Groq Vision call, deferred until GROQ_API_KEY is set.
 */
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  type ExtractRequest,
  ExtractRequestSchema,
} from "@/lib/schemas/generation";
import { ScrapeError, scrapeProductUrl } from "@/lib/scrape/cheerio";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Parse + validate
  const body = await request.json().catch(() => null);
  let parsed: ExtractRequest;
  try {
    parsed = ExtractRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_body", issues: err.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Auth — middleware already blocks unauthenticated requests when Supabase
  // env is set. Re-fetch the user so we have it for logging / quota later.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Only enforce when Supabase env IS set. Dev mode falls through.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (parsed.inputType === "url") {
    try {
      const product = await scrapeProductUrl(parsed.inputUrl);
      return NextResponse.json({
        productName: product.productName,
        productDesc: product.productDesc,
        // The schema requires productImageUrl. If the page had no og:image,
        // return the original URL so the client can offer the upload fallback.
        productImageUrl: product.productImageUrl ?? parsed.inputUrl,
        ...(product.brand ? { brand: product.brand } : {}),
        ...(product.price ? { price: product.price } : {}),
      });
    } catch (err) {
      if (err instanceof ScrapeError) {
        // 422 — semantically valid request, but we can't do anything useful
        return NextResponse.json(
          { error: err.code, message: err.message },
          { status: 422 },
        );
      }
      throw err;
    }
  }

  // photo branch — Groq Vision describes the uploaded image.
  try {
    const { publicUrl } = await import("@/lib/r2/client");
    const { describeProductImage, VisionError } = await import(
      "@/lib/groq/vision"
    );
    const imageUrl = publicUrl(parsed.imageKey, "uploads");
    try {
      const v = await describeProductImage(imageUrl);
      return NextResponse.json({
        productName: v.name,
        productDesc: v.description,
        productImageUrl: imageUrl,
        ...(v.category ? { category: v.category } : {}),
      });
    } catch (err) {
      if (err instanceof VisionError) {
        return NextResponse.json(
          { error: "vision_failed", message: err.message },
          { status: 422 },
        );
      }
      throw err;
    }
  } catch (err) {
    // The lazy imports themselves throw if the relevant env keys are absent
    // — surface that cleanly so the UI can fall back to manual entry.
    return NextResponse.json(
      {
        error: "service_unavailable",
        message: err instanceof Error ? err.message : "service unavailable",
      },
      { status: 503 },
    );
  }
}
