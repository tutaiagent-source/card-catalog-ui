-- Draft messaging schema for CardCat.
-- Covers: public usernames, direct conversations, messages, and minimal RLS.
-- Recommended usage: create conversations through the start_direct_conversation RPC.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  allow_messages boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_username_lowercase check (username = lower(username))
);

create index if not exists profiles_username_idx on public.profiles (username);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null default 'direct',
  created_by uuid not null references auth.users(id) on delete cascade,
  context_card_id uuid references public.cards(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),

  constraint conversations_type_check check (conversation_type in ('direct'))
);

create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);
create index if not exists conversations_context_card_idx on public.conversations (context_card_id);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_muted boolean not null default false,
  is_blocked boolean not null default false,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx on public.conversation_participants (user_id, joined_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,

  constraint messages_body_not_blank check (char_length(trim(body)) > 0),
  constraint messages_body_max_len check (char_length(body) <= 5000)
);

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at asc);
create index if not exists messages_sender_idx on public.messages (sender_user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists messages_touch_conversation_last_message on public.messages;
create trigger messages_touch_conversation_last_message
after insert on public.messages
for each row execute function public.touch_conversation_last_message();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Profiles
create policy "profiles_select_public"
  on public.profiles
  for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Conversations
create policy "conversations_select_participant"
  on public.conversations
  for select
  using (
    exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

-- Direct inserts are intentionally not exposed broadly.
-- Preferred path: use public.start_direct_conversation(...)

-- Conversation participants
create policy "conversation_participants_select_own"
  on public.conversation_participants
  for select
  using (user_id = auth.uid());

create policy "conversation_participants_update_own"
  on public.conversation_participants
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Messages
create policy "messages_select_for_participant"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

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
  );

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
