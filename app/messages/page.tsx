"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardCatLogo from "@/components/CardCatLogo";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import UsernamePromptBanner from "@/components/UsernamePromptBanner";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { ConversationParticipantRow, ConversationRow, markConversationRead, MessageRow, sendMessage } from "@/lib/messaging";
import { UserProfileRecord } from "@/lib/useUserProfile";

type CardContext = {
  id?: string;
  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;
  card_number: string;
  asking_price?: number | null;
  image_url?: string | null;
};

function formatTimestamp(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function MessagesPage() {
  const { user, loading } = useSupabaseUser();
  const needsEmailVerification = !!user && !(user as any)?.email_confirmed_at;
  const [conversationParam, setConversationParam] = useState("");
  const [prefillParam, setPrefillParam] = useState("");
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setConversationParam(String(params.get("conversation") || "").trim());
    setPrefillParam(String(params.get("prefill") || "").trim());
  }, []);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipantRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfileRecord[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [activeConversationCard, setActiveConversationCard] = useState<CardContext | null>(null);

  const loadInbox = useCallback(async () => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    setLoadingInbox(true);
    setError("");

    const { data: myParticipantRows, error: myParticipantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, joined_at, last_read_at, is_muted, is_blocked")
      .eq("user_id", user.id);

    if (myParticipantError) {
      setLoadingInbox(false);
      setError(myParticipantError.message);
      return;
    }

    const conversationIds = Array.from(new Set((myParticipantRows ?? []).map((row: any) => String(row.conversation_id || "")).filter(Boolean)));

    if (conversationIds.length === 0) {
      setConversations([]);
      setParticipants((myParticipantRows ?? []) as ConversationParticipantRow[]);
      setProfiles([]);
      setMessages([]);
      setActiveConversationId(null);
      setLoadingInbox(false);
      return;
    }

    const { data: conversationRows, error: conversationError } = await supabase
      .from("conversations")
      .select("id, conversation_type, created_by, context_card_id, created_at, last_message_at")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false });

    if (conversationError) {
      setLoadingInbox(false);
      setError(conversationError.message);
      return;
    }

    const { data: participantRows, error: participantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, joined_at, last_read_at, is_muted, is_blocked")
      .in("conversation_id", conversationIds);

    if (participantError) {
      setLoadingInbox(false);
      setError(participantError.message);
      return;
    }

    const otherUserIds = Array.from(
      new Set(
        ((participantRows ?? []) as any[])
          .map((row) => String(row.user_id || ""))
          .filter((id) => id && id !== user.id)
      )
    );

    let profileRows: UserProfileRecord[] = [];
    const profileIds = Array.from(new Set([...otherUserIds, user.id]));
    if (profileIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, allow_messages")
        .in("id", profileIds);

      if (profileError) {
        setLoadingInbox(false);
        setError(profileError.message);
        return;
      }

      profileRows = (profileData ?? []) as UserProfileRecord[];
    }

    const { data: messageRows, error: messageError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_user_id, body, created_at, edited_at, deleted_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (messageError) {
      setLoadingInbox(false);
      setError(messageError.message);
      return;
    }

    const nextConversations = (conversationRows ?? []) as ConversationRow[];
    setConversations(nextConversations);
    setParticipants((participantRows ?? []) as ConversationParticipantRow[]);
    setProfiles(profileRows);
    setMessages((messageRows ?? []) as MessageRow[]);
    setActiveConversationId((prev) => {
      if (conversationParam && conversationIds.includes(conversationParam)) return conversationParam;
      if (prev && conversationIds.includes(prev)) return prev;
      return nextConversations[0]?.id ?? conversationIds[0] ?? null;
    });
    setLoadingInbox(false);
  }, [user?.id, conversationParam]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!activeConversationId || !user?.id) return;

    markConversationRead(activeConversationId)
      .then(() => {
        setParticipants((prev) =>
          prev.map((row) =>
            row.conversation_id === activeConversationId && row.user_id === user.id
              ? { ...row, last_read_at: new Date().toISOString() }
              : row
          )
        );
      })
      .catch(() => {
        // quiet for shell v1
      });
  }, [activeConversationId, user?.id]);

  useEffect(() => {
    if (!prefillParam || !activeConversationId || prefillAppliedRef.current) return;
    if (conversationParam && conversationParam !== activeConversationId) return;
    setDraftMessage(prefillParam);
    prefillAppliedRef.current = true;
  }, [prefillParam, activeConversationId, conversationParam]);

  const conversationViews = useMemo(() => {
    return conversations.map((conversation) => {
      const convoParticipants = participants.filter((row) => row.conversation_id === conversation.id);
      const myParticipant = convoParticipants.find((row) => row.user_id === user?.id);
      const otherParticipant = convoParticipants.find((row) => row.user_id !== user?.id);
      const otherProfile = profiles.find((profile) => profile.id === otherParticipant?.user_id);
      const latestMessage = messages.filter((message) => message.conversation_id === conversation.id).slice(-1)[0] ?? null;
      const unread = Boolean(
        myParticipant && conversation.last_message_at && (!myParticipant.last_read_at || new Date(conversation.last_message_at).getTime() > new Date(myParticipant.last_read_at).getTime())
      );

      return {
        conversation,
        latestMessage,
        myParticipant,
        otherProfile,
        unread,
        title: otherProfile?.username ? `@${otherProfile.username}` : "Conversation",
      };
    });
  }, [conversations, participants, profiles, messages, user?.id]);

  const activeConversation = conversationViews.find((row) => row.conversation.id === activeConversationId) ?? null;

  const activeConversationContextCardId = activeConversation?.conversation.context_card_id ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!activeConversationContextCardId || !supabaseConfigured || !supabase || !user?.id) {
      setActiveConversationCard(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("id, player_name, year, brand, set_name, parallel, card_number, asking_price, image_url")
        .eq("id", activeConversationContextCardId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Failed to load conversation card context:", error);
        setActiveConversationCard(null);
        return;
      }

      setActiveConversationCard((data ?? null) as any);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConversationContextCardId, user?.id]);
  const activeMessages = useMemo(
    () => messages.filter((message) => message.conversation_id === activeConversationId),
    [messages, activeConversationId]
  );

  async function onSendMessage() {
    if (!activeConversationId || !user?.id) return;
    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    setSending(true);
    setError("");

    try {
      await sendMessage(activeConversationId, user.id, trimmed);
      setDraftMessage("");
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 text-slate-300">Loading messages...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign In Required</h1>
          <p className="mt-3 text-slate-300">Please sign in to view your messages.</p>
          <a href="/login" className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <EmailVerificationNotice needsVerification={needsEmailVerification} email={(user as any)?.email} />
        <UsernamePromptBanner userId={user?.id} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardCatLogo />
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Messages</h1>
            <div className="mt-2 text-sm text-slate-400">A simple inbox shell for member-to-member card conversations.</div>
          </div>
          <div className="flex gap-3">
            <a href="/catalog" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">Catalog</a>
            <a href="/market" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">Market</a>
            <a href="/account" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">Account</a>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Inbox</div>
              <button
                type="button"
                onClick={() => loadInbox()}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                disabled={loadingInbox}
              >
                {loadingInbox ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {conversationViews.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                No conversations yet. Once members can message sellers from listings, threads will show up here.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {conversationViews.map((row) => (
                  <button
                    key={row.conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(row.conversation.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${row.conversation.id === activeConversationId ? "border-amber-500/30 bg-amber-500/[0.08]" : "border-white/10 bg-slate-950/40 hover:bg-slate-950/70"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{row.title}</span>
                          {row.unread ? <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Unread</span> : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{formatTimestamp(row.conversation.last_message_at)}</div>
                      </div>
                    </div>
                    <div className="mt-3 line-clamp-2 text-sm text-slate-300">
                      {row.latestMessage?.body || "No messages yet."}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            {activeConversation ? (
              <>
                <div className="border-b border-white/10 pb-4">
                  <div className="text-lg font-semibold text-white">{activeConversation.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    <span>Direct conversation</span>
                    {activeConversationContextCardId && activeConversationCard ? (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-200">
                        About {activeConversationCard.year} {activeConversationCard.player_name}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {activeMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                      No messages yet. This thread is ready for the first message.
                    </div>
                  ) : (
                    activeMessages.map((message) => {
                      const mine = message.sender_user_id === user.id;
                      const senderProfile = profiles.find((p) => p.id === message.sender_user_id) ?? null;
                      const senderLabel = mine
                        ? "You"
                        : senderProfile?.username
                          ? `@${senderProfile.username}`
                          : senderProfile?.display_name
                            ? senderProfile.display_name
                            : "User";
                      return (
                        <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mine ? "bg-emerald-500/15 text-emerald-50" : "bg-slate-900 text-slate-100"}`}>
                            <div className={`mb-1 text-xs font-semibold ${mine ? "text-emerald-100" : "text-slate-300"}`}>{senderLabel}</div>
                            <div>{message.body}</div>
                            <div className="mt-2 text-[11px] text-slate-400">{formatTimestamp(message.created_at)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <textarea
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      placeholder="Write a message..."
                      className="min-h-[100px] w-full resize-none bg-transparent text-sm text-white outline-none"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">Card-centered inbox v1</div>
                      <button
                        type="button"
                        onClick={onSendMessage}
                        disabled={sending || !draftMessage.trim()}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                      >
                        {sending ? "Sending…" : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-400">
                Pick a conversation on the left when one exists. This page is now ready to become the live inbox.
              </div>
            )}
          </section>
        </div>
      </div>

      <CardCatMobileNav />
    </main>
  );
}
