import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so it doesn't throw outside Next.js runtime.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

import { POST } from "./route";

const ORIG_FETCH = global.fetch;

function reqJson(body: unknown): Request {
  return new Request("http://localhost/api/generate/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate/extract", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = ORIG_FETCH;
    vi.restoreAllMocks();
  });

  it("400s on missing body", async () => {
    const res = await POST(
      new Request("http://localhost/api/generate/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("400s on body that doesn't match the schema", async () => {
    const res = await POST(reqJson({ inputType: "url" }) as never);
    expect(res.status).toBe(400);
  });

  it("URL path: returns extracted og tags", async () => {
    const html = `<head>
      <meta property="og:title" content="Festival Saree" />
      <meta property="og:description" content="Hand-woven cotton" />
      <meta property="og:image" content="https://shop.example.in/saree.jpg" />
    </head>`;
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const res = await POST(
      reqJson({
        inputType: "url",
        inputUrl: "https://shop.example.in/p",
      }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.productName).toBe("Festival Saree");
    expect(json.productImageUrl).toBe("https://shop.example.in/saree.jpg");
  });

  it("URL path: 422s with code=invalid_url for private IP", async () => {
    const res = await POST(
      reqJson({ inputType: "url", inputUrl: "https://10.0.0.1/x" }) as never,
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("invalid_url");
  });

  it("photo path still returns 501", async () => {
    const res = await POST(
      reqJson({
        inputType: "photo",
        imageKey: "uploads/test.jpg",
      }) as never,
    );
    expect(res.status).toBe(501);
  });
});
