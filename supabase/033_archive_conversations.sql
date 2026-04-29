-- Per-user archive support for messaging
-- Adds conversation_participants.archived_at, which drives the Messaging page's Archived folder.

alter table public.conversation_participants
  add column if not exists archived_at timestamptz;

create index if not exists conversation_participants_user_archived_idx
  on public.conversation_participants (user_id, archived_at desc nulls last, joined_at desc);
