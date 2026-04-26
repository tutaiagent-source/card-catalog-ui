-- Subscription welcome emails (idempotent via stripe_subscription_id)

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email_type text not null,
  stripe_subscription_id text not null,
  recipient_email text not null,
  plan_name text not null,
  status text not null default 'sent',
  resend_message_id text,
  created_at timestamptz not null default now(),

  constraint email_events_unique_welcome_per_subscription unique (email_type, stripe_subscription_id)
);

alter table public.email_events enable row level security;

drop policy if exists "email_events_select_own" on public.email_events;
create policy "email_events_select_own"
  on public.email_events
  for select
  using (user_id = auth.uid());

