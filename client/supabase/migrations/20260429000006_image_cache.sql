-- TODO §6.6 — image_cache table (pHash dedupe for HuggingFace BG removal).
-- Keyed by perceptual hash of the input image. Server-only access.

create table public.image_cache (
    phash               text primary key,
    bg_removed_url      text not null,
    hit_count           int  not null default 0 check (hit_count >= 0),
    original_size_bytes int  check (original_size_bytes is null or original_size_bytes > 0),
    created_at          timestamptz not null default now()
);

comment on table  public.image_cache is 'pHash → R2 URL dedupe cache for HuggingFace bg-removal calls. Server-role only. Evicted nightly via evict_stale_image_cache().';
comment on column public.image_cache.phash is '16-character perceptual hash (sharp-phash). Two near-identical images collide here, saving an HF call.';

-- Eviction job scans by created_at; index supports it.
create index image_cache_created_idx on public.image_cache(created_at);

-- Helper used by the bgremove route.
create or replace function public.increment_image_cache_hit(p_phash text)
returns void
language sql
set search_path = ''
as $$
    update public.image_cache
    set hit_count = hit_count + 1
    where phash = p_phash;
$$;

-- Eviction helper for the nightly cron (TODO §6.6 / §24 Vercel Cron).
create or replace function public.evict_stale_image_cache(days_old int default 30)
returns int
language plpgsql
set search_path = ''
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

revoke all on function public.increment_image_cache_hit(text) from public, anon, authenticated;
revoke all on function public.evict_stale_image_cache(int)    from public, anon, authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Service role only — clients cannot enumerate hashes.
alter table public.image_cache enable row level security;
