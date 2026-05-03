import { describe, expect, it } from "vitest";

import { forgotSchema, resetSchema, signInSchema, signUpSchema } from "./auth";

describe("signInSchema", () => {
  it("accepts a valid email + non-empty password", () => {
    const r = signInSchema.safeParse({ email: "a@b.in", password: "x" });
    expect(r.success).toBe(true);
  });
  it("rejects an invalid email", () => {
    const r = signInSchema.safeParse({ email: "not-email", password: "x" });
    expect(r.success).toBe(false);
  });
  it("rejects an empty password", () => {
    const r = signInSchema.safeParse({ email: "a@b.in", password: "" });
    expect(r.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const base = {
    email: "a@b.in",
    fullName: "Sundar Devi",
    password: "Strong1!aa",
    turnstileToken: "tok",
  };
  it("accepts a valid payload", () => {
    expect(signUpSchema.safeParse(base).success).toBe(true);
  });
  it("rejects passwords shorter than 8", () => {
    const r = signUpSchema.safeParse({ ...base, password: "Aa1!" });
    expect(r.success).toBe(false);
  });
  it("rejects passwords without a number", () => {
    const r = signUpSchema.safeParse({ ...base, password: "Strongaaaa!" });
    expect(r.success).toBe(false);
  });
  it("rejects passwords without a symbol", () => {
    const r = signUpSchema.safeParse({ ...base, password: "Strong1aaaa" });
    expect(r.success).toBe(false);
  });
  it("rejects empty turnstileToken", () => {
    const r = signUpSchema.safeParse({ ...base, turnstileToken: "" });
    expect(r.success).toBe(false);
  });
  it("rejects fullName longer than 80 chars", () => {
    const r = signUpSchema.safeParse({ ...base, fullName: "x".repeat(81) });
    expect(r.success).toBe(false);
  });
});

describe("forgotSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotSchema.safeParse({ email: "a@b.in" }).success).toBe(true);
  });
});

describe("resetSchema", () => {
  it("accepts matching strong passwords", () => {
    const r = resetSchema.safeParse({
      password: "Strong1!aa",
      confirm: "Strong1!aa",
    });
    expect(r.success).toBe(true);
  });
  it("rejects mismatched passwords on the confirm field", () => {
    const r = resetSchema.safeParse({
      password: "Strong1!aa",
      confirm: "Strong1!bb",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(["confirm"]);
    }
  });
});
