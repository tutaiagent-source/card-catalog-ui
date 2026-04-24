-- Keep listing-initiated conversations separate per card context.
-- Messaging the same user about different cards should create different threads.
-- Cardless friend messaging should continue to reuse a single cardless thread.

create or replace function public.start_direct_conversation(
  p_target_username text,
  p_initial_message text default null,
  p_context_card_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
  v_conversation_id uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select p.id
  into v_target
  from public.profiles p
  where p.username = lower(trim(p_target_username))
    and p.allow_messages = true
  limit 1;

  if v_target is null then
    raise exception 'Target user not found or messaging disabled';
  end if;

  if v_target = v_caller then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  if p_context_card_id is null then
    if not exists (
      select 1 from public.friends f
      where f.user_id = v_caller and f.friend_user_id = v_target
    ) then
      raise exception 'Card listing initiation required (or accept a friend request to message without a listing)';
    end if;
  end if;

  select c.id
  into v_conversation_id
  from public.conversations c
  join public.conversation_participants me
    on me.conversation_id = c.id
   and me.user_id = v_caller
  join public.conversation_participants them
    on them.conversation_id = c.id
   and them.user_id = v_target
  where c.conversation_type = 'direct'
    and (
      (p_context_card_id is null and c.context_card_id is null)
      or (p_context_card_id is not null and c.context_card_id = p_context_card_id)
    )
  order by c.last_message_at desc
  limit 1;

  if v_conversation_id is not null and p_context_card_id is null then
    update public.conversations
    set cardless_allowed = true
    where id = v_conversation_id;
  end if;

  if v_conversation_id is null then
    insert into public.conversations (conversation_type, created_by, context_card_id, cardless_allowed)
    values ('direct', v_caller, p_context_card_id, p_context_card_id is null)
    returning id into v_conversation_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values
      (v_conversation_id, v_caller),
      (v_conversation_id, v_target);
  end if;

  if p_initial_message is not null and char_length(trim(p_initial_message)) > 0 then
    insert into public.messages (conversation_id, sender_user_id, body)
    values (v_conversation_id, v_caller, trim(p_initial_message));
  end if;

  return v_conversation_id;
end;
$$;

grant execute on function public.start_direct_conversation(text, text, uuid) to authenticated;
