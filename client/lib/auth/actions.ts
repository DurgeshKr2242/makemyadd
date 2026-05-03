"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { publicEnv } from "@/lib/env";
import {
  forgotSchema,
  resetSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

import { type ActionResult, err, ok } from "./types";

/**
 * Email + password sign-in. Generic error on bad creds — never tells the user
 * whether the email or the password was wrong (no account enumeration).
 */
export async function signInAction(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return err(issue?.message ?? "Invalid input", String(issue?.path[0] ?? ""));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return err("Email or password is incorrect", "password");
  }
  return ok(undefined);
}

/**
 * Email + password sign-up. Captcha-gated. Profile row is created by the
 * `handle_new_user()` trigger (migration 001) reading `raw_user_meta_data`.
 */
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    turnstileToken: formData.get("turnstileToken"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return err(issue?.message ?? "Invalid input", String(issue?.path[0] ?? ""));
  }

  const h = await headers();
  const remoteIp = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const captchaOk = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    remoteIp,
  );
  if (!captchaOk) {
    return err("Captcha verification failed. Refresh and try again.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    if (/already registered/i.test(error.message)) {
      return err("An account with that email already exists.", "email");
    }
    if (/password/i.test(error.message)) {
      return err(error.message, "password");
    }
    return err("Could not create account. Please try again.");
  }
  return ok(undefined);
}

/**
 * Sends a password-reset email. Always returns ok, regardless of whether the
 * address corresponds to an account, to prevent enumeration.
 */
export async function forgotPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid email", "email");
  }
  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  // Intentionally swallow the error for the no-enumeration guarantee.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/reset`,
  });
  return ok(undefined);
}

/**
 * Sets a new password for the currently-authenticated session (the user has
 * just clicked through the reset link, so a recovery session is active).
 */
export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return err(issue?.message ?? "Invalid input", String(issue?.path[0] ?? ""));
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return err(error.message, "password");
  }
  return ok(undefined);
}

/**
 * Sign out + redirect to /login. Accepts (and ignores) FormData so it can be
 * invoked directly via `<form action={signOutAction}>` per Next 15+ contract.
 */
export async function signOutAction(_formData: FormData): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
