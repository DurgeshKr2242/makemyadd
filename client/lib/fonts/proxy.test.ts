import { describe, expect, it } from "vitest";
import { rewriteFontCss } from "./proxy";

describe("rewriteFontCss", () => {
  it("rewrites a single gstatic url to a proxied one", () => {
    const input = `@font-face { src: url(https://fonts.gstatic.com/s/notosans/v30/file.woff2) format("woff2"); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toContain("/api/fontfile/s%2Fnotosans%2Fv30%2Ffile.woff2");
    expect(out).not.toContain("fonts.gstatic.com");
  });

  it("rewrites multiple urls in one block", () => {
    const input = `
      @font-face { src: url(https://fonts.gstatic.com/s/a.woff2); }
      @font-face { src: url(https://fonts.gstatic.com/s/b.woff2); }
    `;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out.match(/\/api\/fontfile\//g)).toHaveLength(2);
  });

  it("leaves non-gstatic urls alone", () => {
    const input = `@font-face { src: url(https://example.com/font.woff2); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toBe(input);
  });

  it("preserves the rest of the rule", () => {
    const input = `@font-face { font-family: "Noto Sans"; src: url(https://fonts.gstatic.com/x.woff2) format("woff2"); font-weight: 400; }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toContain('font-family: "Noto Sans"');
    expect(out).toContain("font-weight: 400");
    expect(out).toContain('format("woff2")');
  });

  it("rewrites a single-quoted gstatic url", () => {
    const input = `@font-face { src: url('https://fonts.gstatic.com/s/notosans/v30/file.woff2') format("woff2"); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toContain("/api/fontfile/s%2Fnotosans%2Fv30%2Ffile.woff2");
    expect(out).not.toContain("fonts.gstatic.com");
  });

  it("rewrites a double-quoted gstatic url", () => {
    const input = `@font-face { src: url("https://fonts.gstatic.com/s/x.woff2") format("woff2"); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toContain("/api/fontfile/s%2Fx.woff2");
    expect(out).not.toContain("fonts.gstatic.com");
  });

  it("emits a quoted url so paths containing parens or special chars stay valid", () => {
    const input = `@font-face { src: url(https://fonts.gstatic.com/s/a.woff2); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toMatch(/url\("\/api\/fontfile\//);
  });
});
