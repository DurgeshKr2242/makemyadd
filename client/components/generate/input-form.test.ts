import { describe, expect, it } from "vitest";
import { isAcceptableProductUrl } from "./input-form";

describe("isAcceptableProductUrl", () => {
  // ─── Valid URLs ───────────────────────────────────────────────────────────

  it("accepts a plain HTTPS product URL", () => {
    expect(isAcceptableProductUrl("https://example.com/product/123")).toBeNull();
  });

  it("accepts an HTTPS URL with query params", () => {
    expect(
      isAcceptableProductUrl(
        "https://www.amazon.in/dp/B09XXX?ref=sr_1",
      ),
    ).toBeNull();
  });

  // ─── Protocol checks ──────────────────────────────────────────────────────

  it("rejects HTTP URLs (not HTTPS)", () => {
    const err = isAcceptableProductUrl("http://example.com/product");
    expect(err).not.toBeNull();
    expect(err).toMatch(/https/i);
  });

  it("rejects non-URL garbage strings", () => {
    expect(isAcceptableProductUrl("not-a-url")).not.toBeNull();
  });

  it("rejects empty string", () => {
    expect(isAcceptableProductUrl("")).not.toBeNull();
  });

  // ─── SSRF / private-range blocks ─────────────────────────────────────────

  it("rejects localhost", () => {
    const err = isAcceptableProductUrl("https://localhost/admin");
    expect(err).not.toBeNull();
    expect(err).toMatch(/localhost/i);
  });

  it("rejects 127.0.0.1 (loopback IP literal)", () => {
    const err = isAcceptableProductUrl("https://127.0.0.1:8080/secret");
    expect(err).not.toBeNull();
    expect(err).toMatch(/ip address/i);
  });

  it("rejects 169.254.169.254 (cloud metadata endpoint)", () => {
    const err = isAcceptableProductUrl("https://169.254.169.254/latest/meta-data");
    expect(err).not.toBeNull();
  });

  it("rejects 192.168.x.x private range", () => {
    const err = isAcceptableProductUrl("https://192.168.1.1/product");
    expect(err).not.toBeNull();
  });

  it("rejects 10.x.x.x private range", () => {
    const err = isAcceptableProductUrl("https://10.0.0.1/internal");
    expect(err).not.toBeNull();
  });
});
