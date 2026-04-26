-- Deal Records (documentation-only) attached to message conversations
-- Phase 2: schema + RLS

create extension if not exists pgcrypto;

-- Core deal record (one or more per conversation)
create table if not exists public.deal_records (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null references public.conversations(id) on delete cascade,

  -- Optional: which specific card in the thread this deal is about.
  card_id uuid references public.cards(id) on delete set null,

  buyer_user_id uuid references auth.users(id) on delete set null,
  seller_user_id uuid references auth.users(id) on delete set null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,

  deal_type text not null default 'sale',
  status text not null default 'draft',

  agreed_price numeric,
  trade_value numeric,
  currency text not null default 'USD',

  accepted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deal_records_conversation_idx on public.deal_records (conversation_id, created_at desc);
create index if not exists deal_records_status_idx on public.deal_records (status);

-- Deal offers (one or more offers per deal record)
create table if not exists public.deal_offers (
  id uuid primary key default gen_random_uuid(),

  deal_record_id uuid not null references public.deal_records(id) on delete cascade,

  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,

  offer_amount numeric,
  currency text not null default 'USD',

  trade_notes text,
  message text,

  status text not null default 'pending',
  expires_at timestamptz,

  responded_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists deal_offers_deal_record_idx on public.deal_offers (deal_record_id, created_at asc);
create index if not exists deal_offers_status_idx on public.deal_offers (status);

-- Deal details (payment/shipping/documentation notes)
create table if not exists public.deal_details (
  id uuid primary key default gen_random_uuid(),

  deal_record_id uuid unique not null references public.deal_records(id) on delete cascade,

  payment_method_note text,
  paid_date date,
  payment_reference_note text,

  shipping_carrier text,
  tracking_number text,
  shipped_date date,
  delivered_date date,

  shipping_cost numeric,

  insurance_purchased boolean not null default false,
  insurance_amount numeric,
  signature_required boolean not null default false,

  condition_notes text,
  card_serial_number text,
  card_grade text,
  included_extras text,

  buyer_notes text,
  seller_notes text,

  issue_reported boolean not null default false,
  issue_notes text,
  final_status text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timeline events
create table if not exists public.deal_timeline_events (
  id uuid primary key default gen_random_uuid(),

  deal_record_id uuid not null references public.deal_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  event_type text not null,
  title text not null,
  description text,
  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists deal_timeline_events_deal_record_idx on public.deal_timeline_events (deal_record_id, created_at asc);

-- updated_at triggers
-- (public.set_updated_at already exists in earlier migrations, but re-create defensively)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deal_records_set_updated_at on public.deal_records;
create trigger deal_records_set_updated_at
before update on public.deal_records
for each row execute function public.set_updated_at();

drop trigger if exists deal_details_set_updated_at on public.deal_details;
create trigger deal_details_set_updated_at
before update on public.deal_details
for each row execute function public.set_updated_at();

alter table public.deal_records enable row level security;
alter table public.deal_offers enable row level security;
alter table public.deal_details enable row level security;
alter table public.deal_timeline_events enable row level security;

-- Helpers: participants in a conversation
-- SELECT
create policy "deal_records_select_participant"
  on public.deal_records
  for select
  using (
    exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = deal_records.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- INSERT
create policy "deal_records_insert_participant"
  on public.deal_records
  for insert
  with check (
    created_by_user_id = auth.uid()
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = deal_records.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- UPDATE (documentation tool; allow all participants to update)
create policy "deal_records_update_participant"
  on public.deal_records
  for update
  using (
    exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = deal_records.conversation_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = deal_records.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- Deal offers
create policy "deal_offers_select_participant"
  on public.deal_offers
  for select
  using (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_offers.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

create policy "deal_offers_insert_participant"
  on public.deal_offers
  for insert
  with check (
    from_user_id = auth.uid()
    and exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_offers.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

create policy "deal_offers_update_participant"
  on public.deal_offers
  for update
  using (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_offers.deal_record_id
        and cp.user_id = auth.uid()
    )
    and (from_user_id = auth.uid() or to_user_id = auth.uid())
  )
  with check (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_offers.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

-- Deal details
create policy "deal_details_select_participant"
  on public.deal_details
  for select
  using (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_details.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

create policy "deal_details_insert_participant"
  on public.deal_details
  for insert
  with check (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_details.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

create policy "deal_details_update_participant"
  on public.deal_details
  for update
  using (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_details.deal_record_id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_details.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

-- Deal timeline events
create policy "deal_timeline_events_select_participant"
  on public.deal_timeline_events
  for select
  using (
    exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_timeline_events.deal_record_id
        and cp.user_id = auth.uid()
    )
  );

create policy "deal_timeline_events_insert_participant"
  on public.deal_timeline_events
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.deal_records dr
      join public.conversation_participants cp
        on cp.conversation_id = dr.conversation_id
      where dr.id = deal_timeline_events.deal_record_id
        and cp.user_id = auth.uid()
    )
  );
