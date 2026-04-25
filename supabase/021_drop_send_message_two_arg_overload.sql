-- Supabase RPC overload ambiguity fix:
-- Supabase-js can't reliably pick between send_message(uuid,text) and
-- send_message(uuid,text,uuid) when the 3-arg version has a default.
-- We keep only the 3-arg version (with default p_client_request_id).

drop function if exists public.send_message(uuid, text);
