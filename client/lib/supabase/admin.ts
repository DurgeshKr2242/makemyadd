/**
 * Service-role Supabase client. **Bypasses Row Level Security.**
 *
 * Allowed callers:
 *   - Route handlers under `app/api/payments/webhook/route.ts` (Razorpay HMAC verified)
 *   - Background tasks (quota reset, cache eviction)
 *   - Migration / seed scripts
 *
 * Forbidden callers:
 *   - Any Client Component
 *   - Server Components (use `lib/supabase/server.ts`)
 *   - Any file under `app/(dashboard)/**`
 *
 * The `import "server-only"` line + the Biome `noRestrictedImports` rule
 * make these violations build / lint failures. Do not silence them.
 *
 * See TODO §3.2 / §6 / AGENTS.md "Database".
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env";
import { requireServerEnv } from "@/lib/env.server";

import type { Database } from "./database.types";

let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add to .env.local. (See TODO §20.)",
    );
  }
  const serviceRoleKey = requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  cachedAdminClient = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return cachedAdminClient;
}
