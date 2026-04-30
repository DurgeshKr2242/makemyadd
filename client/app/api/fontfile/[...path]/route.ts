// client/app/api/fontfile/[...path]/route.ts
export const runtime = "nodejs";
export const revalidate = 31536000; // 1 year

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const decoded = path.map((p) => decodeURIComponent(p)).join("/");
  // SSRF guard — only allow gstatic paths, never arbitrary fetches
  if (decoded.includes("..") || decoded.startsWith("/")) {
    return new Response("Bad path", { status: 400 });
  }

  const upstream = `https://fonts.gstatic.com/${decoded}`;
  const res = await fetch(upstream, { next: { revalidate: 31536000 } });
  if (!res.ok) {
    return new Response("Upstream font fetch failed", { status: 502 });
  }
  const buf = await res.arrayBuffer();

  return new Response(buf, {
    headers: {
      "Content-Type": "font/woff2",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
