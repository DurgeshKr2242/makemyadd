/**
 * Server-only helper for protected pages. Returns the current user and their
 * profile in one shot, redirects to /login on no session. The dashboard
 * layout calls this so child server pages can rely on `user` being set
 * without redoing the dance.
 */
import "server-only";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan, generation_count, monthly_reset_at")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
