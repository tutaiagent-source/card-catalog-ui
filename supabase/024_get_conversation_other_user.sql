-- Utility: get the other participant user_id in a 2-party direct conversation.
-- RLS for conversation_participants only exposes rows for auth.uid(),
-- so this function is SECURITY DEFINER to safely return the other user.

create or replace function public.get_conversation_other_user(
  p_conversation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_other uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Ensure caller is a participant
  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  ) then
    raise exception 'Not a participant';
  end if;

  select cp.user_id
  into v_other
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.user_id <> auth.uid()
  limit 1;

  return v_other;
end;
$$;

grant execute on function public.get_conversation_other_user(uuid) to authenticated;
