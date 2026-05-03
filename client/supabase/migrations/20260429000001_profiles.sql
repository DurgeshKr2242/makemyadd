-- TODO §6.1 — profiles table.
-- One row per authenticated user. Created automatically via trigger on
-- auth.users insert. RLS: users can read/update their own row only.

create table public.profiles (
    id                       uuid primary key references auth.users(id) on delete cascade,
    full_name                text,
    avatar_url               text,
    plan                     text not null default 'free'
                                 check (plan in ('free', 'starter', 'pro', 'agency')),
    generation_count         int  not null default 0
                                 check (generation_count >= 0),
    monthly_reset_at         timestamptz not null default now(),
    razorpay_customer_id     text unique,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now()
);

comment on table  public.profiles is 'One row per auth.users entry. Created by handle_new_user() trigger; mutated by user (own row) or service role.';
comment on column public.profiles.plan is 'Current billing plan. Source of truth is subscriptions table; webhook updates this column.';
comment on column public.profiles.generation_count is 'Generations consumed in the current billing window. Reset monthly via reset_monthly_quotas().';

-- Auto-create profile on signup. SECURITY DEFINER + empty search_path so the
-- function only sees fully-qualified objects (defends against schema-shadow
-- attacks via search_path). See https://supabase.com/docs/guides/database/functions#security-definer
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$;

-- Defense in depth: nothing other than the trigger should be able to call
-- handle_new_user(). Trigger context fires regardless of execute grants.
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Generic updated_at bumper. Reused by every table with an updated_at column.
-- Lives in this migration since profiles is the first table to need it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- All policies wrap auth.uid() in `(select ...)` so PostgreSQL caches the call
-- once per query (init-plan) instead of evaluating it per row. See
-- https://supabase.com/docs/guides/database/postgres/row-level-security#performance
alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
    for select
    to authenticated
    using ( (select auth.uid()) = id );

create policy "Users update own profile" on public.profiles
    for update
    to authenticated
    using      ( (select auth.uid()) = id )
    with check ( (select auth.uid()) = id );

-- No insert policy on purpose — handle_new_user() trigger handles inserts via
-- SECURITY DEFINER. No delete policy — users delete their account via
-- auth.users which cascades.
