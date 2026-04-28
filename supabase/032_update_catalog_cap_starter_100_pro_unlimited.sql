-- Starter (Collector) capped at 250 catalog cards; Pro capped at 1,000; Seller capped at 10,000.

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
