// client/lib/templates/registry.test.ts
import { describe, expect, it } from "vitest";
import { filterTemplates, getTemplate, TEMPLATES } from "./registry";

describe("template registry", () => {
  it("loads all configs", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it("template ids are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTemplate returns by id", () => {
    const t = getTemplate("festival_bright_01_1x1");
    expect(t).toBeDefined();
    expect(t?.format).toBe("1x1");
    expect(t?.category).toBe("sale");
  });

  it("getTemplate returns undefined for unknown id", () => {
    expect(getTemplate("does-not-exist")).toBeUndefined();
  });

  it("filterTemplates by format", () => {
    const out = filterTemplates({ format: "1x1" });
    expect(out.every((t) => t.format === "1x1")).toBe(true);
  });

  it("filterTemplates by category", () => {
    const out = filterTemplates({ category: "sale" });
    expect(out.every((t) => t.category === "sale")).toBe(true);
  });

  it("filterTemplates with both filters", () => {
    const out = filterTemplates({ format: "1x1", category: "urgency" });
    expect(out.length).toBe(1);
    expect(out[0]?.id).toBe("urgency_red_01_1x1");
  });

  it("filterTemplates returns 9x16 templates", () => {
    const out = filterTemplates({ format: "9x16" });
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(out.every((t) => t.format === "9x16")).toBe(true);
  });

  it("filterTemplates returns 4x5 templates", () => {
    const out = filterTemplates({ format: "4x5" });
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(out.every((t) => t.format === "4x5")).toBe(true);
  });

  it("filterTemplates by trust category returns trust_badge", () => {
    const out = filterTemplates({ category: "trust" });
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out.every((t) => t.category === "trust")).toBe(true);
  });
});
