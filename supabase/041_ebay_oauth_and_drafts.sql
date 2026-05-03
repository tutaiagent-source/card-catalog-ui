-- eBay integration (OAuth per user + draft listing records)

-- 1) eBay account connections
create table if not exists public.ebay_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Store refresh token so we can act later (encrypt in a future hardening pass).
  refresh_token text not null,

  -- Optional/diagnostic fields
  access_token text,
  token_expires_at timestamptz,
  scopes text,
  display_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ebay_accounts_user_idx on public.ebay_accounts(user_id);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'ebay_accounts_set_updated_at') then
    create trigger ebay_accounts_set_updated_at
    before update on public.ebay_accounts
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- 2) Draft listing audit trail
create table if not exists public.ebay_listing_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid,

  listing_type text not null check (listing_type in ('auction', 'fixed')),
  auction_duration_days int,
  start_price numeric,

  status text not null default 'created', -- created|submitted|error

  ebay_draft_id text,
  draft_url text,

  card_snapshot jsonb not null default '{}'::jsonb,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ebay_listing_drafts_user_idx on public.ebay_listing_drafts(user_id);

-- Updated_at trigger

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'ebay_listing_drafts_set_updated_at') then
    create trigger ebay_listing_drafts_set_updated_at
    before update on public.ebay_listing_drafts
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.ebay_accounts enable row level security;
alter table public.ebay_listing_drafts enable row level security;

-- ebay_accounts policies
drop policy if exists "ebay_accounts_select_own" on public.ebay_accounts;
drop policy if exists "ebay_accounts_insert_own" on public.ebay_accounts;
drop policy if exists "ebay_accounts_update_own" on public.ebay_accounts;
drop policy if exists "ebay_accounts_delete_own" on public.ebay_accounts;

create policy "ebay_accounts_select_own"
  on public.ebay_accounts
  for select
  using (user_id = auth.uid());

create policy "ebay_accounts_insert_own"
  on public.ebay_accounts
  for insert
  with check (user_id = auth.uid());

create policy "ebay_accounts_update_own"
  on public.ebay_accounts
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ebay_accounts_delete_own"
  on public.ebay_accounts
  for delete
  using (user_id = auth.uid());

-- ebay_listing_drafts policies
create policy "ebay_listing_drafts_select_own"
  on public.ebay_listing_drafts
  for select
  using (user_id = auth.uid());

create policy "ebay_listing_drafts_insert_own"
  on public.ebay_listing_drafts
  for insert
  with check (user_id = auth.uid());

create policy "ebay_listing_drafts_update_own"
  on public.ebay_listing_drafts
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
