-- TODO §6 / §24 — Realtime + cron helpers.
-- Adds the bits that don't naturally belong inside any single table migration:
--   1. Realtime publication for `generations` so the dashboard can stream
--      pending → processing → complete transitions without polling.
--   2. `reset_monthly_quotas()` for the Vercel/Supabase cron.

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Supabase auto-creates `supabase_realtime` publication on project init, but
-- doesn't add tables. Add only the rows clients should subscribe to. RLS is
-- enforced on realtime payloads as well, so clients see their own rows only.
-- See https://supabase.com/docs/guides/realtime/postgres-changes
alter publication supabase_realtime add table public.generations;

-- ─── Monthly quota reset ─────────────────────────────────────────────────────
-- The free tier resets `generation_count` to 0 on the calendar month boundary.
-- Paid tiers track their own usage but we still bump `monthly_reset_at` so the
-- next "days until reset" UI hint is correct.
--
-- Invoked by the Vercel Cron at /api/cron/reset-quotas (TODO §24) using the
-- service-role client. Returns the number of rows reset for cron observability.
create or replace function public.reset_monthly_quotas()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
    reset_count int;
begin
    update public.profiles
    set generation_count = 0,
        monthly_reset_at = now()
    where monthly_reset_at < date_trunc('month', now());
    get diagnostics reset_count = row_count;
    return reset_count;
end;
$$;

comment on function public.reset_monthly_quotas() is
    'Cron helper — resets generation_count for any profile whose monthly_reset_at is in a past calendar month. Idempotent; safe to run hourly.';

-- Lock the function down: only the service role should call it.
revoke all on function public.reset_monthly_quotas() from public, anon, authenticated;
