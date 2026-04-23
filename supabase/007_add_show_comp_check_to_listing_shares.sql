alter table public.listing_shares
  add column if not exists show_comp_check boolean not null default false;
