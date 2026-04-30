-- TODO §2.1 — profiles table.
-- One row per authenticated user. Created automatically via trigger on
-- auth.users insert. RLS: users can read/update their own row only.

create table public.profiles (
    id                       uuid primary key references auth.users(id) on delete cascade,
    full_name                text,
    avatar_url               text,
    plan                     text not null default 'free'
                                 check (plan in ('free', 'starter', 'pro', 'agency')),
    generation_count         int  not null default 0,
    monthly_reset_at         timestamptz not null default now(),
    razorpay_customer_id     text unique,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now()
);

-- Auto-create profile on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Bump updated_at on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users update own profile" on public.profiles
    for update using (auth.uid() = id);

-- No insert policy on purpose — trigger above handles inserts.
