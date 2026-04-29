/**
 * Next.js middleware — runs on every matched request.
 *
 * Responsibilities:
 *   1. Refresh the Supabase session cookie so server components see the
 *      latest auth state.
 *   2. Gate protected paths — redirect unauthenticated users to /login,
 *      preserving the original destination in `?next=…`.
 *
 * See TODO §3.3.
 */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/lib/env";

const PROTECTED_PREFIXES = ["/dashboard", "/history", "/billing", "/settings"];
const PROTECTED_API_PREFIXES = [
  "/api/generate",
  "/api/payments",
  "/api/upload",
  "/api/generations",
];

const ALLOW_API = new Set([
  // Webhook is signature-verified, never carries a session
  "/api/payments/webhook",
]);

function isProtected(pathname: string) {
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (ALLOW_API.has(pathname)) return false;
  return PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // If Supabase env isn't set yet, skip auth refresh — protected paths still
  // redirect to /login below. Lets the scaffold boot before Supabase is wired.
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (isProtected(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh the session — getUser() forces a server-side validation, which is
  // safer than getSession() (which trusts the cookie value).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const protectedPath = isProtected(pathname);

  if (protectedPath && !user) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/api")) {
      // API: 401 JSON, don't redirect
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    url.pathname = "/login";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // If signed in and visiting /login or /signup, bounce to /dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every path except static files, images, and Next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|woff|ttf|otf|css|js)$).*)",
  ],
};
