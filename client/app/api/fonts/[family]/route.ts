// client/app/api/fonts/[family]/route.ts
import { findFamilyBySlug } from "@/lib/fonts/families";
import { rewriteFontCss } from "@/lib/fonts/proxy";

export const runtime = "nodejs";
export const revalidate = 86400; // 1 day

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ family: string }> },
) {
  const { family } = await params;
  const desc = findFamilyBySlug(family);
  if (!desc) {
    return new Response("Not found", { status: 404 });
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=${desc.googleQuery}&display=swap`;
  const cssRes = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    next: { revalidate: 86400 },
  });
  if (!cssRes.ok) {
    return new Response("Upstream font CSS fetch failed", {
      status: 502,
    });
  }
  const css = await cssRes.text();
  const rewritten = rewriteFontCss(css, "/api/fontfile");

  return new Response(rewritten, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
