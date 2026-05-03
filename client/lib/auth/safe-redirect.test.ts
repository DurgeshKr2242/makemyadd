import { describe, expect, it } from "vitest";

import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("returns the next param when it is a relative path", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard");
    expect(safeRedirect("/history?page=2")).toBe("/history?page=2");
  });
  it("returns the fallback when next is null/empty", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
    expect(safeRedirect("")).toBe("/dashboard");
  });
  it("rejects protocol-relative URLs", () => {
    expect(safeRedirect("//evil.com")).toBe("/dashboard");
  });
  it("rejects absolute URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/dashboard");
    expect(safeRedirect("http://evil.com")).toBe("/dashboard");
  });
  it("rejects paths that don't start with /", () => {
    expect(safeRedirect("dashboard")).toBe("/dashboard");
  });
  it("respects a custom fallback", () => {
    expect(safeRedirect("//evil.com", "/login")).toBe("/login");
  });
});
