"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CardCatLogo from "@/components/CardCatLogo";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import UsernamePromptBanner from "@/components/UsernamePromptBanner";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { ConversationParticipantRow, ConversationRow, markConversationRead, MessageRow, sendMessage, startDirectConversation } from "@/lib/messaging";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setConversationParam(String(params.get("conversation") || "").trim());
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
  const [conversationContextCards, setConversationContextCards] = useState<CardContext[]>([]);

  const [messageFolder, setMessageFolder] = useState<"inbox" | "unread" | "read" | "deleted">("inbox");

  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  useEffect(() => {
    setSelectedConversationIds([]);
    setBulkDeleteError("");
  }, [messageFolder]);

  type IncomingFriendRequest = {
    id: string;
    fromProfile: UserProfileRecord;
  };

  type OutgoingFriendRequest = {
    id: string;
    toProfile: UserProfileRecord;
  };

  const [friends, setFriends] = useState<UserProfileRecord[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<IncomingFriendRequest[]>([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<OutgoingFriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [friendActionSaving, setFriendActionSaving] = useState(false);

  const loadFriendsAndRequests = useCallback(async () => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    setFriendsLoading(true);
    setFriendsError("");

    try {
      const [{ data: friendRows, error: friendError }, { data: incomingRows, error: incomingError }, { data: outgoingRows, error: outgoingError }] = await Promise.all([
        supabase
          .from("friends")
          .select("friend_user_id")
          .eq("user_id", user.id),
        supabase
          .from("friend_requests")
          .select("id, from_user_id")
          .eq("to_user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("friend_requests")
          .select("id, to_user_id")
          .eq("from_user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);

      if (friendError) throw friendError;
      if (incomingError) throw incomingError;
      if (outgoingError) throw outgoingError;

      const friendUserIds = Array.from(new Set((friendRows ?? []).map((r: any) => String(r.friend_user_id || "")).filter(Boolean)));
      const incomingFromIds = Array.from(new Set((incomingRows ?? []).map((r: any) => String(r.from_user_id || "")).filter(Boolean)));
      const outgoingToIds = Array.from(new Set((outgoingRows ?? []).map((r: any) => String(r.to_user_id || "")).filter(Boolean)));

      const profileIds = Array.from(new Set([...friendUserIds, ...incomingFromIds, ...outgoingToIds])).filter(Boolean);

      let profileRows: UserProfileRecord[] = [];
      if (profileIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, display_name, allow_messages")
          .in("id", profileIds);
        if (profileError) throw profileError;
        profileRows = (profileData ?? []) as UserProfileRecord[];
      }

      const profileById = new Map<string, UserProfileRecord>(profileRows.map((p) => [String(p.id), p]));

      setFriends(profileRows.filter((p) => friendUserIds.includes(String(p.id))));
      setIncomingFriendRequests(
        (incomingRows ?? [])
          .map((r: any) => {
            const from = profileById.get(String(r.from_user_id));
            if (!from) return null;
            return { id: String(r.id), fromProfile: from };
          })
          .filter(Boolean) as IncomingFriendRequest[]
      );
      setOutgoingFriendRequests(
        (outgoingRows ?? [])
          .map((r: any) => {
            const to = profileById.get(String(r.to_user_id));
            if (!to) return null;
            return { id: String(r.id), toProfile: to };
          })
          .filter(Boolean) as OutgoingFriendRequest[]
      );
    } catch (err: any) {
      setFriendsError(err?.message || "Could not load friends.");
    } finally {
      setFriendsLoading(false);
    }
  }, [user?.id]);

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
      setConversationContextCards([]);
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

    // Fetch minimal card context for listing-initiated threads so the left inbox can show "About <card>".
    let nextConversationContextCards: CardContext[] = [];
    try {
      const contextCardIds = Array.from(
        new Set(
          ((conversationRows ?? []) as any[])
            .map((row: any) => String(row.context_card_id || ""))
            .filter(Boolean)
        )
      );

      if (contextCardIds.length > 0) {
        const { data: contextCardRows, error: contextCardError } = await supabase
          .from("cards")
          .select("id, player_name, year, brand, set_name, parallel, card_number")
          .in("id", contextCardIds);

        if (!contextCardError) {
          nextConversationContextCards = (contextCardRows ?? []) as CardContext[];
        }
      }
    } catch (e) {
      // If RLS blocks some cards, fall back to the non-card title.
      nextConversationContextCards = [];
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

    const senderUserIds = Array.from(
      new Set(
        ((messageRows ?? []) as any[])
          .map((row) => String(row.sender_user_id || ""))
          .filter(Boolean)
      )
    );

    const profileIds = Array.from(new Set([user.id, ...senderUserIds])).filter(Boolean);

    let profileRows: UserProfileRecord[] = [];
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

    const nextConversations = (conversationRows ?? []) as ConversationRow[];
    setConversations(nextConversations);
    setParticipants((participantRows ?? []) as ConversationParticipantRow[]);
    setProfiles(profileRows);
    setMessages((messageRows ?? []) as MessageRow[]);
    setConversationContextCards(nextConversationContextCards);
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
    void loadFriendsAndRequests();
  }, [loadFriendsAndRequests]);

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
    setDraftMessage("");
  }, [activeConversationId]);

  const conversationViews = useMemo(() => {
    return conversations.map((conversation) => {
      const convoParticipants = participants.filter((row) => row.conversation_id === conversation.id);
      const myParticipant = convoParticipants.find((row) => row.user_id === user?.id);

      const convoMessages = messages.filter((m) => m.conversation_id === conversation.id);
      const nonDeletedMessages = convoMessages.filter((m) => !m.deleted_at);
      const deletedMessages = convoMessages.filter((m) => Boolean(m.deleted_at));

      const latestNonDeletedMessage = nonDeletedMessages.length > 0 ? nonDeletedMessages[nonDeletedMessages.length - 1] : null;
      const latestDeletedMessage = deletedMessages.length > 0 ? deletedMessages[deletedMessages.length - 1] : null;

      const otherUserId = (() => {
        if (!user?.id) return null;
        const other = convoMessages.find((m) => m.sender_user_id !== user.id);
        return other?.sender_user_id ?? null;
      })();

      const otherProfile = profiles.find((profile) => profile.id === otherUserId);

      const unread = Boolean(
        myParticipant &&
          latestNonDeletedMessage &&
          (!myParticipant.last_read_at || new Date(latestNonDeletedMessage.created_at).getTime() > new Date(myParticipant.last_read_at).getTime())
      );

      const ctxCard = conversation.context_card_id
        ? conversationContextCards.find((c) => String(c.id) === String(conversation.context_card_id)) ?? null
        : null;

      const title = ctxCard?.year && ctxCard?.player_name
        ? `About ${ctxCard.year} ${ctxCard.player_name}`
        : otherProfile?.username
          ? `@${otherProfile.username}`
          : "Conversation";

      return {
        conversation,
        latestNonDeletedMessage,
        latestDeletedMessage,
        hasDeletedMessages: deletedMessages.length > 0,
        hasNonDeletedMessages: nonDeletedMessages.length > 0,
        myParticipant,
        otherProfile,
        otherUserId: otherUserId,
        unread,
        title,
      };
    });
  }, [conversations, participants, profiles, messages, user?.id, conversationContextCards]);

  const displayConversationViews = useMemo(() => {
    switch (messageFolder) {
      case "deleted":
        return conversationViews.filter((v) => v.hasDeletedMessages);
      case "unread":
        return conversationViews.filter((v) => v.hasNonDeletedMessages && v.unread);
      case "read":
        return conversationViews.filter((v) => v.hasNonDeletedMessages && !v.unread);
      case "inbox":
      default:
        // Inbox shows all threads (including ones with zero messages yet). Deleted threads are handled by the Deleted folder.
        return conversationViews;
    }
  }, [conversationViews, messageFolder]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (displayConversationViews.some((v) => v.conversation.id === activeConversationId)) return;
    setActiveConversationId(displayConversationViews[0]?.conversation.id ?? null);
  }, [displayConversationViews, activeConversationId]);

  const activeConversation = conversationViews.find((row) => row.conversation.id === activeConversationId) ?? null;

  const activeConversationContextCardId = activeConversation?.conversation.context_card_id ?? null;

  const friendsUserIdSet = useMemo(() => {
    return new Set(friends.map((f) => String(f.id)));
  }, [friends]);

  const incomingFriendFromUserIdSet = useMemo(() => {
    return new Set(incomingFriendRequests.map((r) => String(r.fromProfile.id)));
  }, [incomingFriendRequests]);

  const outgoingFriendToUserIdSet = useMemo(() => {
    return new Set(outgoingFriendRequests.map((r) => String(r.toProfile.id)));
  }, [outgoingFriendRequests]);

  const listingContacts = useMemo(() => {
    // Re-select the latest by last_message_at.
    const latestMap = new Map<string, { otherUserId: string; profile: UserProfileRecord; conversationId: string; ts: number }>();
    for (const v of conversationViews) {
      if (!v.conversation.context_card_id) continue;
      if (!v.otherUserId || !v.otherProfile) continue;
      const key = String(v.otherUserId);
      const ts = new Date(v.conversation.last_message_at).getTime();
      const existing = latestMap.get(key);
      if (!existing || ts > existing.ts) {
        latestMap.set(key, { otherUserId: key, profile: v.otherProfile, conversationId: v.conversation.id, ts });
      }
    }

    return Array.from(latestMap.values()).sort((a, b) => b.ts - a.ts);
  }, [conversationViews]);

  const eligibleListingContacts = useMemo(() => {
    return listingContacts.filter(
      (c) =>
        !friendsUserIdSet.has(String(c.otherUserId)) &&
        !incomingFriendFromUserIdSet.has(String(c.otherUserId)) &&
        !outgoingFriendToUserIdSet.has(String(c.otherUserId))
    );
  }, [listingContacts, friendsUserIdSet, incomingFriendFromUserIdSet, outgoingFriendToUserIdSet]);

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
  const activeMessages = useMemo(() => {
    const base = messages.filter((message) => message.conversation_id === activeConversationId);
    if (messageFolder === "deleted") return base.filter((m) => Boolean(m.deleted_at));
    return base.filter((m) => !m.deleted_at);
  }, [messages, activeConversationId, messageFolder]);

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

  async function onMarkConversationUnread() {
    if (!activeConversationId || !user?.id) return;
    if (!supabaseConfigured || !supabase) return;

    setError("");
    try {
      const { error: updateError } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: null })
        .eq("conversation_id", activeConversationId)
        .eq("user_id", user.id);
      if (updateError) throw updateError;
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not mark unread.");
    }
  }

  async function onDeleteMessage(messageId: string) {
    if (!supabaseConfigured || !supabase) return;
    setError("");
    try {
      const { error: rpcError } = await supabase.rpc("delete_message", { p_message_id: messageId });
      if (rpcError) throw rpcError;
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not delete message.");
    }
  }

  async function onRestoreMessage(messageId: string) {
    if (!supabaseConfigured || !supabase) return;
    setError("");
    try {
      const { error: rpcError } = await supabase.rpc("restore_message", { p_message_id: messageId });
      if (rpcError) throw rpcError;
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not restore message.");
    }
  }

  async function onBulkDeleteSelectedConversations() {
    if (!supabaseConfigured || !supabase || !user?.id) return;
    if (selectedConversationIds.length === 0) return;

    if (!confirm(`Delete your messages from ${selectedConversationIds.length} conversation${selectedConversationIds.length === 1 ? "" : "s"}?`)) {
      return;
    }

    setBulkDeleting(true);
    setBulkDeleteError("");

    try {
      // Get all non-deleted messages in the selected conversations.
      const { data: messageRows, error: messagesError } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .in("conversation_id", selectedConversationIds)
        .is("deleted_at", null);

      if (messagesError) throw messagesError;

      const messageIds = (messageRows ?? [])
        .map((r: any) => String(r.id || ""))
        .filter(Boolean);

      const conversationsWithNonDeletedMessages = Array.from(
        new Set((messageRows ?? []).map((r: any) => String(r.conversation_id || "")).filter(Boolean))
      );

      const emptyOrClearedConversationIds = selectedConversationIds.filter(
        (id) => !conversationsWithNonDeletedMessages.includes(id)
      );

      // Soft-delete each message via the secure RPC (allows inbox cleanup).
      for (const id of messageIds) {
        const { error: rpcError } = await supabase.rpc("delete_message", { p_message_id: id });
        if (rpcError) throw rpcError;
      }

      // If a conversation has no messages, remove it from the current user's inbox.
      for (const conversationId of emptyOrClearedConversationIds) {
        const { error: rpcError } = await supabase.rpc("delete_conversation_for_user", { p_conversation_id: conversationId });
        if (rpcError) throw rpcError;
      }

      setSelectedConversationIds([]);
      setMessageFolder("inbox");
      await loadInbox();
    } catch (err: any) {
      setBulkDeleteError(err?.message || "Could not delete selected conversations.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function onSendFriendRequest(targetUsername: string) {
    if (!supabaseConfigured || !supabase) return;
    setFriendsError("");
    if (!targetUsername.trim()) return;

    setFriendActionSaving(true);
    try {
      const { error: rpcError } = await supabase.rpc("send_friend_request", {
        p_target_username: targetUsername,
      });
      if (rpcError) throw rpcError;
      await loadFriendsAndRequests();
      await loadInbox();
    } catch (err: any) {
      setFriendsError(err?.message || "Could not send friend request.");
    } finally {
      setFriendActionSaving(false);
    }
  }

  async function onRespondFriendRequest(requestId: string, accept: boolean) {
    if (!supabaseConfigured || !supabase) return;
    setFriendsError("");
    setFriendActionSaving(true);
    try {
      const { error: rpcError } = await supabase.rpc("respond_friend_request", {
        p_request_id: requestId,
        p_accept: accept,
      });
      if (rpcError) throw rpcError;
      await loadFriendsAndRequests();
      await loadInbox();
    } catch (err: any) {
      setFriendsError(err?.message || "Could not update friend request.");
    } finally {
      setFriendActionSaving(false);
    }
  }

  async function onMessageFriend(targetUsername: string) {
    if (!targetUsername.trim()) return;
    try {
      const conversationId = await startDirectConversation(targetUsername, undefined, null);
      window.location.href = `/messages?conversation=${encodeURIComponent(conversationId)}`;
    } catch (err: any) {
      setError(err?.message || "Could not start conversation.");
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
              <div className="text-sm font-semibold text-white">Messages</div>
              <button
                type="button"
                onClick={() => loadInbox()}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                disabled={loadingInbox}
              >
                {loadingInbox ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ["inbox", "Inbox"],
                ["unread", "Unread"],
                ["read", "Read"],
                ["deleted", "Deleted"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMessageFolder(key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    messageFolder === key
                      ? "border-amber-500/40 bg-amber-500/[0.10] text-amber-100"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">{selectedConversationIds.length} selected</div>
                <button
                  type="button"
                  onClick={() => void onBulkDeleteSelectedConversations()}
                  disabled={bulkDeleting || selectedConversationIds.length === 0}
                  className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkDeleting ? "Deleting…" : "Delete Selected"}
                </button>
              </div>
              {bulkDeleteError ? (
                <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2 text-xs text-red-100">
                  {bulkDeleteError}
                </div>
              ) : null}
            </div>

            {displayConversationViews.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                {messageFolder === "deleted"
                  ? "No deleted messages yet."
                  : messageFolder === "unread"
                    ? "No unread conversations."
                    : messageFolder === "read"
                      ? "No read conversations yet."
                      : "No conversations yet. Once members can message sellers from listings, threads will show up here."}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {displayConversationViews.map((row) => {
                  const previewMessage =
                    messageFolder === "deleted" ? row.latestDeletedMessage : row.latestNonDeletedMessage;
                  return (
                  <button
                    key={row.conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(row.conversation.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${row.conversation.id === activeConversationId ? "border-amber-500/30 bg-amber-500/[0.08]" : "border-white/10 bg-slate-950/40 hover:bg-slate-950/70"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedConversationIds.includes(row.conversation.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedConversationIds((prev) =>
                                checked
                                  ? Array.from(new Set([...prev, row.conversation.id]))
                                  : prev.filter((id) => id !== row.conversation.id)
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-white/20 bg-slate-950 text-emerald-500 accent-emerald-500"
                            aria-label={`Select conversation with ${row.title}`}
                          />
                          <span className="text-sm font-semibold text-white">{row.title}</span>
                          {row.unread ? <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Unread</span> : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{formatTimestamp(previewMessage?.created_at ?? row.conversation.last_message_at)}</div>
                      </div>
                    </div>
                    <div className="mt-3 line-clamp-2 text-sm text-slate-300">
                      {previewMessage?.body || "No messages yet."}
                    </div>
                  </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Friends</div>
                <div className="text-xs text-slate-500">{friends.length} Friend{friends.length === 1 ? "" : "s"}</div>
              </div>

              {friendsError ? (
                <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2 text-xs text-red-100">{friendsError}</div>
              ) : null}

              <div className="mt-3 space-y-2">
                {incomingFriendRequests.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Requests For You</div>
                    <div className="space-y-2">
                      {incomingFriendRequests.map((r) => (
                        <div key={r.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">@{r.fromProfile.username}</div>
                              <div className="mt-1 text-xs text-slate-400">Wants to be friends</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void onRespondFriendRequest(r.id, true)}
                                disabled={friendActionSaving}
                                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => void onRespondFriendRequest(r.id, false)}
                                disabled={friendActionSaving}
                                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {outgoingFriendRequests.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Requests Sent</div>
                    <div className="space-y-2">
                      {outgoingFriendRequests.map((r) => (
                        <div key={r.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">@{r.toProfile.username}</div>
                              <div className="mt-1 text-xs text-slate-400">Pending approval</div>
                            </div>
                            <div>
                              <button
                                type="button"
                                disabled
                                className="rounded-lg bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-500 disabled:opacity-100"
                              >
                                Requested
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {friends.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Accepted</div>
                    <div className="space-y-2">
                      {friends.map((f) => (
                        <div key={f.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">@{f.username}</div>
                              <div className="mt-1 text-xs text-slate-400">Messaging unlocked</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void onMessageFriend(f.username)}
                              disabled={friendActionSaving}
                              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {eligibleListingContacts.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Connected Via Listing</div>
                    <div className="space-y-2">
                      {eligibleListingContacts.map((c) => (
                        <div key={c.otherUserId} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">@{c.profile.username}</div>
                              <div className="mt-1 text-xs text-slate-400">Start a friend request to message without a card</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void onSendFriendRequest(c.profile.username)}
                                disabled={friendActionSaving}
                                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                              >
                                Request
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMessageFolder("inbox");
                                  setActiveConversationId(c.conversationId);
                                }}
                                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                              >
                                Open Thread
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {friends.length === 0 && incomingFriendRequests.length === 0 && outgoingFriendRequests.length === 0 && eligibleListingContacts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                    Start a conversation from a card listing to unlock friend requests.
                  </div>
                ) : null}
              </div>

              <div className="mt-3 text-xs text-slate-500">To message without referencing a specific card, they must accept your friend request.</div>
            </div>
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

                  {messageFolder !== "deleted" ? (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void onMarkConversationUnread()}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                      >
                        Mark Unread
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  {activeMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                      {messageFolder === "deleted" ? "No deleted messages in this thread." : "No messages yet. This thread is ready for the first message."}
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

                            {mine && messageFolder === "deleted" ? (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => void onRestoreMessage(message.id)}
                                  className="text-[11px] font-semibold text-emerald-200 hover:text-emerald-100"
                                >
                                  Restore
                                </button>
                              </div>
                            ) : null}

                            {mine && messageFolder !== "deleted" ? (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => void onDeleteMessage(message.id)}
                                  className="text-[11px] font-semibold text-slate-300 hover:text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {messageFolder !== "deleted" ? (
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
                ) : null}
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
