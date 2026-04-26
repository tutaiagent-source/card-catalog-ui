-- Patch: scope direct conversation reuse to the specific context card.
-- Previously, conversations were reused for the same participants as long as context_card_id was NOT NULL,
-- which could cause Deal Records to appear in the wrong thread.

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

  -- Messaging must be initiated from a card listing
  if p_context_card_id is null then
    raise exception 'Card listing initiation required';
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
    and c.context_card_id is not null
    -- IMPORTANT: scope reuse to the exact card context
    and c.context_card_id = p_context_card_id
  order by c.last_message_at desc
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (conversation_type, created_by, context_card_id)
    values ('direct', v_caller, p_context_card_id)
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

-- Re-apply execute grant (safe if unchanged)
grant execute on function public.start_direct_conversation(text, text, uuid) to authenticated;
