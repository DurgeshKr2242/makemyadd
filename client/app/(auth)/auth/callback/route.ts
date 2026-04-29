/**
 * OAuth code exchange handler.
 *
 * Supabase redirects here after Google sign-in with `?code=…`. We exchange
 * the code for a session (which sets the auth cookie via @supabase/ssr) and
 * redirect to the requested destination (or /dashboard).
 *
 * See TODO §3.1.
 */
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin),
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          url.origin,
        ),
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "auth_unavailable";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
