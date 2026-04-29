/**
 * Server Supabase client.
 *
 * Use inside Server Components, Route Handlers, and Server Actions. Reads /
 * writes the session cookie via Next.js's `cookies()` helper so RLS receives
 * the correct `auth.uid()`.
 *
 * For admin operations that need to bypass RLS, use `lib/supabase/admin.ts`
 * instead. Never expose the service role key from this file.
 *
 * See TODO §3.2 / §6.
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/env";

import type { Database } from "./database.types";

export async function createClient() {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. (See TODO §20.)",
    );
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll() can be called from a Server Component, where cookies
            // are read-only. Safe to ignore — the middleware refresh will
            // handle the cookie write on the next request.
          }
        },
      },
    },
  );
}
