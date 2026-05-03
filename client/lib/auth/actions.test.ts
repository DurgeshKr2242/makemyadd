import { afterEach, describe, expect, it, vi } from "vitest";

// next/headers — server actions read x-forwarded-for via headers().
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    getAll: () => [],
    set: () => {},
  }),
  headers: async () =>
    new Headers({ "x-forwarded-for": "203.0.113.42, 10.0.0.1" }),
}));

// next/navigation — redirect throws so we can assert on it instead of leaving
// the function.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

// publicEnv — actions.ts reads NEXT_PUBLIC_APP_URL for the reset redirect.
vi.mock("@/lib/env", () => ({
  publicEnv: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}));

// Supabase server client — single mock with EVERY auth method used across
// the five actions. Defining `vi.mock` more than once for the same module is
// undefined behaviour in Vitest (the call is hoisted, last write wins), so
// we declare the full surface up-front.
const signInWithPassword = vi.fn();
const signOut = vi.fn();
const signUp = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword,
      signOut,
      signUp,
      resetPasswordForEmail,
      updateUser,
    },
  }),
}));

// Turnstile — verifier is a thin wrapper around fetch; mock it explicitly so
// signup tests can flip captcha pass/fail.
vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(async (token: string) => token === "valid"),
}));

import {
  forgotPasswordAction,
  resetPasswordAction,
  signInAction,
  signOutAction,
  signUpAction,
} from "./actions";

afterEach(() => {
  signInWithPassword.mockReset();
  signOut.mockReset();
  signUp.mockReset();
  resetPasswordForEmail.mockReset();
  updateUser.mockReset();
});

describe("signInAction", () => {
  it("returns ok on success", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: null });
    const fd = new FormData();
    fd.set("email", "a@b.in");
    fd.set("password", "pw");
    const r = await signInAction(fd);
    expect(r.ok).toBe(true);
  });

  it("maps invalid creds to a generic password-field error (no enumeration)", async () => {
    signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials", status: 400 },
    });
    const fd = new FormData();
    fd.set("email", "a@b.in");
    fd.set("password", "wrong");
    const r = await signInAction(fd);
    expect(r).toEqual({
      ok: false,
      error: "Email or password is incorrect",
      field: "password",
    });
  });

  it("rejects malformed input before hitting Supabase", async () => {
    const fd = new FormData();
    fd.set("email", "not-an-email");
    fd.set("password", "");
    const r = await signInAction(fd);
    expect(r.ok).toBe(false);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("signOutAction", () => {
  it("calls supabase signOut and redirects to /login", async () => {
    signOut.mockResolvedValue({ error: null });
    await expect(signOutAction(new FormData())).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(signOut).toHaveBeenCalledOnce();
  });
});

describe("signUpAction", () => {
  const fd = () => {
    const f = new FormData();
    f.set("email", "new@b.in");
    f.set("fullName", "Sundar Devi");
    f.set("password", "Strong1!aa");
    f.set("turnstileToken", "valid");
    return f;
  };

  it("rejects when turnstile token fails", async () => {
    const f = fd();
    f.set("turnstileToken", "invalid");
    const r = await signUpAction(f);
    expect(r).toEqual({
      ok: false,
      error: "Captcha verification failed. Refresh and try again.",
    });
    expect(signUp).not.toHaveBeenCalled();
  });

  it("creates the account and forwards full_name into user_metadata", async () => {
    signUp.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const r = await signUpAction(fd());
    expect(r.ok).toBe(true);
    expect(signUp).toHaveBeenCalledWith({
      email: "new@b.in",
      password: "Strong1!aa",
      options: { data: { full_name: "Sundar Devi" } },
    });
  });

  it("maps duplicate-email error to the email field", async () => {
    signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered", status: 422 },
    });
    const r = await signUpAction(fd());
    expect(r).toEqual({
      ok: false,
      error: "An account with that email already exists.",
      field: "email",
    });
  });
});

describe("forgotPasswordAction", () => {
  it("always returns ok regardless of whether the email exists", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    const f = new FormData();
    f.set("email", "a@b.in");
    expect((await forgotPasswordAction(f)).ok).toBe(true);

    resetPasswordForEmail.mockResolvedValue({
      error: { message: "user not found" },
    });
    expect((await forgotPasswordAction(f)).ok).toBe(true);
  });
});

describe("resetPasswordAction", () => {
  it("rejects mismatched passwords before calling supabase", async () => {
    const f = new FormData();
    f.set("password", "Strong1!aa");
    f.set("confirm", "Strong1!bb");
    const r = await resetPasswordAction(f);
    expect(r.ok).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser with the new password on success", async () => {
    updateUser.mockResolvedValue({ data: {}, error: null });
    const f = new FormData();
    f.set("password", "Strong1!aa");
    f.set("confirm", "Strong1!aa");
    const r = await resetPasswordAction(f);
    expect(r.ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({ password: "Strong1!aa" });
  });
});
