alter table public.profiles
  add column if not exists market_visibility_mode text not null default 'none';

alter table public.cards
  add column if not exists public_market_visible boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_market_visibility_mode_check'
  ) then
    alter table public.profiles
      add constraint profiles_market_visibility_mode_check
      check (market_visibility_mode in ('none', 'selected_cards', 'all_listed', 'whole_collection'));
  end if;
end;
$$;

drop policy if exists "cards_select_public_market" on public.cards;
create policy "cards_select_public_market"
  on public.cards
  for select
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = cards.user_id
        and coalesce(nullif(trim(p.username), ''), '') <> ''
        and (
          p.market_visibility_mode = 'whole_collection'
          or (p.market_visibility_mode = 'all_listed' and cards.status = 'Listed')
          or (p.market_visibility_mode = 'selected_cards' and cards.public_market_visible = true)
        )
    )
  );
