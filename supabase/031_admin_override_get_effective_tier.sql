-- Admin override for internal account(s)
--
-- Some internal users (e.g. @cardcat) need higher caps regardless of Stripe entitlement sync.
-- This prevents plan-limit enforcement from blocking basic actions when entitlements are missing.

create or replace function public.get_effective_tier(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tier text;
  v_is_admin boolean;
begin
  -- Internal admin override by username.
  select exists(
    select 1
    from public.profiles p
    where p.id = p_user_id
      and lower(p.username) = 'cardcat'
  ) into v_is_admin;

  if v_is_admin then
    return 'seller';
  end if;

  -- Only treat these as “real” entitlements.
  select ue.tier
  into v_tier
  from public.user_entitlements ue
  where ue.user_id = p_user_id
    and ue.status in ('active','trialing','grandfathered');

  -- If no active entitlement exists yet, default to Collector caps.
  return coalesce(v_tier, 'collector');
end;
$$;
