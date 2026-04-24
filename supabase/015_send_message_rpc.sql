-- Robust message sending helper
-- Ensures sender_user_id is always set from auth.uid() (prevents any client-side mismatch)

create or replace function public.send_message(
  p_conversation_id uuid,
  p_body text
)
returns void
language plpgsql
security invoker
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_body is null or char_length(trim(p_body)) = 0 then
    raise exception 'Message body is empty';
  end if;

  insert into public.messages (conversation_id, sender_user_id, body)
  values (p_conversation_id, auth.uid(), trim(p_body));
end;
$$;

grant execute on function public.send_message(uuid, text) to authenticated;
