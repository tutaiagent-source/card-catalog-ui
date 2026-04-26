-- Post-payment lifecycle: when seller confirms payment received for a deal,
-- mark the related card as Sold (which removes it from public marketplace listings),
-- update deal_records status to payment_confirmed, and cancel other pending offers on the same card.

create or replace function public.confirm_deal_payment_and_mark_sold(
  p_deal_record_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_now timestamptz := now();
  v_deal public.deal_records%rowtype;
  v_card_status text;
  v_card_user uuid;
  v_rowcount int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_deal
  from public.deal_records
  where id = p_deal_record_id;

  if v_deal.id is null then
    raise exception 'Deal record not found';
  end if;

  -- Must be the seller who confirms.
  if v_deal.seller_user_id is null or v_deal.seller_user_id <> auth.uid() then
    raise exception 'Only the seller can confirm payment received';
  end if;

  if v_deal.card_id is null then
    raise exception 'Deal record is missing card_id';
  end if;

  -- Ensure payment details exist.
  if not exists (
    select 1
    from public.deal_details d
    where d.deal_record_id = v_deal.id
      and d.paid_date is not null
  ) then
    raise exception 'Payment details not recorded yet (paid_date missing)';
  end if;

  -- Ensure the card is still a live listing (concurrency protection).
  select status, user_id
  into v_card_status, v_card_user
  from public.cards
  where id = v_deal.card_id
  limit 1;

  if v_card_status is null then
    raise exception 'Card not found';
  end if;

  if v_card_user is null or v_card_user <> auth.uid() then
    raise exception 'Seller does not own this card listing';
  end if;

  if lower(v_card_status) <> 'listed' then
    raise exception 'This listing has already been marked sold';
  end if;

  -- 1) Update deal_records status.
  update public.deal_records
  set status = 'payment_confirmed'
  where id = v_deal.id;

  -- 2) Mark the card as Sold.
  update public.cards
  set status = 'Sold',
      sold_price = v_deal.agreed_price,
      sold_at = v_now,
      sale_platform = 'CardCat'
  where id = v_deal.card_id
    and user_id = v_deal.seller_user_id
    and status = 'Listed';

  get diagnostics v_rowcount = row_count;
  if v_rowcount = 0 then
    raise exception 'Card is no longer in a Listed state (already sold)';
  end if;

  -- 3) Cancel other pending offers and mark other deal records on the same card as declined.
  --    This prevents multiple concurrent deals from lingering in the UI.
  update public.deal_offers
  set status = 'declined',
      responded_at = v_now
  where status = 'pending'
    and deal_record_id in (
      select dr.id
      from public.deal_records dr
      where dr.card_id = v_deal.card_id
        and dr.id <> v_deal.id
    );

  update public.deal_records
  set status = 'offer_declined'
  where card_id = v_deal.card_id
    and id <> v_deal.id
    and status in ('draft', 'offer_pending', 'offer_accepted', 'payment_recorded', 'offer_declined');

  return;
end;
$$;

grant execute on function public.confirm_deal_payment_and_mark_sold(uuid) to authenticated;
