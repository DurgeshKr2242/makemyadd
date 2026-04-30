// client/app/api/templates/route.test.ts
import { describe, expect, it } from "vitest";
import { GET } from "./route";

function req(url: string): Request {
  return new Request(url);
}

describe("GET /api/templates", () => {
  it("returns all templates", async () => {
    const res = await GET(req("http://localhost/api/templates"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.templates)).toBe(true);
    expect(json.templates.length).toBeGreaterThanOrEqual(3);
  });

  it("filters by format", async () => {
    const res = await GET(req("http://localhost/api/templates?format=1x1"));
    const json = await res.json();
    expect(
      json.templates.every((t: { format: string }) => t.format === "1x1"),
    ).toBe(true);
  });

  it("filters by category", async () => {
    const res = await GET(req("http://localhost/api/templates?category=sale"));
    const json = await res.json();
    expect(
      json.templates.every((t: { category: string }) => t.category === "sale"),
    ).toBe(true);
  });

  it("400s on invalid format", async () => {
    const res = await GET(req("http://localhost/api/templates?format=99x99"));
    expect(res.status).toBe(400);
  });

  it("includes id, name (derived), category, format, config", async () => {
    const res = await GET(req("http://localhost/api/templates"));
    const json = await res.json();
    const t = json.templates[0];
    expect(t).toHaveProperty("id");
    expect(t).toHaveProperty("category");
    expect(t).toHaveProperty("format");
    expect(t).toHaveProperty("config");
    expect(t.config).toHaveProperty("canvas");
    expect(t.config).toHaveProperty("layers");
  });
});
