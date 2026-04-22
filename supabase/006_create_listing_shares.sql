-- Listing sharing links (public view-only) with optional expiration + revocation.

create extension if not exists pgcrypto;

create table if not exists public.listing_shares (
  id uuid primary key default gen_random_uuid(),
  share_token text unique not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,

  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,

  show_pricing boolean not null default true
);

create index if not exists listing_shares_owner_idx on public.listing_shares (owner_user_id, created_at desc);
create index if not exists listing_shares_token_idx on public.listing_shares (share_token);

alter table public.listing_shares enable row level security;

-- Allow listers to create/select/update their own share rows
create policy "listing_shares_insert_own"
  on public.listing_shares
  for insert
  with check (owner_user_id = auth.uid());

create policy "listing_shares_select_own"
  on public.listing_shares
  for select
  using (owner_user_id = auth.uid());

create policy "listing_shares_update_own"
  on public.listing_shares
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
