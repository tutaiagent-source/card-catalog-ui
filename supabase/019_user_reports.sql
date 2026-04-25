-- User reports (block/report moderation v1)

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint user_reports_not_self check (reporter_user_id <> reported_user_id),
  constraint user_reports_reason_len check (char_length(reason) <= 500)
);

create index if not exists user_reports_reporter_idx on public.user_reports (reporter_user_id, created_at desc);
create index if not exists user_reports_reported_idx on public.user_reports (reported_user_id, created_at desc);

alter table public.user_reports enable row level security;

-- Let users create their own reports.
drop policy if exists "user_reports_insert_own" on public.user_reports;
create policy "user_reports_insert_own"
  on public.user_reports
  for insert
  with check (reporter_user_id = auth.uid());
