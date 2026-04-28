-- Launch hotfix: Starter (Collector) capped at 100 catalog cards; Pro catalog is unlimited.

create or replace function public.plan_catalog_cap(p_tier text)
returns bigint
language sql
as $$
  select case
    when p_tier = 'collector' then 100
    when p_tier = 'pro' then null
    when p_tier = 'seller' then null
    else null
  end::bigint;
$$;
