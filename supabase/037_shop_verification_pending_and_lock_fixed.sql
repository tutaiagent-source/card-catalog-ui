-- Card shop verification v2 (FIXED): safe remap of statuses without check-constraint violations
-- Run this instead of 036_shop_verification_pending_and_lock.sql if the previous remap failed.

begin;

-- 0) Drop old check constraint FIRST so remap values don't fail.
alter table public.profiles
  drop constraint if exists profiles_shop_verification_status_check;

-- ----------------------------
-- 1) Status values + backfill
-- ----------------------------
-- Remap existing values to new names.
update public.profiles
set shop_verification_status = 'not_submitted'
where shop_verification_status = 'unsubmitted';

update public.profiles
set shop_verification_status = 'pending_review'
where shop_verification_status = 'pending';

-- Keep verified/rejected as-is.

-- Ensure default.
alter table public.profiles
  alter column shop_verification_status set default 'not_submitted';

-- Recreate check constraint with new values.
alter table public.profiles
  add constraint profiles_shop_verification_status_check
  check (shop_verification_status in (
    'not_submitted',
    'pending_review',
    'verified',
    'changes_requested',
    'rejected',
    'reverification_required'
  ));

-- ----------------------------
-- 2) Shop type (physical vs online)
-- ----------------------------
alter table public.profiles
  add column if not exists shop_type text not null default 'physical';

alter table public.profiles
  add column if not exists pending_shop_type text not null default 'physical';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_shop_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_shop_type_check
      check (shop_type in ('physical','online') and pending_shop_type in ('physical','online'));
  end if;
end;
$$;

-- ----------------------------
-- 3) Pending submission fields (do not overwrite verified fields)
-- ----------------------------
alter table public.profiles
  add column if not exists pending_shop_name text not null default '';

alter table public.profiles
  add column if not exists pending_shop_address text not null default '';

alter table public.profiles
  add column if not exists pending_shop_phone text not null default '';

alter table public.profiles
  add column if not exists pending_shop_website text not null default '';

-- Reuse avatar_url as shop logo for now (Option A). Still store pending avatar separately.
alter table public.profiles
  add column if not exists pending_avatar_url text not null default '';

-- Admin note (used for changes_requested / rejected)
alter table public.profiles
  add column if not exists shop_admin_note text not null default '';

-- Helpful indexes for pending review.
create index if not exists profiles_shop_pending_review_idx
  on public.profiles (created_at desc)
  where is_shop = true and shop_verification_status = 'pending_review';

create index if not exists profiles_shop_changes_requested_idx
  on public.profiles (created_at desc)
  where is_shop = true and shop_verification_status = 'changes_requested';

-- ----------------------------
-- 4) Public view: only expose verified public data
-- ----------------------------
-- Rule:
-- - Shop name: visible iff shop_verified_at IS NOT NULL
-- - Address/phone/website: visible iff shop_verified_at IS NOT NULL AND shop_show_* toggle is ON

create or replace view public.profiles_public as
select
  p.id,
  p.username,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.allow_messages,
  p.market_visibility_mode,

  p.is_shop,

  case
    when p.shop_verified_at is not null then p.shop_name
    else null
  end as shop_name,

  p.shop_show_address,
  p.shop_show_phone,
  p.shop_show_website,

  p.shop_verification_status,

  case
    when p.shop_verified_at is not null and p.shop_show_address then p.shop_address
    else null
  end as shop_address,

  case
    when p.shop_verified_at is not null and p.shop_show_phone then p.shop_phone
    else null
  end as shop_phone,

  case
    when p.shop_verified_at is not null and p.shop_show_website then p.shop_website
    else null
  end as shop_website
from public.profiles p;

-- ----------------------------
-- 5) Lock verified fields against casual edits
-- ----------------------------
-- If a shop is verified (shop_verified_at not null), non-admin edits to live verified fields are captured into
-- pending_* and status becomes reverification_required. The existing verified public fields remain unchanged.

create or replace function public.enforce_shop_verified_lock()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_is_admin boolean;
begin
  if coalesce(OLD.is_shop,false) = true and OLD.shop_verified_at is not null then
    -- Is the updater @cardcat?
    select exists(
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(p.username) = 'cardcat'
    ) into v_is_admin;

    if not v_is_admin then
      if
        (NEW.shop_name is distinct from OLD.shop_name)
        or (NEW.shop_address is distinct from OLD.shop_address)
        or (NEW.shop_phone is distinct from OLD.shop_phone)
        or (NEW.shop_website is distinct from OLD.shop_website)
        or (NEW.shop_type is distinct from OLD.shop_type)
        or (NEW.avatar_url is distinct from OLD.avatar_url)
      then
        -- Capture attempted edits into pending fields.
        NEW.pending_shop_name := NEW.shop_name;
        NEW.pending_shop_address := NEW.shop_address;
        NEW.pending_shop_phone := NEW.shop_phone;
        NEW.pending_shop_website := NEW.shop_website;
        NEW.pending_shop_type := NEW.shop_type;
        NEW.pending_avatar_url := NEW.avatar_url;

        -- Mark for reverification.
        NEW.shop_verification_status := 'reverification_required';
        NEW.shop_admin_note := '';

        -- Restore live verified fields.
        NEW.shop_name := OLD.shop_name;
        NEW.shop_address := OLD.shop_address;
        NEW.shop_phone := OLD.shop_phone;
        NEW.shop_website := OLD.shop_website;
        NEW.shop_type := OLD.shop_type;
        NEW.avatar_url := OLD.avatar_url;
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists profiles_enforce_shop_verified_lock on public.profiles;
create trigger profiles_enforce_shop_verified_lock
before update of
  shop_name,
  shop_address,
  shop_phone,
  shop_website,
  shop_type,
  avatar_url,
  shop_verification_status
on public.profiles
for each row
execute function public.enforce_shop_verified_lock();

commit;
