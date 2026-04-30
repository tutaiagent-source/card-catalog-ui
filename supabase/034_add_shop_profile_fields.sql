-- Card shop profile + manual verification (v1)

alter table public.profiles
  add column if not exists is_shop boolean not null default false;

alter table public.profiles
  add column if not exists shop_name text not null default '';

alter table public.profiles
  add column if not exists shop_address text not null default '';

alter table public.profiles
  add column if not exists shop_phone text not null default '';

alter table public.profiles
  add column if not exists shop_website text not null default '';

alter table public.profiles
  add column if not exists shop_show_address boolean not null default false;

alter table public.profiles
  add column if not exists shop_show_phone boolean not null default false;

alter table public.profiles
  add column if not exists shop_show_website boolean not null default false;

alter table public.profiles
  add column if not exists shop_verification_status text not null default 'unsubmitted';

-- Manual verification bookkeeping
alter table public.profiles
  add column if not exists shop_verified_at timestamptz;

alter table public.profiles
  add column if not exists shop_verified_by uuid references auth.users(id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_shop_verification_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_shop_verification_status_check
      check (shop_verification_status in ('unsubmitted','pending','verified','rejected'));
  end if;
end;
$$;

create index if not exists profiles_shop_verification_status_pending_idx
  on public.profiles (created_at desc)
  where is_shop = true and shop_verification_status = 'pending';
