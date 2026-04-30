import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbs,
  buildOrganization,
  buildProductPlans,
  buildTemplatesItemList,
  buildWebSite,
} from "./json-ld";

describe("buildWebSite", () => {
  it("returns valid schema.org WebSite", () => {
    const s = buildWebSite();
    expect(s["@context"]).toBe("https://schema.org");
    expect(s["@type"]).toBe("WebSite");
    expect(s.inLanguage).toEqual(["en", "hi", "ta", "te"]);
    expect(s.potentialAction["@type"]).toBe("SearchAction");
  });
});

describe("buildOrganization", () => {
  it("returns valid Organization with India contact point", () => {
    const s = buildOrganization();
    expect(s["@type"]).toBe("Organization");
    expect(s.contactPoint.areaServed).toBe("IN");
    expect(s.contactPoint.availableLanguage).toContain("Hindi");
    expect(s.logo).toContain("/icon-512.png");
  });
});

describe("buildProductPlans", () => {
  it("emits one Product per plan with INR pricing", () => {
    const plans = [
      { name: "Free", description: "Try it", price: "0", href: "/signup" },
      {
        name: "Starter",
        description: "Solo",
        price: "499",
        href: "/signup?plan=starter",
      },
    ];
    const products = buildProductPlans(plans);
    expect(products).toHaveLength(2);
    expect(products[0]?.["@type"]).toBe("Product");
    expect(products[0]?.offers.priceCurrency).toBe("INR");
    expect(products[1]?.offers.price).toBe("499");
  });
});

describe("buildBreadcrumbs", () => {
  it("numbers items from 1", () => {
    const bc = buildBreadcrumbs([
      { name: "Home", path: "/" },
      { name: "Pricing", path: "/pricing" },
    ]);
    expect(bc.itemListElement[0]?.position).toBe(1);
    expect(bc.itemListElement[1]?.position).toBe(2);
  });
});

describe("buildTemplatesItemList", () => {
  it("maps templates to CreativeWork items", () => {
    const list = buildTemplatesItemList([
      {
        id: "festival_bright_01_1x1",
        name: "Festival Bright",
        format: "1x1",
        category: "sale",
        canvas: { width: 1080, height: 1080, background: "#FF6B35" },
        layers: [],
      },
    ]);
    expect(list.itemListElement).toHaveLength(1);
    const first = list.itemListElement[0];
    expect(first?.item.name).toBe("Festival Bright");
    expect(first?.item.url).toContain("#festival_bright_01_1x1");
    expect(first?.item.genre).toBe("sale");
  });
});
