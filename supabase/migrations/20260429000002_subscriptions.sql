-- TODO §2.2 — subscriptions table.
-- Tracks Razorpay subscription per user. The webhook (with service-role
-- access) is the only writer. Users can read their own row.

create table public.subscriptions (
    id                          uuid primary key default gen_random_uuid(),
    user_id                     uuid not null references public.profiles(id) on delete cascade,
    razorpay_subscription_id    text unique,
    razorpay_plan_id            text,
    plan                        text not null check (plan in ('starter', 'pro', 'agency')),
    status                      text not null default 'created'
                                    check (status in ('created', 'active', 'halted', 'cancelled')),
    current_period_start        timestamptz,
    current_period_end          timestamptz,
    created_at                  timestamptz not null default now(),
    updated_at                  timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions(user_id);
create index subscriptions_rzp_idx  on public.subscriptions(razorpay_subscription_id);

-- One active subscription per user (TODO §2.2 decision).
create unique index subscriptions_one_active_per_user
    on public.subscriptions(user_id)
    where status = 'active';

create trigger subscriptions_set_updated_at
    before update on public.subscriptions
    for each row execute procedure public.set_updated_at();

-- RLS
alter table public.subscriptions enable row level security;

create policy "Users read own subscription" on public.subscriptions
    for select using (auth.uid() = user_id);

-- No client-side writes — the webhook handler uses service-role.
