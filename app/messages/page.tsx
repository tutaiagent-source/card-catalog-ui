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

const appNavItems = [
  { href: "/catalog", label: "Catalog" },
  { href: "/pc", label: "PC ★" },
  { href: "/listed", label: "Listings" },
  { href: "/messages", label: "Messages" },
  { href: "/add-card", label: "Add" },
  { href: "/import", label: "Import" },
  { href: "/sold", label: "Sold" },
  { href: "/account", label: "Account" },
] as const;

const REPORT_REASONS = [
  { key: "harassment", label: "Harassment / bullying" },
  { key: "hate", label: "Hate speech" },
  { key: "scam", label: "Scam / fraud" },
  { key: "inappropriate", label: "Inappropriate content" },
  { key: "other", label: "Other" },
] as const;

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

  const [messageFolder, setMessageFolder] = useState<"inbox" | "unread" | "deleted">("inbox");

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  const [bulkMarking, setBulkMarking] = useState(false);

  const [conversationActionSaving, setConversationActionSaving] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReasonKey, setReportReasonKey] = useState<(typeof REPORT_REASONS)[number]["key"]>("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportHoneypot, setReportHoneypot] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [isSelectingConversations, setIsSelectingConversations] = useState(false);

  useEffect(() => {
    setSelectedConversationIds([]);
    setBulkDeleteError("");
    setIsSelectingConversations(false);
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

    let nextMyParticipantRows = (myParticipantRows ?? []) as ConversationParticipantRow[];
    let conversationIds = Array.from(new Set(nextMyParticipantRows.map((row: any) => String(row.conversation_id || "")).filter(Boolean)));

    if (conversationParam && !conversationIds.includes(conversationParam)) {
      const { error: restoreError } = await supabase.rpc("restore_conversation_access", {
        p_conversation_id: conversationParam,
      });

      if (restoreError) {
        setError(restoreError.message || "Could not restore this conversation.");
      } else {
        const { data: refreshedMyParticipantRows, error: refreshedMyParticipantError } = await supabase
          .from("conversation_participants")
          .select("conversation_id, user_id, joined_at, last_read_at, is_muted, is_blocked")
          .eq("user_id", user.id);

        if (refreshedMyParticipantError) {
          setLoadingInbox(false);
          setError(refreshedMyParticipantError.message);
          return;
        }

        nextMyParticipantRows = (refreshedMyParticipantRows ?? []) as ConversationParticipantRow[];
        conversationIds = Array.from(new Set(nextMyParticipantRows.map((row: any) => String(row.conversation_id || "")).filter(Boolean)));
      }
    }

    if (conversationIds.length === 0) {
      setConversations([]);
      setParticipants(nextMyParticipantRows);
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
        const otherParticipant = convoParticipants.find((row) => row.user_id !== user.id);
        if (otherParticipant?.user_id) return otherParticipant.user_id;
        const otherMessageSender = convoMessages.find((m) => m.sender_user_id !== user.id);
        return otherMessageSender?.sender_user_id ?? null;
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

      const fromLabel = otherProfile?.username
        ? `@${otherProfile.username}`
        : otherProfile?.display_name
          ? otherProfile.display_name
          : "User";

      const cardContextLabel = ctxCard?.year && ctxCard?.player_name
        ? `About ${ctxCard.year} ${ctxCard.player_name}`
        : null;

      const title = cardContextLabel || "Direct conversation";

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
        fromLabel,
        title,
        cardContextLabel,
      };
    });
  }, [conversations, participants, profiles, messages, user?.id, conversationContextCards]);

  const displayConversationViews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const base = (() => {
      switch (messageFolder) {
        case "deleted":
          return conversationViews.filter((v) => v.hasDeletedMessages);
        case "unread":
          return conversationViews.filter((v) => v.hasNonDeletedMessages && v.unread);
        case "inbox":
        default:
          // Inbox shows threads with non-deleted messages, plus truly empty (no-message-yet) threads.
          // Threads with only deleted messages belong in the Deleted folder.
          return conversationViews.filter(
            (v) => v.hasNonDeletedMessages || (!v.hasDeletedMessages && !v.hasNonDeletedMessages)
          );
      }
    })();

    if (!q) return base;

    return base.filter((v) => {
      const preview = messageFolder === "deleted" ? v.latestDeletedMessage : v.latestNonDeletedMessage;
      const subject = String(v.title || "").toLowerCase();
      const sender = String(v.fromLabel || "").toLowerCase();
      const body = String(preview?.body || "").toLowerCase();
      return subject.includes(q) || sender.includes(q) || body.includes(q);
    });
  }, [conversationViews, messageFolder, searchQuery]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (displayConversationViews.some((v) => v.conversation.id === activeConversationId)) return;
    if (conversationViews.some((v) => v.conversation.id === activeConversationId)) return;
    setActiveConversationId(displayConversationViews[0]?.conversation.id ?? null);
  }, [displayConversationViews, conversationViews, activeConversationId]);

  const activeConversation = conversationViews.find((row) => row.conversation.id === activeConversationId) ?? null;

  const unreadConversationCount = useMemo(
    () => conversationViews.filter((row) => row.hasNonDeletedMessages && row.unread).length,
    [conversationViews]
  );

  const activeConversationContextCardId = activeConversation?.conversation.context_card_id ?? null;
  const activeConversationIsBlocked = Boolean(activeConversation?.myParticipant?.is_blocked);
  const activeRecipientLabel = activeConversation?.otherProfile?.username
    ? `@${activeConversation.otherProfile.username}`
    : activeConversation?.otherProfile?.display_name || activeConversation?.title || "This Conversation";

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
    if (typeof document !== "undefined") {
      document.title = unreadConversationCount > 0 ? `(${unreadConversationCount}) Messages | CardCat` : "Messages | CardCat";
    }
  }, [unreadConversationCount]);

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
    if (activeConversationIsBlocked) {
      setError("You blocked this user.");
      return;
    }
    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    setSending(true);
    setError("");

    try {
      await sendMessage(activeConversationId, user.id, trimmed);
      setDraftMessage("");
      await loadInbox();
    } catch (err: any) {
      if (supabaseConfigured && supabase) {
        const { error: restoreError } = await supabase.rpc("restore_conversation_access", {
          p_conversation_id: activeConversationId,
        });

        if (!restoreError) {
          try {
            await sendMessage(activeConversationId, user.id, trimmed);
            setDraftMessage("");
            await loadInbox();
            return;
          } catch (retryErr: any) {
            setError(retryErr?.message || err?.message || "Could not send message.");
            return;
          }
        }
      }

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

  async function onDeleteActiveConversation() {
    if (!supabaseConfigured || !supabase || !user?.id || !activeConversationId) return;
    if (activeConversationIsBlocked) {
      setError("Unblock this user to delete the conversation.");
      return;
    }
    if (messageFolder === "deleted") {
      setError("This conversation is already in Deleted.");
      return;
    }

    if (
      !confirm(
        "Delete this conversation (moves it to Deleted for your account)?"
      )
    ) {
      return;
    }

    setConversationActionSaving(true);
    setError("");

    try {
      const { data: messageRows, error: messagesError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", activeConversationId)
        .is("deleted_at", null);

      if (messagesError) throw messagesError;

      const messageIds = (messageRows ?? [])
        .map((r: any) => String(r.id || ""))
        .filter(Boolean);

      // If this thread has no messages yet, soft-deleting messages does nothing.
      // Remove the caller's participant row so it disappears from Inbox.
      if (messageIds.length === 0) {
        const { error: convDeleteErr } = await supabase.rpc("delete_conversation_for_user", {
          p_conversation_id: activeConversationId,
        });
        if (convDeleteErr) throw convDeleteErr;

        setSelectedConversationIds([]);
        await loadInbox();
        return;
      }

      for (const id of messageIds) {
        const { error: rpcError } = await supabase.rpc("delete_message", {
          p_message_id: id,
        });
        if (rpcError) throw rpcError;
      }

      setSelectedConversationIds([]);
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not delete conversation.");
    } finally {
      setConversationActionSaving(false);
    }
  }

  async function onToggleBlockActiveConversation() {
    if (!supabaseConfigured || !supabase || !user?.id || !activeConversationId) return;

    setConversationActionSaving(true);
    setError("");

    try {
      const next = !activeConversationIsBlocked;

      const { error: updateError } = await supabase
        .from("conversation_participants")
        .update({ is_blocked: next })
        .eq("conversation_id", activeConversationId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not update block status.");
    } finally {
      setConversationActionSaving(false);
    }
  }

  async function onReportActiveConversation() {
    if (!user?.id || !activeConversationId || !activeConversation?.otherUserId) return;

    setReportModalOpen(true);
    setReportError(null);
    setReportSending(false);
    setReportDetails("");
    setReportName("");
    setReportHoneypot("");
    setReportReasonKey("harassment");

    const emailFromUser = String((user as any)?.email || "").trim();
    setReportEmail(emailFromUser);
  }

  async function submitUserReport() {
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id || !activeConversationId || !activeConversation?.otherUserId) return;

    const reasonLabel =
      REPORT_REASONS.find((r) => r.key === reportReasonKey)?.label || "Other";

    const email = reportEmail.trim();
    const name = reportName.trim();
    const details = reportDetails.trim();

    if (!email || !email.includes("@") || !email.includes(".")) {
      setReportError("Please enter a valid email.");
      return;
    }

    if (reportHoneypot.trim()) {
      setReportError("Spam detected.");
      return;
    }

    const subjectLabel = `User report (${reasonLabel})`;
    const messageParts: string[] = [
      `User report submitted from CardCat Messages`,
      ``,
      `Reporter: ${name || "N/A"} (id: ${user.id})`,
      `Reporter email: ${email}`,
      `Reported user: ${activeConversation?.otherProfile?.username ? `@${activeConversation.otherProfile.username}` : activeRecipientLabel} (id: ${activeConversation.otherUserId})`,
      `Conversation id: ${activeConversationId}`,
      `Reason: ${reasonLabel}`,
    ];

    if (details) {
      messageParts.push(``, `Details: ${details}`);
    }

    const message = messageParts.join("\n");

    setReportSending(true);
    setConversationActionSaving(true);
    setReportError(null);
    setError("");

    try {
      // 1) Email it via the same Contact endpoint (subject clearly indicates it's a user report).
      const resp = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectLabel,
          name,
          email,
          message,
          honeypot: reportHoneypot,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send report email.");
      }

      // 2) Also store it in Supabase for later admin tooling.
      const { error: insertError } = await supabase
        .from("user_reports")
        .insert({
          reporter_user_id: user.id,
          reported_user_id: activeConversation.otherUserId,
          conversation_id: activeConversationId,
          reason: reasonLabel,
          metadata: { details },
        });

      if (insertError) throw insertError;

      setReportModalOpen(false);
      alert("Thanks for the report. We'll review it.");
    } catch (err: any) {
      const msg = String(err?.message || "Could not submit report.");
      const lower = msg.toLowerCase();
      if (lower.includes("schema cache") || lower.includes("user_reports") || lower.includes("does not exist")) {
        setReportError(
          "Reports aren’t enabled yet on the server. Ask the CardCat admin to run the SQL migration for user reports."
        );
      } else {
        setReportError(msg);
      }
    } finally {
      setReportSending(false);
      setConversationActionSaving(false);
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

      // Soft-delete each message so threads move to Deleted without removing
      // the current user's participant row.
      for (const id of messageIds) {
        const { error: rpcError } = await supabase.rpc("delete_message", { p_message_id: id });
        if (rpcError) throw rpcError;
      }

      setSelectedConversationIds([]);
      await loadInbox();
    } catch (err: any) {
      setBulkDeleteError(err?.message || "Could not delete selected conversations.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function onBulkSetSelectedConversationsRead(lastReadAt: string | null) {
    if (!supabaseConfigured || !supabase || !user?.id) return;
    if (selectedConversationIds.length === 0) return;

    setError("");
    setBulkMarking(true);

    try {
      const { error: updateError } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: lastReadAt })
        .eq("user_id", user.id)
        .in("conversation_id", selectedConversationIds);

      if (updateError) throw updateError;

      setIsSelectingConversations(false);
      setSelectedConversationIds([]);
      await loadInbox();
    } catch (err: any) {
      setError(err?.message || "Could not update messages.");
    } finally {
      setBulkMarking(false);
    }
  }

  async function onBulkMarkSelectedConversationsRead() {
    await onBulkSetSelectedConversationsRead(new Date().toISOString());
  }

  async function onBulkMarkSelectedConversationsUnread() {
    await onBulkSetSelectedConversationsRead(null);
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardCatLogo />
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Messages</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span>Member-to-member card conversations, now back inside the real CardCat app nav.</span>
                {unreadConversationCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                    {unreadConversationCount} New {unreadConversationCount === 1 ? "Message" : "Messages"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
            {appNavItems.map((item) => {
              const active = item.href === "/messages";
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-emerald-500 text-emerald-950"
                      : "border border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/[0.08]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}

        {bulkDeleteError ? (
          <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">{bulkDeleteError}</div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Messages</div>

	              <div className="flex items-center gap-2">
	                {!isSelectingConversations ? (
	                  <button
	                    type="button"
	                    onClick={() => setIsSelectingConversations(true)}
	                    disabled={bulkDeleting || bulkMarking}
	                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                  >
	                    Select
	                  </button>
	                ) : (
	                  <>
	                    <button
	                      type="button"
	                      onClick={() => {
	                        setIsSelectingConversations(false);
	                        setSelectedConversationIds([]);
	                      }}
	                      disabled={bulkDeleting || bulkMarking}
	                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                    >
	                      Cancel
	                    </button>
	                    <div className="text-xs text-slate-500">{selectedConversationIds.length} selected</div>
	                    <button
	                      type="button"
	                      onClick={() => void onBulkMarkSelectedConversationsRead()}
	                      disabled={bulkDeleting || bulkMarking || selectedConversationIds.length === 0}
	                      className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
	                    >
	                      Mark Read
	                    </button>
	                    <button
	                      type="button"
	                      onClick={() => void onBulkMarkSelectedConversationsUnread()}
	                      disabled={bulkDeleting || bulkMarking || selectedConversationIds.length === 0}
	                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
	                    >
	                      Mark Unread
	                    </button>
	                    <button
	                      type="button"
	                      onClick={() => void onBulkDeleteSelectedConversations()}
	                      disabled={bulkDeleting || bulkMarking || selectedConversationIds.length === 0}
	                      className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
	                    >
	                      {bulkDeleting ? "Deleting…" : "Delete"}
	                    </button>
	                  </>
	                )}

                <button
                  type="button"
                  onClick={() => loadInbox()}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                  disabled={loadingInbox}
                >
                  {loadingInbox ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ["inbox", "Inbox"],
                ["unread", "Unread"],
                ["deleted", "Deleted"],
              ] as const).map(([key, label]) => {
                const badgeCount = key === "deleted" ? 0 : unreadConversationCount;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMessageFolder(key)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      messageFolder === key
                        ? "border-white/20 bg-white/[0.08] text-white"
                        : "border-transparent bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{label}</span>
                    {badgeCount > 0 ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${messageFolder === key ? "bg-emerald-500/25 text-emerald-100" : "bg-emerald-500/20 text-emerald-200"}`}>
                        {badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20"
              />
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                >
                  Clear
                </button>
              ) : null}
            </div>


            {displayConversationViews.length === 0 ? (
              <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400">
                {activeConversation && messageFolder === "inbox"
                  ? "This thread is open, but its earlier messages are cleared from Inbox. You can still reply from the conversation panel."
                  : messageFolder === "deleted"
                    ? "No deleted messages yet."
                    : messageFolder === "unread"
                      ? "No unread conversations."
                      : "No conversations yet. Once members can message sellers from listings, threads will show up here."}
              </div>
	            ) : (
	              <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
	                <div className="sticky top-0 z-10 grid grid-cols-[auto_1fr_2fr_auto] items-center gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur">
	                  <div className="flex justify-center" />
	                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">From</div>
	                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subject</div>
	                  <div className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Time</div>
	                </div>

	                <div>
	                  {displayConversationViews.map((row) => {
	                    const previewMessage =
	                      messageFolder === "deleted" ? row.latestDeletedMessage : row.latestNonDeletedMessage;
	                    const previewTimestamp = previewMessage?.created_at ?? row.conversation.last_message_at;
	                    return (
	                      <button
	                        key={row.conversation.id}
	                        type="button"
	                        onClick={() => {
	                          setActiveConversationId(row.conversation.id);
	                          if (isSelectingConversations) {
	                            setIsSelectingConversations(false);
	                            setSelectedConversationIds([]);
	                          }
	                          if (typeof window !== "undefined") {
	                            const url = new URL(window.location.href);
	                            url.searchParams.set("conversation", row.conversation.id);
	                            window.history.replaceState({}, "", url.toString());
	                          }
	                        }}
	                        className={`w-full border-b border-white/10 px-3 py-2 text-left transition-colors ${
	                          row.conversation.id === activeConversationId ? "bg-white/[0.07]" : "hover:bg-slate-950/60"
	                        }`}
	                      >
	                        <div className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-3">
	                          <div className="flex items-center justify-center">
	                            {isSelectingConversations ? (
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
	                            ) : row.unread ? (
	                              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-label="Unread" />
	                            ) : (
	                              <span className="h-2 w-2 rounded-full opacity-0" aria-hidden="true" />
	                            )}
	                          </div>

	                          <div className="min-w-0">
	                            <div className={`truncate text-sm ${row.unread ? "font-semibold text-white" : "text-slate-300"}`}>{row.fromLabel}</div>
	                          </div>

	                          <div className="min-w-0">
	                            <div className={`truncate text-sm ${row.unread || row.conversation.id === activeConversationId ? "text-white" : "text-slate-200"}`}>{row.title}</div>
	                            <div className="line-clamp-1 text-xs text-slate-400">{previewMessage?.body || "No messages yet."}</div>
	                          </div>

	                          <div className="text-right text-xs text-slate-400">{formatTimestamp(previewTimestamp)}</div>
	                        </div>
	                      </button>
	                    );
	                  })}
	                </div>
	              </div>
	            )}

            <details className="mt-6 border-t border-white/10 pt-4">
	              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
	                <div className="flex items-center gap-3">
	                  <div className="text-sm font-semibold text-white">Contacts</div>
	                  <div className="text-xs text-slate-500">{friends.length} Friend{friends.length === 1 ? "" : "s"}</div>
	                </div>
	                <div className="text-xs text-slate-500">{friends.length + incomingFriendRequests.length + outgoingFriendRequests.length > 0 ? "Open" : ""}</div>
	              </summary>

	              <div className="mt-3 max-h-72 overflow-y-auto">
	                {friendsError ? (
	                  <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2 text-xs text-red-100">{friendsError}</div>
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
            </details>
          </section>

	          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 flex flex-col min-h-0 lg:h-[calc(100vh-220px)] lg:overflow-hidden">
	            {activeConversation ? (
	              <>
	                <div className="border-b border-white/10 pb-4 flex-shrink-0">
	                  <div className="text-lg font-semibold text-white">{activeRecipientLabel}</div>
	                  <div className="mt-1 text-sm text-slate-300">Direct conversation</div>
	                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    {activeConversation.cardContextLabel && activeMessages.length > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-200">
                        {activeConversation.cardContextLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    {messageFolder !== "deleted" && !activeConversationIsBlocked ? (
                      <button
                        type="button"
                        onClick={() => void onDeleteActiveConversation()}
                        disabled={conversationActionSaving}
                        className="rounded-xl border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/[0.14] disabled:opacity-60"
                      >
                        {conversationActionSaving ? "Deleting…" : "Delete thread"}
                      </button>
                    ) : null}

                    {messageFolder !== "deleted" ? (
                      <button
                        type="button"
                        onClick={() => void onMarkConversationUnread()}
                        disabled={conversationActionSaving}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        Mark Unread
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void onToggleBlockActiveConversation()}
                      disabled={conversationActionSaving}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/[0.14] disabled:opacity-60"
                    >
                      {activeConversationIsBlocked ? (conversationActionSaving ? "Unblocking…" : "Unblock user") : (conversationActionSaving ? "Blocking…" : "Block user")}
                    </button>

                    {activeConversation?.otherUserId ? (
                      <button
                        type="button"
                        onClick={() => void onReportActiveConversation()}
                        disabled={conversationActionSaving}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        {conversationActionSaving ? "Reporting…" : "Report user"}
                      </button>
                    ) : null}
                  </div>
                </div>

	                <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
	                  {activeMessages.length === 0 ? (
	                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
	                      {messageFolder === "deleted" ? "No deleted messages in this thread." : "No messages yet. This thread is ready for the first message."}
	                    </div>
	                  ) : (
	                    <div className="space-y-3">
	                      {activeMessages.map((message) => {
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
	                          <div
	                            key={message.id}
	                            className={`rounded-2xl border border-white/10 p-4 ${mine ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "bg-slate-950/20"}`}
	                          >
	                            <div className="flex items-start justify-between gap-3">
	                              <div className="min-w-0">
	                                <div className={`text-xs font-semibold ${mine ? "text-emerald-100" : "text-slate-300"}`}>
	                                  {mine ? "From: You" : `From: ${senderLabel}`}
	                                </div>
	                                <div className="mt-1 text-[11px] text-slate-400">{formatTimestamp(message.created_at)}</div>
	                              </div>

	                              {mine ? (
	                                messageFolder === "deleted" ? (
	                                  <button
	                                    type="button"
	                                    onClick={() => void onRestoreMessage(message.id)}
	                                    className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
	                                  >
	                                    Restore
	                                  </button>
	                                ) : (
	                                  <button
	                                    type="button"
	                                    onClick={() => void onDeleteMessage(message.id)}
	                                    className="rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white"
	                                  >
	                                    Delete
	                                  </button>
	                                )
	                              ) : null}
	                            </div>

	                            <div className="mt-3 whitespace-pre-wrap text-sm text-slate-100">{message.body}</div>
	                          </div>
	                        );
	                      })}
	                    </div>
	                  )}
	                </div>

	                {messageFolder !== "deleted" ? (
	                  <div className="mt-4 border-t border-white/10 pt-4 flex-shrink-0">
	                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
	                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2">
	                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">To</div>
	                        <div className="mt-1 text-sm font-semibold text-white">{activeRecipientLabel}</div>
	                        {activeConversation.cardContextLabel && activeMessages.length > 0 ? (
	                          <div className="mt-1 text-xs text-emerald-100/90">{activeConversation.cardContextLabel}</div>
	                        ) : null}
	                      </div>
	                      <textarea
	                        value={draftMessage}
	                        onChange={(e) => setDraftMessage(e.target.value)}
	                        placeholder={activeConversationIsBlocked ? "You blocked this user." : `Write a reply to ${activeRecipientLabel}...`}
	                        disabled={activeConversationIsBlocked}
	                        className="mt-3 min-h-[110px] w-full resize-none rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
	                      />
	                      <div className="mt-3 flex items-center justify-between gap-3">
	                        <div className="text-xs text-slate-500">
	                          {activeConversationIsBlocked ? `You blocked ${activeRecipientLabel}` : `Replying to ${activeRecipientLabel}`}
	                        </div>
	                        <button
	                          type="button"
	                          onClick={onSendMessage}
	                          disabled={sending || !draftMessage.trim() || activeConversationIsBlocked}
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

      {reportModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-white">Report user</div>
                <div className="mt-1 text-sm text-slate-300">
                  Help us review this conversation.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  setReportError(null);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Reason
                </label>
                <select
                  value={reportReasonKey}
                  onChange={(e) => setReportReasonKey(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="What happened? Any context that helps reviewers understand."
                  className="mt-2 min-h-[110px] w-full resize-y rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Your name (optional)
                  </label>
                  <input
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="Jane / Sam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Your email (required)
                  </label>
                  <input
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="you@example.com"
                    inputMode="email"
                  />
                </div>
              </div>

              {/* Honeypot (hidden) */}
              <input
                type="text"
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
                value={reportHoneypot}
                onChange={(e) => setReportHoneypot(e.target.value)}
              />

              {reportError ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">
                  {reportError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportError(null);
                  }}
                  disabled={reportSending || conversationActionSaving}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitUserReport()}
                  disabled={reportSending || conversationActionSaving}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {reportSending || conversationActionSaving
                    ? "Submitting…"
                    : "Submit report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CardCatMobileNav />
    </main>
  );
}
