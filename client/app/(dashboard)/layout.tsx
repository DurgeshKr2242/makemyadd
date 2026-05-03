/**
 * Dashboard layout — server component.
 *
 * Gates everything under /dashboard, /history, /billing, /settings on a
 * Supabase session. The middleware also protects these paths; this layout's
 * explicit check guarantees `user` is set for child server pages and lets us
 * pass identity into the header without a client-side fetch.
 *
 * Falls back to a placeholder identity when Supabase env vars are missing
 * (fresh checkout) so the dev experience isn't blocked.
 */
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { publicEnv } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | undefined;
  let fullName: string | null = null;
  let plan: string | null = null;

  if (
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { user, profile } = await getCurrentUser();
    email = user.email ?? undefined;
    fullName = profile?.full_name ?? null;
    plan = profile?.plan ?? null;
  } else {
    email = "you@brand.in (dev mode)";
  }

  return (
    <>
      <DashboardHeader email={email} fullName={fullName} plan={plan} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
