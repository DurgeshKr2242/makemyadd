import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so it doesn't throw outside Next.js runtime.
vi.mock("server-only", () => ({}));

// DNS resolution must be mocked — the scrape's DNS guard will otherwise hit
// the host network and return non-deterministic results in CI.
vi.mock("node:dns/promises", () => ({
  default: {
    lookup: vi.fn().mockResolvedValue([{ address: "104.21.50.1", family: 4 }]),
  },
  lookup: vi.fn().mockResolvedValue([{ address: "104.21.50.1", family: 4 }]),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

vi.mock("@/lib/r2/client", () => ({
  publicUrl: (k: string) => `https://assets.adcreator.in/${k}`,
  isR2Configured: () => false,
  uploadToR2: vi.fn(),
  presignPut: vi.fn(),
}));

const { describeMock } = vi.hoisted(() => ({ describeMock: vi.fn() }));
class MockVisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionError";
  }
}

vi.mock("@/lib/groq/vision", () => ({
  describeProductImage: describeMock,
  VisionError: MockVisionError,
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

  it("photo path: returns vision-described product on success", async () => {
    describeMock.mockResolvedValueOnce({
      name: "Festival Saree",
      description: "Hand-woven cotton saree",
      category: "fashion",
    });
    const res = await POST(
      reqJson({
        inputType: "photo",
        imageKey: "uploads/u1/x.png",
      }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.productName).toBe("Festival Saree");
    expect(json.category).toBe("fashion");
    expect(json.productImageUrl).toBe(
      "https://assets.adcreator.in/uploads/u1/x.png",
    );
  });

  it("photo path: maps VisionError to 422 vision_failed", async () => {
    describeMock.mockRejectedValueOnce(
      new MockVisionError("vision_failed_after_3_attempts:json_parse"),
    );
    const res = await POST(
      reqJson({
        inputType: "photo",
        imageKey: "uploads/u1/x.png",
      }) as never,
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("vision_failed");
  });
});
