-- Idempotent messaging: prevent duplicate inserts when clients retry sends.

alter table public.messages
  add column if not exists client_request_id uuid;

-- Postgres allows multiple NULLs in a UNIQUE index, which is what we want.
create unique index if not exists messages_conversation_client_request_id_unique
  on public.messages (conversation_id, client_request_id);

-- Robust message sending helper (idempotent)
-- Keeps sender_user_id server-side from auth.uid().
create or replace function public.send_message(
  p_conversation_id uuid,
  p_body text,
  p_client_request_id uuid default null
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

  -- If sender participant row exists and sender is blocked, fail.
  if exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_sender
      and coalesce(cp.is_blocked, false) = true
  ) then
    raise exception 'You are blocked in this conversation';
  end if;

  -- If sender participant row is missing (e.g., inbox cleanup), recreate it.
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

  -- Idempotent insert when client_request_id is provided.
  if p_client_request_id is not null then
    insert into public.messages (conversation_id, sender_user_id, body, client_request_id)
    values (p_conversation_id, v_sender, trim(p_body), p_client_request_id)
    on conflict (conversation_id, client_request_id) do nothing;
  else
    insert into public.messages (conversation_id, sender_user_id, body)
    values (p_conversation_id, v_sender, trim(p_body));
  end if;
end;
$$;

revoke all on function public.send_message(uuid, text, uuid) from public;

grant execute on function public.send_message(uuid, text, uuid) to authenticated;
