-- TODO §2.3 — templates table.
-- Static template registry. Seeded once. Public read, no client writes.

create table public.templates (
    id              text primary key,                 -- e.g. "festival_bright_01"
    name            text not null,
    category        text not null check (category in ('sale', 'showcase', 'trust', 'urgency')),
    formats         text[] not null,                  -- ["1x1", "9x16", "4x5"]
    preview_url     text,                             -- R2 URL of template preview image
    config          jsonb not null,                   -- Fabric.js template JSON
    is_active       boolean not null default true,
    created_at      timestamptz not null default now()
);

-- RLS
alter table public.templates enable row level security;

create policy "Public read templates" on public.templates
    for select using (true);
