-- Adds PC (Personal Collection) ordering to the cards table.
-- Run this in Supabase SQL editor (or via migrations).

alter table public.cards
  add column if not exists pc_position double precision;

create index if not exists cards_user_pc_position_idx
  on public.cards (user_id, pc_position);
