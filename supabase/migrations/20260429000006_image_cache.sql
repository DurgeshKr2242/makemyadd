-- TODO §2.6 — image_cache table (pHash dedupe for HuggingFace BG removal).
-- Keyed by perceptual hash of the input image. Server-only access.

create table public.image_cache (
    phash               text primary key,
    bg_removed_url      text not null,
    hit_count           int  not null default 0,
    original_size_bytes int,
    created_at          timestamptz not null default now()
);

create index image_cache_created_idx on public.image_cache(created_at);

-- Helper used by the bgremove route.
create or replace function public.increment_image_cache_hit(p_phash text)
returns void
language sql
as $$
    update public.image_cache
    set hit_count = hit_count + 1
    where phash = p_phash;
$$;

-- RLS — service role only.
alter table public.image_cache enable row level security;

-- Eviction helper for the nightly cron (TODO §2.6 / §24 Vercel Cron).
create or replace function public.evict_stale_image_cache(days_old int default 30)
returns int
language plpgsql
as $$
declare
    deleted_count int;
begin
    delete from public.image_cache
    where hit_count = 0
      and created_at < now() - (days_old || ' days')::interval;
    get diagnostics deleted_count = row_count;
    return deleted_count;
end;
$$;
