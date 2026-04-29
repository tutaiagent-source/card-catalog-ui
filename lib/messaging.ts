import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

export type ConversationRow = {
  id: string;
  conversation_type: "direct" | string;
  created_by: string;
  context_card_id?: string | null;
  created_at: string;
  last_message_at: string;
};

export type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string | null;
  is_muted?: boolean;
  is_blocked?: boolean;
  archived_at?: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
};

export async function startDirectConversation(targetUsername: string, initialMessage?: string, contextCardId?: string | null) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.rpc("start_direct_conversation", {
    p_target_username: targetUsername,
    p_initial_message: initialMessage ?? null,
    p_context_card_id: contextCardId ?? null,
  });

  if (error) throw error;
  return data as string;
}

export async function markConversationRead(conversationId: string) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
}

export async function sendMessage(
  conversationId: string,
  senderUserId: string,
  body: string,
  clientRequestId?: string
) {
  // senderUserId is intentionally ignored; we set sender_user_id server-side from auth.uid().
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  const trimmed = String(body || "").trim();
  if (!trimmed) throw new Error("Message body is empty.");

  const { error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_body: trimmed,
    p_client_request_id: clientRequestId ?? null,
  });

  if (error) {
    // If migrations haven't applied yet, fall back to the old direct insert.
    const msg = String(error.message || "").toLowerCase();
    const shouldFallbackBase =
      msg.includes("could not find function") ||
      (msg.includes("function") && msg.includes("does not exist")) ||
      (msg.includes("send_message") && (msg.includes("missing") || msg.includes("not exist")));

    // Only allow this fallback in non-production environments.
    const isNonProd = process.env.NODE_ENV !== "production";
    const shouldFallback = isNonProd && shouldFallbackBase;

    if (!shouldFallback) throw error;

    // Try idempotent insert first, but remain compatible until the migration is applied.
    let { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_user_id: senderUserId,
      body: trimmed,
      client_request_id: clientRequestId ?? null,
    });

    if (insertError) {
      const m = String(insertError.message || insertError).toLowerCase();
      const columnMissing = m.includes("client_request_id") && (m.includes("does not exist") || m.includes("unknown column") || m.includes("column"));

      if (columnMissing) {
        const { error: insertError2 } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_user_id: senderUserId,
          body: trimmed,
        });
        if (insertError2) throw insertError2;
        return;
      }

      throw insertError;
    }
  }
}
