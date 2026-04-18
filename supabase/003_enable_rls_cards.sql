-- Enable Row Level Security for cards so users can only access their own rows

alter table public.cards enable row level security;

drop policy if exists "cards_select_own" on public.cards;
drop policy if exists "cards_insert_own" on public.cards;
drop policy if exists "cards_update_own" on public.cards;
drop policy if exists "cards_delete_own" on public.cards;

create policy "cards_select_own"
  on public.cards
  for select
  using (user_id = auth.uid());

create policy "cards_insert_own"
  on public.cards
  for insert
  with check (user_id = auth.uid());

create policy "cards_update_own"
  on public.cards
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cards_delete_own"
  on public.cards
  for delete
  using (user_id = auth.uid());
