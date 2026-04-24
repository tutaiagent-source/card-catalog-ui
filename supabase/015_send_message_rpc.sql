-- Robust message sending helper
-- Ensures sender_user_id is always set from auth.uid(),
-- and makes sure the caller is an unblocked participant.

create or replace function public.send_message(
  p_conversation_id uuid,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_sender uuid := auth.uid();
  v_context_card_id uuid;
  v_cardless_allowed boolean;
  v_other_user uuid;
begin
  if v_sender is null then
    raise exception 'Not authenticated';
  end if;

  if p_body is null or char_length(trim(p_body)) = 0 then
    raise exception 'Message body is empty';
  end if;

  select c.context_card_id, c.cardless_allowed
    into v_context_card_id, v_cardless_allowed
  from public.conversations c
  where c.id = p_conversation_id
  limit 1;

  if v_context_card_id is null and coalesce(v_cardless_allowed, false) = false then
    raise exception 'Messaging not allowed for this conversation';
  end if;

  select cp.user_id
    into v_other_user
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.user_id <> v_sender
  limit 1;

  if v_other_user is null then
    raise exception 'Conversation has no other participant';
  end if;

  -- If sender participant row is missing (e.g., inbox cleanup), recreate it.
  -- If sender is blocked, fail.
  if exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_sender
      and coalesce(cp.is_blocked, false) = true
  ) then
    raise exception 'You are blocked in this conversation';
  end if;

  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_sender
      and coalesce(cp.is_blocked, false) = false
  ) then
    insert into public.conversation_participants (
      conversation_id,
      user_id,
      is_muted,
      is_blocked,
      joined_at
    ) values (
      p_conversation_id,
      v_sender,
      false,
      false,
      now()
    ) on conflict do nothing;
  end if;

  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_sender
      and coalesce(cp.is_blocked, false) = false
  ) then
    raise exception 'Not allowed to send message in this conversation';
  end if;

  insert into public.messages (conversation_id, sender_user_id, body)
  values (p_conversation_id, v_sender, trim(p_body));
end;
$$;

grant execute on function public.send_message(uuid, text) to authenticated;
