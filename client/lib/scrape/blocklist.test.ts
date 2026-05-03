import { describe, expect, it } from "vitest";

import { containsRestrictedKeyword } from "./blocklist";

describe("containsRestrictedKeyword", () => {
  it.each([
    "Buy authentic Festival Saree",
    "Hand-woven cotton T-shirt for kids",
    "Premium organic ghee from Kerala",
    "Modular kitchen for small homes",
  ])("accepts harmless product copy: %s", (s) => {
    expect(containsRestrictedKeyword(s)).toBe(false);
  });

  it.each([
    "Adult toy with discreet packaging",
    "casino bonus signup offer",
    "buy steroids online bulk discount",
    "porn DVD collector edition",
  ])("flags restricted copy: %s", (s) => {
    expect(containsRestrictedKeyword(s)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(containsRestrictedKeyword("Free CASINO chips")).toBe(true);
  });

  it("matches whole-word only — does not flag substrings", () => {
    // "Casinopolis" the imaginary game franchise should NOT match "casino"
    expect(containsRestrictedKeyword("Buy Casinopolis vinyl")).toBe(false);
  });
});
