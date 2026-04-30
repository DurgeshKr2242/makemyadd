// client/app/api/generations/[id]/route.ts
// Spec §11 — Fetch a single generation by UUID.
// Middleware at client/middleware.ts already gates /api/generations/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const IdSchema = z.string().uuid();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) {
    // The id is clearly invalid — we can 404 immediately without a DB round-trip.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Re-verify session to obtain the user id (middleware already ensured auth).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO §11 — implement single generation fetch:
  //   - SELECT * FROM generations WHERE id = parsed.data AND user_id = user.id
  //   - Return 404 if not found (RLS also ensures the user owns the row).
  return NextResponse.json(
    { error: "not_implemented", spec: "§11" },
    { status: 501 },
  );
}
