-- Friends + Friends Requests
-- Enables messaging without card-context only after friendship acceptance.
-- Also adds message delete/restore RPCs for soft-deleted inbox views.

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,

  constraint friend_requests_not_self check (from_user_id <> to_user_id)
);

create index if not exists friend_requests_to_user_idx on public.friend_requests(to_user_id, created_at desc);
create index if not exists friend_requests_from_user_idx on public.friend_requests(from_user_id, created_at desc);

-- One pending request per pair (direction)
create unique index if not exists friend_requests_pending_unique
  on public.friend_requests(from_user_id, to_user_id)
  where status = 'pending';

create table if not exists public.friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint friends_not_self check (user_id <> friend_user_id),
  primary key (user_id, friend_user_id)
);

alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;

-- Let users view requests they are involved in
drop policy if exists "friend_requests_select_own" on public.friend_requests;
create policy "friend_requests_select_own"
  on public.friend_requests
  for select
  using (
    from_user_id = auth.uid() or to_user_id = auth.uid()
  );

-- Friends: only show rows where user_id = auth.uid
drop policy if exists "friends_select_own" on public.friends;
create policy "friends_select_own"
  on public.friends
  for select
  using (user_id = auth.uid());

-- ==========================
-- RPC: send friend request
-- Only allowed after an existing direct conversation was initiated from a listing
-- (i.e., conversation.context_card_id IS NOT NULL).
-- ==========================

create or replace function public.send_friend_request(
  p_target_username text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
  v_request_id uuid;
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
    raise exception 'Cannot send a friend request to yourself';
  end if;

  -- Already friends?
  if exists (
    select 1 from public.friends f
    where f.user_id = v_caller and f.friend_user_id = v_target
  ) then
    raise exception 'Already friends';
  end if;

  -- Must have an initiated listing conversation
  if not exists (
    select 1
    from public.conversations c
    join public.conversation_participants me
      on me.conversation_id = c.id
     and me.user_id = v_caller
    join public.conversation_participants them
      on them.conversation_id = c.id
     and them.user_id = v_target
    where c.conversation_type = 'direct'
      and c.context_card_id is not null
  ) then
    raise exception 'Friend request requires a listing-initiated conversation first';
  end if;

  insert into public.friend_requests(from_user_id, to_user_id)
  values (v_caller, v_target)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.send_friend_request(text) to authenticated;

-- ==========================
-- RPC: respond to friend request
-- Only recipient can accept/decline.
-- On accept, creates mutual friend rows.
-- ==========================

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
  else
    update public.friend_requests
    set status = 'declined', decided_at = now()
    where id = p_request_id;
  end if;

end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

-- ==========================
-- Messaging enforcement updates
-- Direct messaging without context_card_id requires an accepted friendship.
-- ==========================

-- Re-write start_direct_conversation to allow p_context_card_id NULL iff caller and target are friends.
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

  -- If no context card is provided, require friendship
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
  order by c.last_message_at desc
  limit 1;

  -- If a conversation already exists but was created without listing context,
  -- upgrade it to the listing context so listing-based messaging works.
  if v_conversation_id is not null and p_context_card_id is not null then
    update public.conversations
    set context_card_id = p_context_card_id
    where id = v_conversation_id
      and (context_card_id is null or context_card_id <> p_context_card_id);
  end if;

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

grant execute on function public.start_direct_conversation(text, text, uuid) to authenticated;

-- Replace message insert policy so context-less conversations are allowed only if sender has friendship with the other participant.
drop policy if exists "messages_insert_as_participant" on public.messages;
create policy "messages_insert_as_participant"
  on public.messages
  for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
        and coalesce(cp.is_blocked, false) = false
    )
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.context_card_id is not null
          or exists (
            select 1
            from public.conversation_participants cp_other
            where cp_other.conversation_id = messages.conversation_id
              and cp_other.user_id <> auth.uid()
              and exists (
                select 1
                from public.friends f
                where f.user_id = auth.uid()
                  and f.friend_user_id = cp_other.user_id
              )
          )
        )
    )
  );

-- ==========================
-- RPC: soft delete / restore
-- ==========================

create or replace function public.delete_message(
  p_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_message_conversation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select m.conversation_id
    into v_message_conversation_id
  from public.messages m
  where m.id = p_message_id
  limit 1;

  if v_message_conversation_id is null then
    raise exception 'Message not found';
  end if;

  -- Allow any conversation participant to soft-delete messages for inbox cleanup.
  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = v_message_conversation_id
      and cp.user_id = auth.uid()
      and coalesce(cp.is_blocked, false) = false
  ) then
    raise exception 'Not allowed to delete messages from this conversation';
  end if;

  update public.messages
  set deleted_at = now()
  where id = p_message_id;
end;
$$;

grant execute on function public.delete_message(uuid) to authenticated;


create or replace function public.restore_message(
  p_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_message_conversation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select m.conversation_id
    into v_message_conversation_id
  from public.messages m
  where m.id = p_message_id
  limit 1;

  if v_message_conversation_id is null then
    raise exception 'Message not found';
  end if;

  -- Allow any conversation participant to restore for inbox cleanup.
  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = v_message_conversation_id
      and cp.user_id = auth.uid()
      and coalesce(cp.is_blocked, false) = false
  ) then
    raise exception 'Not allowed to restore messages from this conversation';
  end if;

  update public.messages
  set deleted_at = null
  where id = p_message_id;
end;
$$;

grant execute on function public.restore_message(uuid) to authenticated;

-- ==========================
-- RPC: delete a conversation for the current user (used for empty/unclean inbox threads)
-- ==========================

create or replace function public.delete_conversation_for_user(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.conversation_participants
  where conversation_id = p_conversation_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.delete_conversation_for_user(uuid) to authenticated;

