-- Bundle offer acceptance (seller/buyer recipient only) for MVP
-- Ensures: deal_type=bundle_sale, caller is the offer recipient (deal_offers.to_user_id)
-- Validates: all bundle cards are still active (cards.status='Listed' and owned by deal_records.seller_user_id)

create or replace function public.accept_bundle_deal_offer(
  p_offer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_now timestamptz := now();
  v_offer public.deal_offers%rowtype;
  v_deal public.deal_records%rowtype;
  v_seller_user_id uuid;
  rec record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock offer + deal rows to serialize acceptance
  select * into v_offer
  from public.deal_offers
  where id = p_offer_id
  for update;

  if v_offer.id is null then
    raise exception 'Offer not found';
  end if;

  -- Only the recipient of the offer can accept
  if v_offer.to_user_id is null or v_offer.to_user_id <> auth.uid() then
    raise exception 'Only the offer recipient can accept';
  end if;

  select * into v_deal
  from public.deal_records
  where id = v_offer.deal_record_id
  for update;

  if v_deal.id is null then
    raise exception 'Deal record not found';
  end if;

  if lower(coalesce(v_deal.deal_type,'')) <> 'bundle_sale' then
    raise exception 'Not a bundle deal';
  end if;

  if v_deal.seller_user_id is null then
    raise exception 'Bundle deal missing seller_user_id';
  end if;

  v_seller_user_id := v_deal.seller_user_id;

  -- Validate all cards are still available
  if not exists (
    select 1
    from public.bundle_deal_items b
    where b.deal_record_id = v_deal.id
  ) then
    raise exception 'Bundle items missing';
  end if;

  for rec in
    select b.card_id
    from public.bundle_deal_items b
    where b.deal_record_id = v_deal.id
  loop
    if not exists (
      select 1
      from public.cards c
      where c.id = rec.card_id
        and lower(coalesce(c.status,'')) = 'listed'
        and c.user_id = v_seller_user_id
    ) then
      raise exception 'One or more cards in this bundle are no longer available.';
    end if;
  end loop;

  -- Mark offer accepted
  update public.deal_offers
  set status = 'accepted',
      responded_at = v_now
  where id = p_offer_id;

  -- Mark deal accepted
  update public.deal_records
  set status = 'offer_accepted',
      agreed_price = v_offer.offer_amount,
      accepted_at = v_now
  where id = v_deal.id;

  return;
end;
$$;

grant execute on function public.accept_bundle_deal_offer(uuid) to authenticated;
