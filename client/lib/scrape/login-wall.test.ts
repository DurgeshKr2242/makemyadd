import { describe, expect, it } from "vitest";

import { isLoginWall } from "./login-wall";

describe("isLoginWall", () => {
  it("returns false for normal product pages", () => {
    expect(
      isLoginWall({
        title: "Festival Saree — Anokhi",
        finalUrl: "https://shop.anokhi.in/products/festival-saree",
        hasNoIndex: false,
        bodyText: "Add to cart",
      }),
    ).toBe(false);
  });

  it("returns true when noindex + a login-y title", () => {
    expect(
      isLoginWall({
        title: "Sign in to your account",
        finalUrl: "https://shop.example.in/products/x",
        hasNoIndex: true,
        bodyText: "",
      }),
    ).toBe(true);
  });

  it("returns true when final URL is a login redirect", () => {
    expect(
      isLoginWall({
        title: "Anything",
        finalUrl: "https://shop.example.in/account/login?redirect=/products/x",
        hasNoIndex: false,
        bodyText: "",
      }),
    ).toBe(true);
  });

  it("returns true when body contains 'please log in' phrase", () => {
    expect(
      isLoginWall({
        title: "Anything",
        finalUrl: "https://shop.example.in/products/x",
        hasNoIndex: false,
        bodyText: "Please log in to continue browsing",
      }),
    ).toBe(true);
  });
});
