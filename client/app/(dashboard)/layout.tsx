/**
 * Dashboard layout — server component.
 *
 * Gates everything under /dashboard, /history, /billing, /settings on a
 * Supabase session. The middleware also protects these paths, but the layout
 * does an explicit check so that:
 *   1. Server components downstream can rely on `user` being set.
 *   2. We can pass `user.email` to the header without a client-side fetch.
 *
 * If Supabase env vars aren't set yet (fresh checkout), we render the chrome
 * with a placeholder email so the dev experience isn't blocked. Auth wiring
 * lands in TODO §6.
 */
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { publicEnv } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | undefined;

  if (
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
    userEmail = user.email ?? undefined;
  } else {
    userEmail = "you@brand.in (dev mode)";
  }

  return (
    <>
      <DashboardHeader userEmail={userEmail} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
