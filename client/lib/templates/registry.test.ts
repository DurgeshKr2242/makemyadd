import { describe, expect, it } from "vitest";

import { resolveColour } from "./palettes";
import { filterTemplates, getTemplate, TEMPLATES } from "./registry";

describe("template registry", () => {
  it("loads at least one template per format", () => {
    const formats = new Set(TEMPLATES.map((t) => t.format));
    expect(formats.has("1x1")).toBe(true);
    expect(formats.has("9x16")).toBe(true);
    expect(formats.has("4x5")).toBe(true);
  });

  it("template ids are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTemplate returns a known template by id", () => {
    const t = getTemplate("spotlight_1x1");
    expect(t).toBeDefined();
    expect(t?.format).toBe("1x1");
  });

  it("getTemplate returns undefined for unknown id", () => {
    expect(getTemplate("does-not-exist")).toBeUndefined();
  });

  it("filterTemplates by format", () => {
    const out = filterTemplates({ format: "9x16" });
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out.every((t) => t.format === "9x16")).toBe(true);
  });

  it("filterTemplates by category", () => {
    const out = filterTemplates({ category: "showcase" });
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out.every((t) => t.category === "showcase")).toBe(true);
  });

  it("every template carries a palette + description", () => {
    for (const t of TEMPLATES) {
      expect(t.palette).toBeDefined();
      expect(t.palette.paper).toMatch(/^#/);
      expect(t.palette.accent).toMatch(/^#/);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });
});

describe("palette resolver", () => {
  const p = {
    paper: "#000000",
    ink: "#FFFFFF",
    mute: "#888888",
    accent: "#FF0000",
    accentInk: "#FFFFFF",
    surface: "#222222",
  };

  it("passes hex strings through unchanged", () => {
    expect(resolveColour("#123456", p)).toBe("#123456");
  });

  it("resolves @accent → palette.accent", () => {
    expect(resolveColour("@accent", p)).toBe("#FF0000");
  });

  it("resolves all six palette tokens", () => {
    expect(resolveColour("@paper", p)).toBe("#000000");
    expect(resolveColour("@ink", p)).toBe("#FFFFFF");
    expect(resolveColour("@mute", p)).toBe("#888888");
    expect(resolveColour("@accentInk", p)).toBe("#FFFFFF");
    expect(resolveColour("@surface", p)).toBe("#222222");
  });
});
