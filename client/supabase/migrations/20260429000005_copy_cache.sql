-- TODO §2.5 — copy_cache table.
-- Pre-generated copy variants keyed by (category, language, tone). Skips
-- the Groq call when we already have variants. Server-only access.

create table public.copy_cache (
    id              uuid primary key default gen_random_uuid(),
    category        text not null check (category in ('fashion', 'food', 'electronics', 'beauty', 'home')),
    language        text not null check (language in ('en', 'hi', 'ta', 'te')),
    tone            text not null check (tone in ('festive', 'urgent', 'trust', 'showcase')),
    variants        jsonb not null,                              -- [{headline, subheadline, cta}] x5
    use_count       int not null default 0,
    created_at      timestamptz not null default now()
);

create index copy_cache_lookup_idx on public.copy_cache(category, language, tone);

-- Increment helper.
create or replace function public.increment_copy_cache_use(cache_id uuid)
returns void
language sql
as $$
    update public.copy_cache
    set use_count = use_count + 1
    where id = cache_id;
$$;

-- RLS — enabled with NO client policies. Only the service role can touch it.
alter table public.copy_cache enable row level security;
