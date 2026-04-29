-- TODO §2.7 / §26 — Phase 2 scaffolds.
-- Tables and columns added now so Phase 2 features (WhatsApp bot, video ads
-- via Creatomate, brand kits) can ship without an architectural change.
-- All scaffolds are inert at MVP.

-- WhatsApp bot conversation state.
create table public.whatsapp_sessions (
    phone_number      text primary key,
    user_id           uuid references public.profiles(id) on delete cascade,
    step              text not null default 'idle',
                      -- idle | awaiting_language | awaiting_format | generating
    language          text check (language in ('en', 'hi', 'ta', 'te')),
    format            text check (format in ('1x1', '9x16', '4x5')),
    input_image_url   text,
    last_activity     timestamptz not null default now()
);

alter table public.whatsapp_sessions enable row level security;
-- No policies — bot uses service role.

-- Brand kits (Phase 2 — Pro plan feature).
create table public.brand_kits (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references public.profiles(id) on delete cascade,
    name             text not null default 'My Brand',
    logo_url         text,
    primary_color    text,
    secondary_color  text,
    font_family      text default 'Noto Sans',
    created_at       timestamptz not null default now()
);

create index brand_kits_user_idx on public.brand_kits(user_id);

alter table public.brand_kits enable row level security;

create policy "Users manage own brand kits" on public.brand_kits
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Video templates via Creatomate (Phase 2).
alter table public.templates
    add column is_video boolean not null default false,
    add column creatomate_template_id text;
