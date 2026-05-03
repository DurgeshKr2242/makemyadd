-- TODO §6.4 — generations table.
-- One row per ad generation attempt. RLS scopes to owner.

create table public.generations (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references public.profiles(id) on delete cascade,

    -- inputs
    input_type          text not null check (input_type in ('url', 'photo')),
    input_url           text,                                    -- if input_type = 'url'
    product_image_url   text,                                    -- R2 URL of original
    bg_removed_url      text,                                    -- R2 URL of transparent PNG
    product_name        text,
    product_desc        text,
    language            text not null check (language in ('en', 'hi', 'ta', 'te')),
    template_id         text references public.templates(id) on delete set null,
    format              text not null check (format in ('1x1', '9x16', '4x5')),

    -- outputs
    copy_variants       jsonb,                                   -- [{headline, subheadline, cta}] x3
    selected_variant    int default 0 check (selected_variant >= 0),
    status              text not null default 'pending'
                            check (status in ('pending', 'processing', 'complete', 'failed')),
    error_message       text,

    -- meta (e.g. fallback flags, copy-cache hits, timing) — keeps schema flexible
    meta                jsonb not null default '{}'::jsonb,

    created_at          timestamptz not null default now()
);

comment on table  public.generations is 'One row per ad-generation attempt. Status machine: pending → processing → complete | failed.';
comment on column public.generations.meta is 'Free-form metadata: copy_cache_hit, hf_latency_ms, fallback flags, etc. Avoid storing PII here.';

-- Dashboard list: most recent first per user.
create index generations_user_created_idx on public.generations(user_id, created_at desc);
-- Operational queries: stuck-job sweep, status counters.
create index generations_status_idx
    on public.generations(status, created_at)
    where status in ('pending', 'processing');

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.generations enable row level security;

create policy "Users manage own generations" on public.generations
    for all
    to authenticated
    using      ( (select auth.uid()) = user_id )
    with check ( (select auth.uid()) = user_id );
