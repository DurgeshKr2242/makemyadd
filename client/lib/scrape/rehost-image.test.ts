import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { isR2ConfiguredMock, uploadToR2Mock } = vi.hoisted(() => ({
  isR2ConfiguredMock: vi.fn().mockReturnValue(true),
  uploadToR2Mock: vi.fn().mockResolvedValue({
    key: "processed/bgr-x.png",
    publicUrl: "https://assets.adcreator.in/processed/bgr-x.png",
  }),
}));

vi.mock("@/lib/r2/client", () => ({
  isR2Configured: isR2ConfiguredMock,
  uploadToR2: uploadToR2Mock,
}));

const ORIG_FETCH = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
  isR2ConfiguredMock.mockReturnValue(true);
  uploadToR2Mock.mockResolvedValue({
    key: "processed/bgr-x.png",
    publicUrl: "https://assets.adcreator.in/processed/bgr-x.png",
  });
});
afterEach(() => {
  global.fetch = ORIG_FETCH;
  vi.restoreAllMocks();
});

import { fetchAndRehostImage } from "./rehost-image";

describe("fetchAndRehostImage", () => {
  it("skips when R2 isn't configured", async () => {
    isR2ConfiguredMock.mockReturnValueOnce(false);
    const r = await fetchAndRehostImage("https://shop.example.in/x.jpg");
    expect(r).toEqual({ skipped: true, reason: "r2_not_configured" });
  });

  it("rehosts a normal image", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/x.png");
    expect(r).toMatchObject({
      rehostedUrl: expect.stringContaining("processed/"),
    });
    expect(uploadToR2Mock).toHaveBeenCalledOnce();
  });

  it("skips on 403 (hot-link protection)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("denied", { status: 403 }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/x.jpg");
    expect(r).toMatchObject({ skipped: true });
  });

  it("rejects SVG (XSS risk)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("<svg></svg>", {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/x.svg");
    expect(r).toMatchObject({
      skipped: true,
      reason: expect.stringContaining("svg"),
    });
  });

  it("rejects body larger than maxBytes via Content-Length", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("x", {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          "content-length": "6000000",
        },
      }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/big.jpg", {
      maxBytes: 5_000_000,
    });
    expect(r).toMatchObject({
      skipped: true,
      reason: expect.stringContaining("too_large"),
    });
  });
});
