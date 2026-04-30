// client/app/api/generations/route.ts
// Spec §11 — List user's saved generations (paginated cursor-based).
// Middleware at client/middleware.ts already gates /api/generations/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const QuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Re-verify session to obtain the user id (middleware already ensured auth).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO §11 — implement paginated generations query:
  //   - SELECT * FROM generations WHERE user_id = user.id ORDER BY created_at DESC
  //   - Apply cursor (created_at < cursor) and LIMIT limit + 1.
  //   - If limit+1 rows returned, strip last and set nextCursor.
  return NextResponse.json(
    { error: "not_implemented", spec: "§11" },
    { status: 501 },
  );
}
