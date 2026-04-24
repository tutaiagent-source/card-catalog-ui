-- Restore access to a direct conversation after inbox cleanup removed the caller's
-- conversation_participants row. This keeps friend messaging and old thread links usable.

create or replace function public.restore_conversation_access(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_caller uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_other_user uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_conversation
  from public.conversations c
  where c.id = p_conversation_id
  limit 1;

  if v_conversation.id is null then
    raise exception 'Conversation not found';
  end if;

  if v_conversation.conversation_type <> 'direct' then
    raise exception 'Only direct conversations can be restored';
  end if;

  if exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_caller
      and coalesce(cp.is_blocked, false) = false
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_caller
      and coalesce(cp.is_blocked, false) = true
  ) then
    raise exception 'You are blocked in this conversation';
  end if;

  select cp.user_id
    into v_other_user
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.user_id <> v_caller
  order by cp.joined_at asc
  limit 1;

  if v_other_user is null then
    raise exception 'Conversation has no other participant';
  end if;

  if v_conversation.context_card_id is null then
    if coalesce(v_conversation.cardless_allowed, false) = false then
      raise exception 'Conversation access cannot be restored';
    end if;

    if not exists (
      select 1
      from public.friends f
      where f.user_id = v_caller
        and f.friend_user_id = v_other_user
    ) then
      raise exception 'Only accepted friends can restore this conversation';
    end if;
  else
    -- Listing-context conversations can only be restored for users who clearly
    -- have historical participation (creator or previous sender).
    if v_conversation.created_by <> v_caller
       and not exists (
         select 1
         from public.messages m
         where m.conversation_id = p_conversation_id
           and m.sender_user_id = v_caller
       ) then
      raise exception 'Conversation access cannot be restored';
    end if;
  end if;

  insert into public.conversation_participants (
    conversation_id,
    user_id,
    joined_at,
    is_muted,
    is_blocked
  ) values (
    p_conversation_id,
    v_caller,
    now(),
    false,
    false
  )
  on conflict (conversation_id, user_id) do update
  set is_blocked = false;
end;
$$;

grant execute on function public.restore_conversation_access(uuid) to authenticated;
