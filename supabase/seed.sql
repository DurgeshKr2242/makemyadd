-- Seed data — runs after migrations on `supabase db reset`.
-- The full template registry lives in client/lib/templates/configs/. The
-- seed below is a minimal smoke set so the dashboard has something to render
-- once the templates fetch is wired (TODO §11.2).

insert into public.templates (id, name, category, formats, config, is_active) values
('festival_bright_01_1x1',  'Festival Bright',   'sale',     array['1x1'],
    '{"id":"festival_bright_01_1x1","canvas":{"width":1080,"height":1080,"background":"#FF6B35"},"layers":[]}'::jsonb, true),
('festival_bright_01_9x16', 'Festival Bright',   'sale',     array['9x16'],
    '{"id":"festival_bright_01_9x16","canvas":{"width":1080,"height":1920,"background":"#FF6B35"},"layers":[]}'::jsonb, true),
('festival_bright_01_4x5',  'Festival Bright',   'sale',     array['4x5'],
    '{"id":"festival_bright_01_4x5","canvas":{"width":1080,"height":1350,"background":"#FF6B35"},"layers":[]}'::jsonb, true),
('clean_minimal_01_1x1',    'Clean Minimal',     'showcase', array['1x1'],
    '{"id":"clean_minimal_01_1x1","canvas":{"width":1080,"height":1080,"background":"#0F0F12"},"layers":[]}'::jsonb, true),
('trust_badge_01_1x1',      'Trust Badge',       'trust',    array['1x1'],
    '{"id":"trust_badge_01_1x1","canvas":{"width":1080,"height":1080,"background":"#1B2A4E"},"layers":[]}'::jsonb, true),
('urgency_red_01_1x1',      'Urgency Red',       'urgency',  array['1x1'],
    '{"id":"urgency_red_01_1x1","canvas":{"width":1080,"height":1080,"background":"#C81D25"},"layers":[]}'::jsonb, true)
on conflict (id) do nothing;
