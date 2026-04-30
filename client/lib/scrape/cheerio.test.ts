import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so it doesn't throw outside Next.js runtime.
vi.mock("server-only", () => ({}));

import { isPublicHttpsUrl, ScrapeError, scrapeProductUrl } from "./cheerio";

describe("isPublicHttpsUrl — SSRF guard", () => {
  it.each([
    ["http://example.com", "must be https"],
    ["https://127.0.0.1", "IP literals not allowed"],
    ["https://10.0.0.1", "IP literals not allowed"],
    ["https://192.168.1.1", "IP literals not allowed"],
    ["https://169.254.169.254/latest/meta-data", "IP literals not allowed"],
    ["https://localhost", "blocked host: localhost"],
    [
      "https://metadata.google.internal/computeMetadata/v1",
      "blocked host: metadata.google.internal",
    ],
    ["https://anything.local", "blocked host: anything.local"],
    ["not a url", "not a URL"],
  ])("rejects %s — %s", (input, expectedReason) => {
    const result = isPublicHttpsUrl(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe(expectedReason);
    }
  });

  it("accepts a normal https url", () => {
    const result = isPublicHttpsUrl("https://shop.example.in/product/123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url.hostname).toBe("shop.example.in");
    }
  });
});

describe("scrapeProductUrl", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("extracts og:title, og:description, og:image", async () => {
    const html = `<!doctype html><html><head>
      <meta property="og:title" content="Festival Saree" />
      <meta property="og:description" content="Hand-woven cotton saree" />
      <meta property="og:image" content="https://shop.example.in/saree.jpg" />
    </head><body><h1>fallback</h1></body></html>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const result = await scrapeProductUrl(
      "https://shop.example.in/product/123",
    );
    expect(result.productName).toBe("Festival Saree");
    expect(result.productDesc).toBe("Hand-woven cotton saree");
    expect(result.productImageUrl).toBe("https://shop.example.in/saree.jpg");
  });

  it("falls back to <title> + <meta name=description> when og tags missing", async () => {
    const html = `<!doctype html><html><head>
      <title>Fallback Saree Title</title>
      <meta name="description" content="A different description" />
    </head><body></body></html>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const result = await scrapeProductUrl(
      "https://shop.example.in/product/123",
    );
    expect(result.productName).toBe("Fallback Saree Title");
    expect(result.productDesc).toBe("A different description");
    expect(result.productImageUrl).toBeUndefined();
  });

  it("throws ScrapeError(no_metadata) on a page with no usable tags", async () => {
    const html = `<!doctype html><html><head></head><body></body></html>`;
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    await expect(
      scrapeProductUrl("https://shop.example.in/empty"),
    ).rejects.toBeInstanceOf(ScrapeError);
  });

  it("throws ScrapeError(invalid_url) on a private IP", async () => {
    await expect(
      scrapeProductUrl("https://10.0.0.1/secret"),
    ).rejects.toMatchObject({
      name: "ScrapeError",
      code: "invalid_url",
    });
  });

  it("rejects non-html content-type", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(
      scrapeProductUrl("https://api.example.in/product.json"),
    ).rejects.toMatchObject({
      name: "ScrapeError",
      code: "fetch_failed",
    });
  });
});
