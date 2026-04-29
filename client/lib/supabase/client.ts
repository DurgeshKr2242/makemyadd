/**
 * Browser Supabase client.
 *
 * Use inside Client Components only (`"use client"` files). Never imported
 * from a Server Component, Route Handler, or Server Action — those use
 * `lib/supabase/server.ts` so they read the session cookie correctly.
 *
 * See TODO §3.2 / §6.
 */
import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

import type { Database } from "./database.types";

export function createClient() {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. (See TODO §20.)",
    );
  }
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
