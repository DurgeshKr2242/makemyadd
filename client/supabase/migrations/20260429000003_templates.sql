-- TODO §6.3 — templates table.
-- Static template registry. Seeded once. Public read, no client writes.

create table public.templates (
    id              text primary key,                 -- e.g. "festival_bright_01_1x1"
    name            text not null,
    category        text not null check (category in ('sale', 'showcase', 'trust', 'urgency')),
    formats         text[] not null check (array_length(formats, 1) >= 1),
    preview_url     text,                             -- R2 URL of template preview image
    config          jsonb not null,                   -- Fabric.js template JSON
    is_active       boolean not null default true,
    created_at      timestamptz not null default now()
);

comment on table  public.templates is 'Static template registry. Seeded by client/lib/templates/configs/. Read-only to clients.';
comment on column public.templates.config is 'Fabric.js template JSON consumed by FabricCanvas. Includes width/height/background and layer tree.';

-- Browse query is `where category = ? and is_active = true order by name`.
-- Partial index keeps the hot path — inactive templates are rarely listed.
create index templates_active_category_idx
    on public.templates(category, name)
    where is_active = true;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.templates enable row level security;

-- Public read — templates are visible without auth (used on the marketing
-- preview gallery and inside the dashboard). `to anon, authenticated` keeps
-- service_role on a separate fast path.
create policy "Public read active templates" on public.templates
    for select
    to anon, authenticated
    using ( is_active = true );

-- No client writes. Service role (migration / seed) is the only writer.
