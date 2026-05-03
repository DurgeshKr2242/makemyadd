import { describe, expect, it } from "vitest";

import { extractJsonLdProduct } from "./json-ld";

describe("extractJsonLdProduct", () => {
  it("returns null when no ld+json script is present", () => {
    expect(
      extractJsonLdProduct("<html><head></head><body></body></html>"),
    ).toBeNull();
  });

  it("returns null when ld+json present but no Product type", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Article","headline":"x"}</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)).toBeNull();
  });

  it("extracts a flat Product", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "Festival Saree",
        "description": "Hand-woven cotton saree in saffron",
        "image": "https://shop.example.in/saree.jpg",
        "brand": "Anokhi",
        "offers": { "price": "1999.00", "priceCurrency": "INR" }
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)).toEqual({
      name: "Festival Saree",
      description: "Hand-woven cotton saree in saffron",
      image: "https://shop.example.in/saree.jpg",
      brand: "Anokhi",
      price: { amount: 1999, currency: "INR" },
    });
  });

  it("extracts a brand object form", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "X",
        "brand": { "@type": "Brand", "name": "Anokhi" }
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)?.brand).toBe("Anokhi");
  });

  it("extracts the first image when array form is used", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "X",
        "image": ["https://shop.example.in/1.jpg","https://shop.example.in/2.jpg"]
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)?.image).toBe(
      "https://shop.example.in/1.jpg",
    );
  });

  it("walks @graph arrays for the Product entry", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "name": "Shop" },
          { "@type": "Product", "name": "Mango", "description": "Sweet" }
        ]
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)).toEqual({
      name: "Mango",
      description: "Sweet",
      image: undefined,
      brand: undefined,
      price: undefined,
    });
  });

  it("ignores corrupt JSON in one block and tries the next", () => {
    const html = `<html><head>
      <script type="application/ld+json">{ broken json</script>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "Recovered"
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)?.name).toBe("Recovered");
  });
});
