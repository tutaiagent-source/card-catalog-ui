-- Public profiles view
-- Ensures shop address/phone/website are only exposed when:
-- - shop_verification_status = 'verified'
-- - and the corresponding shop_show_* toggle is enabled

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
  p.shop_name,

  p.shop_show_address,
  p.shop_show_phone,
  p.shop_show_website,

  p.shop_verification_status,

  case
    when p.shop_verification_status = 'verified' and p.shop_show_address then p.shop_address
    else null
  end as shop_address,

  case
    when p.shop_verification_status = 'verified' and p.shop_show_phone then p.shop_phone
    else null
  end as shop_phone,

  case
    when p.shop_verification_status = 'verified' and p.shop_show_website then p.shop_website
    else null
  end as shop_website
from public.profiles p;
