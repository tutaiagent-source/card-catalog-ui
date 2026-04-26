-- Plan limits enforcement (server-side)
-- Enforces:
-- - Catalog cap (sum of cards.quantity where status <> 'Sold')
-- - Market cap (count of cards with status='Listed' visible on CardCat Market)
--
-- Visible on CardCat Market matches MarketPage logic:
-- - whole_collection: all Listed cards visible
-- - all_listed: all Listed cards visible
-- - selected_cards: only cards where cards.public_market_visible = true visible

-- ----------------------------
-- Helpers
-- ----------------------------

create or replace function public.get_effective_tier(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tier text;
begin
  -- Only treat these as “real” entitlements.
  select ue.tier
  into v_tier
  from public.user_entitlements ue
  where ue.user_id = p_user_id
    and ue.status in ('active','trialing','grandfathered');

  -- If no active entitlement exists yet, default to Collector caps.
  -- This avoids breaking core flows before paywall enforcement is fully rolled out.
  return coalesce(v_tier, 'collector');
end;
$$;

create or replace function public.plan_catalog_cap(p_tier text)
returns bigint
language sql
as $$
  select case
    when p_tier = 'collector' then 250
    when p_tier = 'pro' then 1000
    when p_tier = 'seller' then 10000
    else null
  end::bigint;
$$;

create or replace function public.plan_market_cap(p_tier text)
returns bigint
language sql
as $$
  select case
    when p_tier = 'collector' then 10
    when p_tier = 'pro' then 50
    when p_tier = 'seller' then 250
    else null
  end::bigint;
$$;

create or replace function public.count_catalog_cards(p_user_id uuid)
returns bigint
language sql
as $$
  select coalesce(sum(coalesce(c.quantity, 0))::bigint, 0)
  from public.cards c
  where c.user_id = p_user_id
    and coalesce(c.status, 'Collection') <> 'Sold';
$$;

create or replace function public.count_active_market_listings(p_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_mode text;
  v_count bigint;
begin
  select coalesce(p.market_visibility_mode, 'none')
  into v_mode
  from public.profiles p
  where p.id = p_user_id;

  select coalesce(count(*), 0)::bigint
  into v_count
  from public.cards c
  where c.user_id = p_user_id
    and c.status = 'Listed'
    and (
      v_mode in ('all_listed','whole_collection')
      or (v_mode = 'selected_cards' and coalesce(c.public_market_visible, false) = true)
    );

  return v_count;
end;
$$;

-- ----------------------------
-- Triggers on cards
-- ----------------------------

create or replace function public.enforce_plan_limits_cards()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tier text;
  v_catalog_cap bigint;
  v_market_cap bigint;
  v_mode text;

  v_existing_catalog bigint;
  v_old_catalog_contrib bigint;
  v_new_catalog_contrib bigint;
  v_new_catalog bigint;

  v_existing_market bigint;
  v_old_market_visible int;
  v_new_market_visible int;
  v_new_market bigint;
begin
  -- Enforce using effective tier.
  v_tier := public.get_effective_tier(coalesce(NEW.user_id, OLD.user_id));
  v_catalog_cap := public.plan_catalog_cap(v_tier);
  v_market_cap := public.plan_market_cap(v_tier);

  -- If caps are unknown, allow.
  if v_catalog_cap is null and v_market_cap is null then
    return NEW;
  end if;

  select coalesce(p.market_visibility_mode, 'none')
  into v_mode
  from public.profiles p
  where p.id = coalesce(NEW.user_id, OLD.user_id);

  if TG_OP = 'INSERT' then
    -- Catalog: sum(quantity) where status <> 'Sold'
    select coalesce(sum(coalesce(c.quantity,0))::bigint, 0)
    into v_existing_catalog
    from public.cards c
    where c.user_id = NEW.user_id
      and coalesce(c.status, 'Collection') <> 'Sold';

    v_new_catalog_contrib := case when coalesce(NEW.status,'Collection') <> 'Sold'
      then coalesce(NEW.quantity,0)::bigint
      else 0 end;
    v_new_catalog := v_existing_catalog + v_new_catalog_contrib;

    if v_catalog_cap is not null and v_new_catalog > v_catalog_cap then
      raise exception 'PLAN_LIMIT_CATALOG_CARDS_EXCEEDED: % > %', v_new_catalog, v_catalog_cap;
    end if;

    -- Market: count of visible Listed cards
    select count(*)::bigint
    into v_existing_market
    from public.cards c
    where c.user_id = NEW.user_id
      and c.status = 'Listed'
      and (
        v_mode in ('all_listed','whole_collection')
        or (v_mode = 'selected_cards' and coalesce(c.public_market_visible,false)=true)
      );

    v_old_market_visible := 0;
    v_new_market_visible := case when NEW.status = 'Listed' and (
      v_mode in ('all_listed','whole_collection')
      or (v_mode = 'selected_cards' and coalesce(NEW.public_market_visible,false)=true)
    ) then 1 else 0 end;

    v_new_market := v_existing_market + v_new_market_visible - v_old_market_visible;
    if v_market_cap is not null and v_new_market > v_market_cap then
      raise exception 'PLAN_LIMIT_MARKET_LISTINGS_EXCEEDED: % > %', v_new_market, v_market_cap;
    end if;

    return NEW;
  end if;

  -- UPDATE
  select coalesce(sum(coalesce(c.quantity,0))::bigint, 0)
  into v_existing_catalog
  from public.cards c
  where c.user_id = NEW.user_id
    and coalesce(c.status, 'Collection') <> 'Sold';

  v_old_catalog_contrib := case when coalesce(OLD.status,'Collection') <> 'Sold'
    then coalesce(OLD.quantity,0)::bigint
    else 0 end;
  v_new_catalog_contrib := case when coalesce(NEW.status,'Collection') <> 'Sold'
    then coalesce(NEW.quantity,0)::bigint
    else 0 end;
  v_new_catalog := v_existing_catalog - v_old_catalog_contrib + v_new_catalog_contrib;

  if v_catalog_cap is not null and v_new_catalog > v_catalog_cap then
    raise exception 'PLAN_LIMIT_CATALOG_CARDS_EXCEEDED: % > %', v_new_catalog, v_catalog_cap;
  end if;

  -- Market update
  select count(*)::bigint
  into v_existing_market
  from public.cards c
  where c.user_id = NEW.user_id
    and c.status = 'Listed'
    and (
      v_mode in ('all_listed','whole_collection')
      or (v_mode = 'selected_cards' and coalesce(c.public_market_visible,false)=true)
    );

  v_old_market_visible := case when OLD.status = 'Listed' and (
    v_mode in ('all_listed','whole_collection')
    or (v_mode = 'selected_cards' and coalesce(OLD.public_market_visible,false)=true)
  ) then 1 else 0 end;

  v_new_market_visible := case when NEW.status = 'Listed' and (
    v_mode in ('all_listed','whole_collection')
    or (v_mode = 'selected_cards' and coalesce(NEW.public_market_visible,false)=true)
  ) then 1 else 0 end;

  v_new_market := v_existing_market - v_old_market_visible + v_new_market_visible;

  if v_market_cap is not null and v_new_market > v_market_cap then
    raise exception 'PLAN_LIMIT_MARKET_LISTINGS_EXCEEDED: % > %', v_new_market, v_market_cap;
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_plan_limits_cards on public.cards;
create trigger enforce_plan_limits_cards
before insert or update of status, quantity, public_market_visible
on public.cards
for each row
execute function public.enforce_plan_limits_cards();

-- ----------------------------
-- Triggers on profiles (market mode changes)
-- ----------------------------

create or replace function public.enforce_plan_limits_profiles()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tier text;
  v_market_cap bigint;
  v_new_market_count bigint;
  v_mode text;
begin
  v_tier := public.get_effective_tier(NEW.id);
  v_market_cap := public.plan_market_cap(v_tier);

  select coalesce(NEW.market_visibility_mode,'none')
  into v_mode;

  select count(*)::bigint
  into v_new_market_count
  from public.cards c
  where c.user_id = NEW.id
    and c.status = 'Listed'
    and (
      v_mode in ('all_listed','whole_collection')
      or (v_mode = 'selected_cards' and coalesce(c.public_market_visible,false)=true)
    );

  if v_market_cap is not null and v_new_market_count > v_market_cap then
    raise exception 'PLAN_LIMIT_MARKET_LISTINGS_EXCEEDED: % > %', v_new_market_count, v_market_cap;
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_plan_limits_profiles on public.profiles;
create trigger enforce_plan_limits_profiles
before update of market_visibility_mode
on public.profiles
for each row
execute function public.enforce_plan_limits_profiles();

