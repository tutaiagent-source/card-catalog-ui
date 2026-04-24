-- When a friend request is accepted, enable cardless messaging
-- for any existing direct conversations between the two users that have
-- no listing context (context_card_id is NULL).

alter table public.conversations
  add column if not exists cardless_allowed boolean not null default false;

create or replace function public.respond_friend_request(
  p_request_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller uuid := auth.uid();
  v_from uuid;
  v_to uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select fr.from_user_id, fr.to_user_id
    into v_from, v_to
  from public.friend_requests fr
  where fr.id = p_request_id
    and fr.status = 'pending'
  limit 1;

  if v_from is null or v_to is null then
    raise exception 'Pending friend request not found';
  end if;

  if v_to <> v_caller then
    raise exception 'Only the recipient can respond to this request';
  end if;

  if p_accept then
    -- If not already friends, create mutual friendship
    if not exists (
      select 1 from public.friends f
      where f.user_id = v_to and f.friend_user_id = v_from
    ) then
      insert into public.friends(user_id, friend_user_id)
      values
        (v_to, v_from),
        (v_from, v_to)
      on conflict do nothing;
    end if;

    update public.friend_requests
    set status = 'accepted', decided_at = now()
    where id = p_request_id;

    -- Enable cardless messaging for any existing direct conversations
    -- between these two users that were created without listing context.
    update public.conversations c
    set cardless_allowed = true
    where c.conversation_type = 'direct'
      and c.context_card_id is null
      and c.cardless_allowed = false
      and exists (
        select 1
        from public.conversation_participants cp
        where cp.conversation_id = c.id
          and cp.user_id = v_from
          and coalesce(cp.is_blocked, false) = false
      )
      and exists (
        select 1
        from public.conversation_participants cp
        where cp.conversation_id = c.id
          and cp.user_id = v_to
          and coalesce(cp.is_blocked, false) = false
      );
  else
    update public.friend_requests
    set status = 'declined', decided_at = now()
    where id = p_request_id;
  end if;

end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
