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
import {
  DealOfferRow,
  DealRecordRow,
  DealDetailsRow,
  DealTimelineEventRow,
  addDealTimelineEvent,
  createDealOffer,
  createDealRecord,
  loadDealOffersForDealRecord,
  loadDealRecordsForConversation,
  loadDealDetailsForDealRecord,
  loadDealTimelineEventsForDealRecord,
  respondToDealOffer,
  upsertDealDetailsForDealRecord,
} from "@/lib/deals";

import { driveToImageSrc } from "@/lib/googleDrive";

type CardContext = {
  id?: string;
  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;
  card_number: string;
  user_id?: string | null;
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

  const [dealRecords, setDealRecords] = useState<DealRecordRow[]>([]);
  const [activeDealRecord, setActiveDealRecord] = useState<DealRecordRow | null>(null);
  const [dealOffers, setDealOffers] = useState<DealOfferRow[]>([]);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealActionSaving, setDealActionSaving] = useState(false);
  const [dealError, setDealError] = useState<string>("");

  const [dealDetails, setDealDetails] = useState<DealDetailsRow | null>(null);
  const [dealTimelineEvents, setDealTimelineEvents] = useState<DealTimelineEventRow[]>([]);
  const [dealDetailsLoading, setDealDetailsLoading] = useState(false);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);

  const [paymentMethodNoteDraft, setPaymentMethodNoteDraft] = useState("");
  const [paymentReferenceNoteDraft, setPaymentReferenceNoteDraft] = useState("");
  const [paidDateDraft, setPaidDateDraft] = useState("");

  const [shippingCarrierDraft, setShippingCarrierDraft] = useState("");
  const [trackingNumberDraft, setTrackingNumberDraft] = useState("");
  const [shippedDateDraft, setShippedDateDraft] = useState("");
  const [deliveredDateDraft, setDeliveredDateDraft] = useState("");
  const [shippingCostDraft, setShippingCostDraft] = useState("");
  const [insurancePurchasedDraft, setInsurancePurchasedDraft] = useState(false);
  const [insuranceAmountDraft, setInsuranceAmountDraft] = useState("");
  const [signatureRequiredDraft, setSignatureRequiredDraft] = useState(false);

  const [completedDealLoading, setCompletedDealLoading] = useState(false);

  const [offerAmountDraft, setOfferAmountDraft] = useState<string>("");
  const [offerMessageDraft, setOfferMessageDraft] = useState<string>("");
  const [counterAmountDraft, setCounterAmountDraft] = useState<string>("");

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
          latestNonDeletedMessage.sender_user_id !== user?.id &&
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
    setActiveConversationId(displayConversationViews[0]?.conversation.id ?? null);
  }, [displayConversationViews, conversationViews, activeConversationId]);

  const activeConversation = conversationViews.find((row) => row.conversation.id === activeConversationId) ?? null;

  const activeConversationOtherUserId = useMemo(() => {
    if (!activeConversationId || !user?.id) return null;
    const otherFromParticipants = participants.find(
      (p) => p.conversation_id === activeConversationId && p.user_id !== user.id
    )?.user_id;
    if (otherFromParticipants) return otherFromParticipants;

    const otherFromConversationView = activeConversation?.otherUserId;
    if (otherFromConversationView) return otherFromConversationView;

    const otherFromMessages = messages
      .find((m) => m.conversation_id === activeConversationId && m.sender_user_id !== user.id)
      ?.sender_user_id;
    return otherFromMessages ?? null;
  }, [activeConversationId, user?.id, participants, activeConversation?.otherUserId, messages]);

  const unreadConversationCount = useMemo(
    () => conversationViews.filter((row) => row.hasNonDeletedMessages && row.unread).length,
    [conversationViews]
  );

  const activeConversationContextCardId = activeConversation?.conversation.context_card_id ?? null;
  const activeConversationIsBlocked = Boolean(activeConversation?.myParticipant?.is_blocked);
  const activeRecipientLabel = activeConversation?.otherProfile?.username
    ? `@${activeConversation.otherProfile.username}`
    : activeConversation?.otherProfile?.display_name || activeConversation?.title || "This Conversation";

  const pendingDealOffer = useMemo(() => {
    return dealOffers.find((o) => String(o.status || "").toLowerCase() === "pending") ?? null;
  }, [dealOffers]);

  const dealRecordForDisplay = useMemo(() => {
    if (!activeDealRecord) return null;
    if (!activeConversationId || !activeConversationContextCardId) return null;
    if (String(activeDealRecord.conversation_id) !== String(activeConversationId)) return null;
    if (!activeDealRecord.card_id) return null;
    if (String(activeDealRecord.card_id) !== String(activeConversationContextCardId)) return null;
    return activeDealRecord;
  }, [activeDealRecord, activeConversationId, activeConversationContextCardId]);

  const dealStatusLower = String(dealRecordForDisplay?.status ?? "").toLowerCase();
  const paymentRecorded = Boolean(dealDetails?.paid_date);
  const paymentConfirmed = ["payment_confirmed", "shipping_entered", "completed"].includes(dealStatusLower);
  const shippingRecorded = Boolean(dealDetails?.shipping_carrier || dealDetails?.tracking_number || dealDetails?.shipped_date);
  const dealCompleted = dealStatusLower === "completed";

  const latestDealOffer = useMemo(() => {
    return dealOffers[0] ?? null;
  }, [dealOffers]);

  const dealMiniTimeline = useMemo(() => {
    const items: Array<{ label: string; time?: string; detail?: string }> = [];

    const offer = latestDealOffer;
    if (offer?.created_at) {
      items.push({
        label: "Offer sent",
        time: formatTimestamp(offer.created_at),
      });
    }

    if (offer?.status && String(offer.status).toLowerCase() === "countered") {
      items.push({
        label: "Countered",
        time: offer.created_at ? formatTimestamp(offer.created_at) : undefined,
      });
    }

    if (dealRecordForDisplay?.status && String(dealRecordForDisplay.status).toLowerCase() === "offer_accepted") {
      items.push({
        label: "Accepted",
        time: dealRecordForDisplay.accepted_at ? formatTimestamp(dealRecordForDisplay.accepted_at) : undefined,
        detail: dealRecordForDisplay.agreed_price != null ? formatDealMoney(Number(dealRecordForDisplay.agreed_price)) : undefined,
      });
    }

    if (dealRecordForDisplay?.status && String(dealRecordForDisplay.status).toLowerCase() === "offer_declined") {
      items.push({
        label: "Declined",
        time: dealRecordForDisplay.updated_at ? formatTimestamp(dealRecordForDisplay.updated_at) : undefined,
      });
    }

    return items.slice(0, 3);
  }, [latestDealOffer, dealRecordForDisplay]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!dealRecordForDisplay) {
        setDealDetails(null);
        setDealTimelineEvents([]);
        return;
      }

      setDealDetailsLoading(true);
      try {
        const [details, events] = await Promise.all([
          loadDealDetailsForDealRecord(dealRecordForDisplay.id),
          loadDealTimelineEventsForDealRecord(dealRecordForDisplay.id),
        ]);

        if (cancelled) return;
        setDealDetails(details);
        setDealTimelineEvents(events);

        // Prime form drafts
        setPaymentMethodNoteDraft(details?.payment_method_note ?? "");
        setPaymentReferenceNoteDraft(details?.payment_reference_note ?? "");
        setPaidDateDraft(details?.paid_date ?? "");

        setShippingCarrierDraft(details?.shipping_carrier ?? "");
        setTrackingNumberDraft(details?.tracking_number ?? "");
        setShippedDateDraft(details?.shipped_date ?? "");
        setDeliveredDateDraft(details?.delivered_date ?? "");
        setShippingCostDraft(details?.shipping_cost != null ? String(details.shipping_cost) : "");
        setInsurancePurchasedDraft(Boolean(details?.insurance_purchased));
        setInsuranceAmountDraft(details?.insurance_amount != null ? String(details.insurance_amount) : "");
        setSignatureRequiredDraft(Boolean(details?.signature_required));
      } catch (e: any) {
        if (!cancelled) {
          // Keep UI resilient.
          console.warn("Failed to load deal details/timeline", e);
        }
      } finally {
        if (!cancelled) setDealDetailsLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [dealRecordForDisplay]);

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
        .select("id, user_id, player_name, year, brand, set_name, parallel, card_number, asking_price, image_url")
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

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!activeConversationId || !user?.id || !supabaseConfigured || !supabase) {
        setDealRecords([]);
        setActiveDealRecord(null);
        setDealOffers([]);
        return;
      }

      setDealLoading(true);
      setDealError("");
      try {
        console.debug("[DealsLoad] thread scope", {
          current_conversation_id: activeConversationId,
          current_card_id: activeConversationContextCardId,
        });
        const records = await loadDealRecordsForConversation(activeConversationId, activeConversationContextCardId);
        if (cancelled) return;
        console.debug("[DealsLoad] fetched deal_records", {
          current_conversation_id: activeConversationId,
          current_card_id: activeConversationContextCardId,
          fetched: (records ?? []).map((r) => ({
            deal_record_id: r.id,
            conversation_id: r.conversation_id,
            card_id: r.card_id,
            status: r.status,
          })),
        });

        const mismatched = (records ?? []).filter((r) => {
          const convOk = String(r.conversation_id) === String(activeConversationId);
          const cardOk = activeConversationContextCardId ? String(r.card_id) === String(activeConversationContextCardId) : true;
          return !convOk || !cardOk;
        });
        if (mismatched.length > 0) {
          console.warn("[DealsLoad] deal_records scope mismatch detected", {
            current_conversation_id: activeConversationId,
            current_card_id: activeConversationContextCardId,
            mismatched: mismatched.map((r) => ({
              deal_record_id: r.id,
              conversation_id: r.conversation_id,
              card_id: r.card_id,
              status: r.status,
            })),
          });
        }
        setDealRecords(records);
        const top = records[0] ?? null;
        setActiveDealRecord(top);

        if (top) {
          const offers = await loadDealOffersForDealRecord(top.id);
          if (cancelled) return;
          setDealOffers(offers);
        } else {
          setDealOffers([]);
        }
      } catch (err: any) {
        if (cancelled) return;
        setDealError(err?.message || "Could not load deal records.");
      } finally {
        if (cancelled) return;
        setDealLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, user?.id]);
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

    const clientRequestId = crypto.randomUUID();

    setSending(true);
    setError("");

    try {
      await sendMessage(activeConversationId, user.id, trimmed, clientRequestId);
      setDraftMessage("");
      await loadInbox();
    } catch (err: any) {
      if (supabaseConfigured && supabase) {
        const { error: restoreError } = await supabase.rpc("restore_conversation_access", {
          p_conversation_id: activeConversationId,
        });

        if (!restoreError) {
          try {
            await sendMessage(activeConversationId, user.id, trimmed, clientRequestId);
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

  function formatDealMoney(amount?: number | null) {
    if (amount == null || !Number.isFinite(Number(amount))) return "";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(amount));
  }

  function dealRecordStatusLabel(status?: string | null) {
    switch ((status ?? "").toLowerCase()) {
      case "draft":
        return "Draft";
      case "offer_pending":
        return "Offer Pending";
      case "offer_accepted":
        return "Offer Accepted";
      case "offer_declined":
        return "Offer Declined";
      case "payment_recorded":
        return "Payment Recorded";
      case "payment_confirmed":
        return "Payment Confirmed";
      case "shipping_entered":
        return "Shipping Added";
      case "completed":
        return "Completed";
      default:
        return status ? status : "Draft";
    }
  }

  function dealOfferStatusLabel(status?: string | null) {
    switch ((status ?? "").toLowerCase()) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "declined":
        return "Declined";
      case "countered":
        return "Countered";
      default:
        return status ? status : "Pending";
    }
  }

  function profileHandleById(userId?: string | null) {
    if (!userId) return "—";
    const uid = String(userId);
    const p = profiles.find((pp) => String(pp.id) === uid) ?? null;
    if (!p) return "—";
    if (p.username) return `@${p.username}`;
    if (p.display_name) return p.display_name;
    return "User";
  }

  function computeBuyerSeller(fromUserId: string, toUserId: string) {
    const sellerId = activeConversationCard?.user_id ? String(activeConversationCard.user_id) : null;
    if (!sellerId) return { buyerUserId: null as string | null, sellerUserId: null as string | null };
    if (fromUserId === sellerId && toUserId !== sellerId) return { buyerUserId: toUserId, sellerUserId: sellerId };
    if (toUserId === sellerId && fromUserId !== sellerId) return { buyerUserId: fromUserId, sellerUserId: sellerId };
    return { buyerUserId: null as string | null, sellerUserId: null as string | null };
  }

  async function refreshDeals() {
    if (!activeConversationId || !user?.id) return;
    console.debug("[DealsRefresh] thread scope", {
      current_conversation_id: activeConversationId,
      current_card_id: activeConversationContextCardId,
    });
    const records = await loadDealRecordsForConversation(activeConversationId, activeConversationContextCardId);
    const top = records[0] ?? null;
    console.debug("[DealsRefresh] fetched deal_records", {
      current_conversation_id: activeConversationId,
      current_card_id: activeConversationContextCardId,
      fetched: (records ?? []).map((r) => ({
        deal_record_id: r.id,
        conversation_id: r.conversation_id,
        card_id: r.card_id,
        status: r.status,
      })),
    });

    const mismatched = (records ?? []).filter((r) => {
      const convOk = String(r.conversation_id) === String(activeConversationId);
      const cardOk = activeConversationContextCardId ? String(r.card_id) === String(activeConversationContextCardId) : true;
      return !convOk || !cardOk;
    });
    if (mismatched.length > 0) {
      console.warn("[DealsRefresh] deal_records scope mismatch detected", {
        current_conversation_id: activeConversationId,
        current_card_id: activeConversationContextCardId,
        mismatched: mismatched.map((r) => ({
          deal_record_id: r.id,
          conversation_id: r.conversation_id,
          card_id: r.card_id,
          status: r.status,
        })),
      });
    }
    setDealRecords(records);
    setActiveDealRecord(top);

    if (top) {
      const offers = await loadDealOffersForDealRecord(top.id);
      setDealOffers(offers);
    } else {
      setDealOffers([]);
    }
  }

  async function onCreateDealRecord() {
    if (!activeConversationId || !user?.id) return;
    if (dealActionSaving || dealRecordForDisplay) return;
    if (!activeConversationContextCardId) return;

    setDealActionSaving(true);
    setDealError("");
    try {
      const created = await createDealRecord({
        conversationId: activeConversationId,
        cardId: activeConversationContextCardId,
        dealType: "sale",
        createdByUserId: user.id,
      });

      setActiveDealRecord(created);
      setDealRecords([created]);

      await addDealTimelineEvent({
        dealRecordId: created.id,
        userId: user.id,
        eventType: "deal_record_created",
        title: "Deal record created",
        description: "Documentation-only transaction record for this message thread.",
        metadata: { deal_type: created.deal_type },
      });

      await refreshDeals();
    } catch (err: any) {
      setDealError(err?.message || "Could not create deal record.");
    } finally {
      setDealActionSaving(false);
    }
  }

  async function onMakeOffer() {
    if (!dealRecordForDisplay || !user?.id) return;

    let otherUserId: string | null = activeConversationOtherUserId ? String(activeConversationOtherUserId) : null;
    if (!otherUserId) {
      if (!supabaseConfigured || !supabase || !activeConversationId) {
        setDealError("Could not determine the other user for this thread.");
        return;
      }

      const { data, error } = await supabase.rpc("get_conversation_other_user", {
        p_conversation_id: activeConversationId,
      });

      if (error) {
        setDealError(error.message || "Could not determine the other user for this thread.");
        return;
      }

      otherUserId = data ? String(data) : null;
      if (!otherUserId) {
        setDealError("Could not determine the other user for this thread.");
        return;
      }
    }

    const amount = Number(offerAmountDraft.trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      setDealError("Enter a valid offer amount.");
      return;
    }

    setDealActionSaving(true);
    setDealError("");
    try {
      await createDealOffer({
        dealRecordId: dealRecordForDisplay.id,
        fromUserId: user.id,
        toUserId: otherUserId,
        offerAmount: amount,
        message: offerMessageDraft.trim() || null,
      });

      const { buyerUserId, sellerUserId } = computeBuyerSeller(user.id, otherUserId);
      await supabase
        ?.from("deal_records")
        .update({
          status: "offer_pending",
          agreed_price: null,
          buyer_user_id: buyerUserId,
          seller_user_id: sellerUserId,
        })
        .eq("id", dealRecordForDisplay.id);

      await addDealTimelineEvent({
        dealRecordId: dealRecordForDisplay.id,
        userId: user.id,
        eventType: "offer_sent",
        title: "Offer sent",
        description: `Offered ${formatDealMoney(amount)}.`,
        metadata: { offer_amount: amount },
      });

      setOfferAmountDraft("");
      setOfferMessageDraft("");
      await refreshDeals();
    } catch (err: any) {
      setDealError(err?.message || "Could not send offer.");
    } finally {
      setDealActionSaving(false);
    }
  }

  async function onAcceptOffer(offer: DealOfferRow) {
    if (!dealRecordForDisplay || !user?.id) return;
    setDealActionSaving(true);
    setDealError("");
    try {
      await respondToDealOffer({
        offerId: offer.id,
        actorUserId: user.id,
        responseStatus: "accepted",
      });

      const offered = offer.offer_amount != null ? Number(offer.offer_amount) : null;
      const { buyerUserId, sellerUserId } = computeBuyerSeller(offer.from_user_id, offer.to_user_id);

      await supabase
        ?.from("deal_records")
        .update({
          status: "offer_accepted",
          agreed_price: offered,
          accepted_at: new Date().toISOString(),
          buyer_user_id: buyerUserId,
          seller_user_id: sellerUserId,
        })
        .eq("id", dealRecordForDisplay.id);

      await addDealTimelineEvent({
        dealRecordId: dealRecordForDisplay.id,
        userId: user.id,
        eventType: "offer_accepted",
        title: "Offer accepted",
        description: offered != null ? `Accepted ${formatDealMoney(offered)}.` : "Offer accepted.",
        metadata: { offer_amount: offered },
      });

      await refreshDeals();
    } catch (err: any) {
      setDealError(err?.message || "Could not accept offer.");
    } finally {
      setDealActionSaving(false);
    }
  }

  async function onDeclineOffer(offer: DealOfferRow) {
    if (!dealRecordForDisplay || !user?.id) return;
    setDealActionSaving(true);
    setDealError("");
    try {
      await respondToDealOffer({
        offerId: offer.id,
        actorUserId: user.id,
        responseStatus: "declined",
      });

      await supabase
        ?.from("deal_records")
        .update({
          status: "offer_declined",
        })
        .eq("id", dealRecordForDisplay.id);

      await addDealTimelineEvent({
        dealRecordId: dealRecordForDisplay.id,
        userId: user.id,
        eventType: "offer_declined",
        title: "Offer declined",
        description: "Offer declined.",
      });

      await refreshDeals();
    } catch (err: any) {
      setDealError(err?.message || "Could not decline offer.");
    } finally {
      setDealActionSaving(false);
    }
  }

  async function onCounterOffer(offer: DealOfferRow) {
    if (!dealRecordForDisplay || !user?.id) return;
    const otherUserId = offer.from_user_id;
    const amount = Number(counterAmountDraft.trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      setDealError("Enter a valid counter amount.");
      return;
    }

    setDealActionSaving(true);
    setDealError("");
    try {
      await respondToDealOffer({
        offerId: offer.id,
        actorUserId: user.id,
        responseStatus: "countered",
      });

      await createDealOffer({
        dealRecordId: dealRecordForDisplay.id,
        fromUserId: user.id,
        toUserId: otherUserId,
        offerAmount: amount,
        message: offerMessageDraft.trim() || null,
      });

      const { buyerUserId, sellerUserId } = computeBuyerSeller(user.id, otherUserId);
      await supabase
        ?.from("deal_records")
        .update({
          status: "offer_pending",
          buyer_user_id: buyerUserId,
          seller_user_id: sellerUserId,
          agreed_price: null,
        })
        .eq("id", dealRecordForDisplay.id);

      await addDealTimelineEvent({
        dealRecordId: dealRecordForDisplay.id,
        userId: user.id,
        eventType: "counter_sent",
        title: "Counter sent",
        description: `Countered at ${formatDealMoney(amount)}.`,
        metadata: { offer_amount: amount },
      });

      setCounterAmountDraft("");
      await refreshDeals();
    } catch (err: any) {
      setDealError(err?.message || "Could not send counter offer.");
    } finally {
      setDealActionSaving(false);
    }
  }

  function onDownloadDealRecordRawData() {
    if (!dealRecordForDisplay) return;
    const payload = {
      deal_record: dealRecordForDisplay,
      deal_details: dealDetails,
      offers: dealOffers,
      timeline_events: dealTimelineEvents,
      card_context: activeConversationCard,
      conversation_id: activeConversationId,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deal_record_${dealRecordForDisplay.id}_raw.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value: any) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPaidDate(value?: string | null) {
    if (!value) return "";
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
  }

  function formatOptionalNumber(value?: number | null) {
    if (value == null || !Number.isFinite(Number(value))) return "";
    return formatDealMoney(Number(value));
  }

  function buildDealRecordHtml(params: { draft: boolean; title: string }) {
    if (!dealRecordForDisplay) return "";

    const card = activeConversationCard;
    const buyerHandle = profileHandleById(dealRecordForDisplay.buyer_user_id);
    const sellerHandle = profileHandleById(dealRecordForDisplay.seller_user_id);

    const agreedPriceText =
      dealRecordForDisplay.agreed_price != null
        ? formatDealMoney(Number(dealRecordForDisplay.agreed_price))
        : dealRecordForDisplay.status === "offer_accepted" && pendingDealOffer?.offer_amount != null
          ? formatDealMoney(Number(pendingDealOffer.offer_amount))
          : "—";

    const acceptedAtText = dealRecordForDisplay.accepted_at ? formatTimestamp(dealRecordForDisplay.accepted_at) : "—";
    const dealIdShort = String(dealRecordForDisplay.id).slice(0, 8);

    const offersAsc = [...dealOffers].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return ta - tb;
    });

    const buyerId = dealRecordForDisplay.buyer_user_id;
    const sellerId = dealRecordForDisplay.seller_user_id;

    const offerLines = offersAsc
      .map((o) => {
        const when = o.created_at ? formatTimestamp(o.created_at) : "";
        const amount = o.offer_amount != null ? formatDealMoney(Number(o.offer_amount)) : "—";
        const fromRole = o.from_user_id === buyerId ? "Buyer" : o.from_user_id === sellerId ? "Seller" : "Participant";
        const action = o.status
          ? o.status === "accepted"
            ? "offered (accepted)"
            : o.status === "declined"
              ? "offered (declined)"
              : o.status === "countered"
                ? "countered"
                : "offered"
          : "offered";
        return `${fromRole} ${action} ${amount}${when ? ` on ${escapeHtml(when)}` : ""}`;
      })
      .join("\n");

    const timelineLines = (dealTimelineEvents ?? [])
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((e) => {
        const when = e.created_at ? formatTimestamp(e.created_at) : "";
        return `${e.title}${when ? ` — ${when}` : ""}`;
      })
      .join("\n");

    const paymentConfirmed = ["payment_confirmed", "shipping_entered", "completed"].includes(
      String(dealRecordForDisplay.status).toLowerCase()
    );
    const paymentRecorded = Boolean(dealDetails?.paid_date);

    const paymentSectionHtml = paymentRecorded
      ? `
        <div class="section">
          <h2>Payment Details</h2>
          <div class="kv"><div class="k">Payment status</div><div class="v">${paymentConfirmed ? "Seller confirmed payment received" : "Payment details recorded (awaiting seller confirmation)"}</div></div>
          <div class="kv"><div class="k">Payment method note</div><div class="v">${escapeHtml(dealDetails?.payment_method_note ?? "") || "—"}</div></div>
          <div class="kv"><div class="k">Paid date</div><div class="v">${escapeHtml(formatPaidDate(dealDetails?.paid_date ?? null) || "—")}</div></div>
          <div class="kv"><div class="k">Amount paid</div><div class="v">${escapeHtml(agreedPriceText)}</div></div>
          <div class="kv"><div class="k">Payment reference/note</div><div class="v">${escapeHtml(dealDetails?.payment_reference_note ?? "") || "—"}</div></div>
        </div>
      `
      : "";

    const shippingRecorded = Boolean(dealDetails?.shipped_date || dealDetails?.tracking_number || dealDetails?.shipping_carrier);

    const shippingSectionHtml = shippingRecorded
      ? `
        <div class="section">
          <h2>Shipping Details</h2>
          <div class="kv"><div class="k">Shipping carrier</div><div class="v">${escapeHtml(dealDetails?.shipping_carrier ?? "") || "—"}</div></div>
          <div class="kv"><div class="k">Tracking number</div><div class="v">${escapeHtml(dealDetails?.tracking_number ?? "") || "—"}</div></div>
          <div class="kv"><div class="k">Shipped date</div><div class="v">${escapeHtml(formatPaidDate(dealDetails?.shipped_date ?? null) || "—")}</div></div>
          <div class="kv"><div class="k">Delivered date</div><div class="v">${escapeHtml(formatPaidDate(dealDetails?.delivered_date ?? null) || "—")}</div></div>
          <div class="kv"><div class="k">Shipping cost</div><div class="v">${escapeHtml(dealDetails?.shipping_cost != null ? formatDealMoney(Number(dealDetails.shipping_cost)) : "") || "—"}</div></div>
          <div class="kv"><div class="k">Insurance purchased</div><div class="v">${dealDetails?.insurance_purchased ? "Yes" : "No"}</div></div>
          <div class="kv"><div class="k">Insurance amount</div><div class="v">${escapeHtml(dealDetails?.insurance_amount != null ? formatDealMoney(Number(dealDetails.insurance_amount)) : "") || "—"}</div></div>
          <div class="kv"><div class="k">Signature required</div><div class="v">${dealDetails?.signature_required ? "Yes" : "No"}</div></div>
        </div>
      `
      : "";

    const notesSectionHtml = `
      <div class="section">
        <h2>Notes</h2>
        <div class="kv"><div class="k">Buyer notes</div><div class="v">${escapeHtml(dealDetails?.buyer_notes ?? "") || "—"}</div></div>
        <div class="kv"><div class="k">Seller notes</div><div class="v">${escapeHtml(dealDetails?.seller_notes ?? "") || "—"}</div></div>
        <div class="kv"><div class="k">Condition notes</div><div class="v">${escapeHtml(dealDetails?.condition_notes ?? "") || "—"}</div></div>
        <div class="kv"><div class="k">Included extras</div><div class="v">${escapeHtml(dealDetails?.included_extras ?? "") || "—"}</div></div>
        <div class="kv"><div class="k">Issue reported</div><div class="v">${dealDetails?.issue_reported ? "Yes" : "No"}</div></div>
        <div class="kv"><div class="k">Issue notes</div><div class="v">${escapeHtml(dealDetails?.issue_notes ?? "") || "—"}</div></div>
      </div>
    `;

    const watermarkHtml = params.draft
      ? `<div class="watermark">Draft Record - Payment Not Confirmed</div>`
      : "";

    const disclaimer =
      "CardCat Deal Records are documentation tools only. CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes.";

    const statusText = dealRecordForDisplay.status ? dealRecordStatusLabel(dealRecordForDisplay.status) : "";

    const cardImageHtml = card?.image_url
      ? `<img class="card-img" src="${escapeHtml(driveToImageSrc(card.image_url, { variant: "detail" }))}" alt="Card image" />`
      : `<div class="card-img placeholder"></div>`;

    // Printing-friendly HTML
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(params.title)}</title>
          <style>
            :root { --text: #0f172a; --muted: #475569; --border: #e2e8f0; --bg: #ffffff; --accent: #0f766e; }
            body { margin: 24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background: var(--bg); color: var(--text); }
            .wrap { position: relative; max-width: 920px; }
            .watermark { position: absolute; top: 90px; right: 20px; transform: rotate(10deg); font-size: 22px; font-weight: 800; color: rgba(15, 118, 110, 0.20); border: 2px dashed rgba(15, 118, 110, 0.25); padding: 14px 16px; width: 360px; text-align: center; }
            .header { display:flex; align-items:flex-start; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
            .brand { display:flex; flex-direction: column; }
            .brand .name { font-size: 22px; font-weight: 900; color: var(--accent); line-height: 1.1; }
            .brand .sub { margin-top: 6px; font-size: 14px; color: var(--muted); }
            .meta { text-align: right; font-size: 13px; color: var(--muted); }
            .meta b { color: var(--text); }
            h2 { margin: 18px 0 10px; font-size: 16px; font-weight: 900; }
            .section { border: 1px solid var(--border); border-radius: 12px; padding: 14px 14px; margin-top: 12px; }
            .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .card-block { display:flex; gap: 14px; align-items:flex-start; }
            .card-img { width: 86px; height: 112px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); background: #f8fafc; }
            .kv { display:flex; gap: 12px; margin: 8px 0; }
            .k { width: 190px; color: var(--muted); font-weight: 650; font-size: 13px; }
            .v { flex: 1; font-weight: 600; font-size: 13.5px; }
            .hr { height: 1px; background: var(--border); margin: 16px 0; }
            .list { white-space: pre-line; font-size: 13.5px; color: var(--text); line-height: 1.45; }
            .footer { margin-top: 16px; font-size: 12px; color: var(--muted); }
            .pill { display:inline-block; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border); background: #f8fafc; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="wrap">
            ${watermarkHtml}
            <div class="header">
              <div class="brand">
                <div class="name">CardCat</div>
                <div class="sub">Deal Record</div>
              </div>
              <div class="meta">
                <div><b>Deal ID</b>: ${escapeHtml(dealIdShort)}</div>
                <div><b>Generated</b>: ${escapeHtml(new Date().toLocaleString())}</div>
                <div style="margin-top: 10px;"><span class="pill">${escapeHtml(statusText)}</span></div>
              </div>
            </div>

            <div class="section">
              <h2>Deal Status</h2>
              <div class="kv"><div class="k">Current status</div><div class="v">${escapeHtml(statusText)}</div></div>
            </div>

            <div class="section">
              <h2>Card Information</h2>
              <div class="card-block">
                ${cardImageHtml}
                <div style="flex:1;">
                  <div style="font-size: 18px; font-weight: 900;">${escapeHtml(card?.player_name ?? "Card")}</div>
                  <div style="color: var(--muted); margin-top: 4px;">${escapeHtml([card?.year, card?.brand, card?.set_name].filter(Boolean).join(" ") || "—")}</div>
                  <div style="color: var(--muted); margin-top: 4px;">Parallel: ${escapeHtml(card?.parallel ?? "—")}</div>
                  <div style="color: var(--muted); margin-top: 4px;">Card #: ${escapeHtml(card?.card_number ?? "—")}</div>
                  <div style="margin-top: 10px; font-weight: 900; color: var(--accent);">Asking price: ${escapeHtml(card?.asking_price != null ? formatDealMoney(Number(card.asking_price)) : "—")}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Agreement Details</h2>
              <div class="grid">
                <div class="kv"><div class="k">Deal type</div><div class="v">${escapeHtml(dealRecordForDisplay.deal_type ? String(dealRecordForDisplay.deal_type).replace(/_/g, " ") : "Sale")}</div></div>
                <div class="kv"><div class="k">Currency</div><div class="v">${escapeHtml(dealRecordForDisplay.currency ?? "USD")}</div></div>
              </div>
              <div class="kv"><div class="k">Agreed price</div><div class="v">${escapeHtml(agreedPriceText)}</div></div>
              <div class="kv"><div class="k">Date offer accepted</div><div class="v">${escapeHtml(acceptedAtText)}</div></div>
              <div class="kv"><div class="k">Buyer</div><div class="v">${escapeHtml(buyerHandle)}</div></div>
              <div class="kv"><div class="k">Seller</div><div class="v">${escapeHtml(sellerHandle)}</div></div>
            </div>

            <div class="section">
              <h2>Offer History</h2>
              <div class="list">${escapeHtml(offerLines || "No offers recorded yet.")}</div>
            </div>

            ${paymentSectionHtml}
            ${shippingSectionHtml}
            ${notesSectionHtml}

            <div class="section">
              <h2>Timeline</h2>
              <div class="list">${escapeHtml(timelineLines || "No timeline events recorded yet.")}</div>
            </div>

            <div class="footer">
              <div><b>Generated by CardCat</b> — Exported: ${escapeHtml(new Date().toLocaleString())}</div>
              <div style="margin-top: 10px;">${escapeHtml(disclaimer)}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  function downloadHtmlFile(params: { html: string; filename: string }) {
    const blob = new Blob([params.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = params.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onPreviewDealRecordDraft() {
    if (!dealRecordForDisplay) return;
    const html = buildDealRecordHtml({ draft: true, title: "CardCat Deal Record (Preview Draft)" });
    downloadHtmlFile({ html, filename: `deal_record_${dealRecordForDisplay.id}_draft.html` });
  }

  function onDownloadDealRecord() {
    if (!dealRecordForDisplay) return;
    const html = buildDealRecordHtml({ draft: false, title: "CardCat Deal Record" });
    downloadHtmlFile({ html, filename: `deal_record_${dealRecordForDisplay.id}.html` });
  }

  function onConfirmPaymentReceived() {
    void (async () => {
      if (!dealRecordForDisplay || !user?.id) return;
      if (!supabaseConfigured || !supabase) {
        setDealError("Supabase is not configured.");
        return;
      }
      if (!dealDetails?.paid_date) {
        setDealError("Add payment details first.");
        return;
      }
      if (String(dealRecordForDisplay.seller_user_id) !== String(user.id)) {
        setDealError("Only the seller can confirm payment received.");
        return;
      }
      const paidDate = dealDetails.paid_date;

      setDealActionSaving(true);
      setDealError("");
      try {
        const { error: updateError } = await supabase
          .from("deal_records")
          .update({
            status: "payment_confirmed",
          })
          .eq("id", dealRecordForDisplay.id);

        if (updateError) throw updateError;

        await addDealTimelineEvent({
          dealRecordId: dealRecordForDisplay.id,
          userId: user.id,
          eventType: "payment_confirmed_by_seller",
          title: "Payment confirmed by seller",
          description: `Seller marked payment as received (paid date: ${formatPaidDate(paidDate)}).`,
        });

        setShowPaymentForm(false);
        setDealError("");
        await refreshDeals();
      } catch (e: any) {
        setDealError(e?.message || "Could not confirm payment received.");
      } finally {
        setDealActionSaving(false);
      }
    })();
  }

  async function onSavePaymentDetails() {
    if (!dealRecordForDisplay || !user?.id) return;
    if (!paidDateDraft) {
      setDealError("Paid date is required.");
      return;
    }

    if (!supabaseConfigured || !supabase) {
      setDealError("Supabase is not configured.");
      return;
    }

    setDealActionSaving(true);
    setDealError("");
    try {
      await upsertDealDetailsForDealRecord({
        dealRecordId: dealRecordForDisplay.id,
        details: {
          paid_date: paidDateDraft,
          payment_method_note: paymentMethodNoteDraft.trim() || null,
          payment_reference_note: paymentReferenceNoteDraft.trim() || null,
        },
      });

      const alreadyConfirmed = String(dealRecordForDisplay.status).toLowerCase() === "payment_confirmed";
      if (!alreadyConfirmed) {
        const { error: updateError } = await supabase
          .from("deal_records")
          .update({
            status: "payment_recorded",
          })
          .eq("id", dealRecordForDisplay.id);
        if (updateError) throw updateError;

        await addDealTimelineEvent({
          dealRecordId: dealRecordForDisplay.id,
          userId: user.id,
          eventType: "payment_recorded",
          title: "Payment recorded",
          description: "Payment details were added to this deal record.",
          metadata: { paid_date: paidDateDraft },
        });
      }

      setShowPaymentForm(false);
      setDealError("");
      await refreshDeals();
    } catch (e: any) {
      setDealError(e?.message || "Could not save payment details.");
    } finally {
      setDealActionSaving(false);
    }
  }

  async function onSaveShippingDetails() {
    if (!dealRecordForDisplay || !user?.id) return;
    if (!supabaseConfigured || !supabase) {
      setDealError("Supabase is not configured.");
      return;
    }
    if (!shippingCarrierDraft.trim()) {
      setDealError("Shipping carrier is required.");
      return;
    }
    if (!trackingNumberDraft.trim()) {
      setDealError("Tracking number is required.");
      return;
    }
    if (!shippedDateDraft) {
      setDealError("Shipped date is required.");
      return;
    }

    setDealActionSaving(true);
    setDealError("");
    try {
      await upsertDealDetailsForDealRecord({
        dealRecordId: dealRecordForDisplay.id,
        details: {
          shipping_carrier: shippingCarrierDraft.trim() || null,
          tracking_number: trackingNumberDraft.trim() || null,
          shipped_date: shippedDateDraft || null,
          delivered_date: deliveredDateDraft || null,
          shipping_cost: shippingCostDraft ? Number(shippingCostDraft) : null,
          insurance_purchased: insurancePurchasedDraft,
          insurance_amount: insuranceAmountDraft ? Number(insuranceAmountDraft) : null,
          signature_required: signatureRequiredDraft,
        },
      });

      const { error: updateError } = await supabase
        .from("deal_records")
        .update({
          status: "shipping_entered",
        })
        .eq("id", dealRecordForDisplay.id);
      if (updateError) throw updateError;

      await addDealTimelineEvent({
        dealRecordId: dealRecordForDisplay.id,
        userId: user.id,
        eventType: "shipping_entered",
        title: "Shipping details added",
        description: `Tracking entered by seller: ${trackingNumberDraft.trim()}.`,
      });

      setShowShippingForm(false);
      setDealError("");
      await refreshDeals();
    } catch (e: any) {
      setDealError(e?.message || "Could not save shipping details.");
    } finally {
      setDealActionSaving(false);
    }
  }

  async function onMarkCompleted() {
    if (!dealRecordForDisplay || !user?.id) return;
    if (!supabaseConfigured || !supabase) {
      setDealError("Supabase is not configured.");
      return;
    }
    setCompletedDealLoading(true);
    setDealError("");
    try {
      const { error: updateError } = await supabase
        .from("deal_records")
        .update({ status: "completed" })
        .eq("id", dealRecordForDisplay.id);
      if (updateError) throw updateError;

      await addDealTimelineEvent({
        dealRecordId: dealRecordForDisplay.id,
        userId: user.id,
        eventType: "deal_completed",
        title: "Deal completed",
        description: "Deal was marked as completed.",
      });

      await refreshDeals();
    } catch (e: any) {
      setDealError(e?.message || "Could not mark deal completed.");
    } finally {
      setCompletedDealLoading(false);
    }
  }

  function onAddDealDetails() {
    // Stage routing for the next phase.
    if (!dealRecordForDisplay) return;
    if (paymentConfirmed) {
      setShowShippingForm(true);
      return;
    }
    setShowPaymentForm(true);
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

    console.debug("[DeleteThread] clicked", {
      deleted_thread_id: activeConversationId,
      current_active_thread_id: activeConversationId,
      messageFolder,
    });
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
        setConversationParam("");
        setActiveConversationId(null);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("conversation");
          window.history.replaceState({}, "", url.toString());
        }
      await loadInbox();

      console.debug("[DeleteThread] after loadInbox", {
        deleted_thread_id: activeConversationId,
        // Note: activeConversationId will be updated by effects based on displayConversationViews
      });
      return;
    }

      for (const id of messageIds) {
        const { error: rpcError } = await supabase.rpc("delete_message", {
          p_message_id: id,
        });
        if (rpcError) throw rpcError;
      }

      setSelectedConversationIds([]);
      setConversationParam("");
      setActiveConversationId(null);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("conversation");
        window.history.replaceState({}, "", url.toString());
      }
      await loadInbox();

      console.debug("[DeleteThread] after loadInbox", {
        deleted_thread_id: activeConversationId,
      });
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
      setConversationParam("");
      setActiveConversationId(null);
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
	                  <div className="flex items-start justify-between gap-4">
	                    <div className="flex items-start gap-3 min-w-0">
	                      {activeConversationCard?.image_url ? (
	                        <img
	                          src={driveToImageSrc(activeConversationCard.image_url, { variant: "grid" })}
	                          alt={activeConversationCard.player_name}
	                          className="h-14 w-14 rounded-xl border border-white/10 bg-slate-950/40 object-cover"
	                        />
	                      ) : (
	                        <div className="h-14 w-14 rounded-xl border border-white/10 bg-slate-950/40" />
	                      )}
	                      <div className="min-w-0">
	                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Card</div>
	                        <div className="text-lg font-bold text-white truncate">
	                          {activeConversationCard?.player_name ?? activeConversation?.title ?? activeRecipientLabel}
	                        </div>
	                        <div className="mt-1 text-sm text-slate-300 truncate">
	                          {[activeConversationCard?.year, activeConversationCard?.brand, activeConversationCard?.set_name, activeConversationCard?.parallel]
	                            .filter(Boolean)
	                            .join(" ")}
	                        </div>
	                        <div className="mt-1 text-xs text-slate-400 truncate">Direct conversation with {activeRecipientLabel}</div>
	                      </div>
	                    </div>
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

	                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]">
	                    <div className="flex items-start justify-between gap-3">
	                    <div>
	                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Deal Summary</div>
	                      {dealRecordForDisplay ? (
	                        <>
	                          <div className="mt-1 text-lg font-extrabold text-white">{dealRecordStatusLabel(dealRecordForDisplay.status)}</div>
	                          <div className="mt-2 flex items-baseline gap-3">
	                            <div className="text-2xl font-extrabold text-emerald-200">
	                              {dealRecordForDisplay.agreed_price != null
	                                ? formatDealMoney(Number(dealRecordForDisplay.agreed_price))
	                                : pendingDealOffer?.offer_amount != null
	                                  ? formatDealMoney(Number(pendingDealOffer.offer_amount))
	                                  : latestDealOffer?.offer_amount != null
	                                    ? formatDealMoney(Number(latestDealOffer.offer_amount))
	                                    : "—"}
	                            </div>
	                            {dealRecordForDisplay.agreed_price != null ? (
	                              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/90">Accepted</div>
	                            ) : null}
	                          </div>
	                          <div className="mt-2 text-xs text-slate-300">
	                            Buyer: {profileHandleById(dealRecordForDisplay.buyer_user_id ?? (pendingDealOffer ? computeBuyerSeller(pendingDealOffer.from_user_id, pendingDealOffer.to_user_id).buyerUserId : null))}
	                            &nbsp;•&nbsp; Seller: {profileHandleById(dealRecordForDisplay.seller_user_id ?? (pendingDealOffer ? computeBuyerSeller(pendingDealOffer.from_user_id, pendingDealOffer.to_user_id).sellerUserId : null))}
	                          </div>
	                        </>
	                      ) : (
	                        <div className="mt-1 text-sm font-semibold text-slate-200">Start a deal or make an offer for this card</div>
	                      )}
	                    </div>

	                      {!dealRecordForDisplay ? (
	                        <button
	                          type="button"
	                          disabled={dealActionSaving || !activeConversationContextCardId}
	                          onClick={() => void onCreateDealRecord()}
	                          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                        >
	                          {dealActionSaving ? "Creating…" : "Create Deal Record"}
	                        </button>
	                      ) : null}
	                    </div>

	                    {dealError ? (
	                      <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-xs text-red-100">{dealError}</div>
	                    ) : null}

	                    <div className="mt-3 text-[12px] leading-relaxed text-slate-400">
	                      CardCat Deal Records are documentation tools only. CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes.
	                    </div>

	                    {dealRecordForDisplay ? (
	                      <div className="mt-3 space-y-3">
	                        {dealLoading ? <div className="text-xs text-slate-400">Loading deal…</div> : null}

	                        {pendingDealOffer ? (
	                          pendingDealOffer.to_user_id === user.id ? (
	                            <div className="space-y-2">
	                              <div className="text-xs text-slate-300">
	                                Offer: <span className="font-semibold text-white">{formatDealMoney(Number(pendingDealOffer.offer_amount || 0))}</span>
	                                <span className="text-slate-400"> ({dealOfferStatusLabel(pendingDealOffer.status)})</span>
	                              </div>
	                              {pendingDealOffer.message ? (
	                                <div className="text-xs text-slate-400 whitespace-pre-wrap">{pendingDealOffer.message}</div>
	                              ) : null}

	                              <div className="flex flex-wrap gap-2">
	                                <button
	                                  type="button"
	                                  disabled={dealActionSaving}
	                                  onClick={() => void onAcceptOffer(pendingDealOffer)}
	                                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                                >
	                                  Accept
	                                </button>
	                                <button
	                                  type="button"
	                                  disabled={dealActionSaving}
	                                  onClick={() => void onDeclineOffer(pendingDealOffer)}
	                                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                >
	                                  Decline
	                                </button>
	                              </div>

	                              <div className="mt-2">
	                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Counter</div>
	                                <div className="mt-2 flex flex-wrap items-center gap-2">
	                                  <input
	                                    type="number"
	                                    inputMode="decimal"
	                                    step="0.01"
	                                    value={counterAmountDraft}
	                                    onChange={(e) => setCounterAmountDraft(e.target.value)}
	                                    placeholder="Counter amount"
	                                    className="w-36 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                                  />
	                                  <button
	                                    type="button"
	                                    disabled={dealActionSaving}
	                                    onClick={() => void onCounterOffer(pendingDealOffer)}
	                                    className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-400 disabled:opacity-60"
	                                  >
	                                    Counter
	                                  </button>
	                                </div>
	                              </div>

	                              <div className="pt-1 flex flex-wrap gap-2 items-center">
	                                <button
	                                  type="button"
	                                  disabled={dealActionSaving}
	                                  onClick={onDownloadDealRecordRawData}
	                                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                >
	                                  Download Raw Data
	                                </button>
	                              </div>
	                            </div>
	                          ) : pendingDealOffer.from_user_id === user.id ? (
	                            <div className="space-y-2">
	                              <div className="text-xs text-slate-300">
	                                Offer pending. Waiting for the other user to respond.
	                              </div>
	                              <div className="flex flex-wrap gap-2">
	                                <button
	                                  type="button"
	                                  disabled={dealActionSaving}
	                                  onClick={onDownloadDealRecordRawData}
	                                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                >
	                                  Download Raw Data
	                                </button>
	                              </div>
	                            </div>
	                          ) : (
	                            <div className="text-xs text-slate-300">Another offer is pending. Waiting…</div>
	                          )
	                          ) : ["offer_accepted","payment_recorded","payment_confirmed","shipping_entered","completed"].includes(
	                            String(dealRecordForDisplay.status ?? "").toLowerCase()
	                          ) ? (
	                            <div className="space-y-3">
	                              <div className="text-xs text-slate-300">
	                                {dealCompleted
	                                  ? "Deal completed."
	                                  : paymentConfirmed
	                                    ? "Payment confirmed by seller."
	                                    : paymentRecorded
	                                      ? "Payment details recorded. Waiting for seller confirmation."
	                                      : "Offer accepted. Add payment details to document this deal."}
	                              </div>

	                              {!paymentConfirmed ? (
	                                <div className="flex flex-wrap gap-2">
	                                  <button
	                                    type="button"
	                                    disabled={dealActionSaving}
	                                    onClick={() => setShowPaymentForm(true)}
	                                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/[0.12] disabled:opacity-60"
	                                  >
	                                    {paymentRecorded ? "Edit Payment Details" : "Add Payment Details"}
	                                  </button>
	                                  <button
	                                    type="button"
	                                    disabled={dealActionSaving}
	                                    onClick={onPreviewDealRecordDraft}
	                                    className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                  >
	                                    Preview Deal Record
	                                  </button>

	                                  {paymentRecorded ? (
	                                    <button
	                                      type="button"
	                                      disabled={dealActionSaving || String(dealRecordForDisplay.seller_user_id) !== String(user.id)}
	                                      onClick={() => void onConfirmPaymentReceived()}
	                                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                                    >
	                                      Confirm Payment Received
	                                    </button>
	                                  ) : null}
	                                </div>
	                              ) : (
	                                <div className="flex flex-wrap gap-2">
	                                  {!dealCompleted ? (
	                                    <button
	                                      type="button"
	                                      disabled={dealActionSaving}
	                                      onClick={() => setShowShippingForm(true)}
	                                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/[0.12] disabled:opacity-60"
	                                    >
	                                      Add Shipping Details
	                                    </button>
	                                  ) : null}
	                                  <button
	                                    type="button"
	                                    disabled={dealActionSaving}
	                                    onClick={onDownloadDealRecord}
	                                    className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                                  >
	                                    {dealCompleted ? "Download Final Deal Record" : "Download Deal Record"}
	                                  </button>
	                                </div>
	                              )}

	                              <div>
	                                <button
	                                  type="button"
	                                  disabled={dealActionSaving}
	                                  onClick={onDownloadDealRecordRawData}
	                                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-200"
	                                >
	                                  Download Raw Data (debug)
	                                </button>
	                              </div>

	                              {showPaymentForm && !paymentConfirmed ? (
	                                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
	                                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Payment Details</div>
	                                  <div className="flex flex-wrap gap-2">
	                                    <input
	                                      type="date"
	                                      value={paidDateDraft}
	                                      onChange={(e) => setPaidDateDraft(e.target.value)}
	                                      className="w-44 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
	                                    />
	                                    <input
	                                      value={paymentReferenceNoteDraft}
	                                      onChange={(e) => setPaymentReferenceNoteDraft(e.target.value)}
	                                      placeholder="Payment reference / note"
	                                      className="flex-1 min-w-[220px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                                    />
	                                  </div>
	                                  <textarea
	                                    value={paymentMethodNoteDraft}
	                                    onChange={(e) => setPaymentMethodNoteDraft(e.target.value)}
	                                    placeholder="Payment method note"
	                                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                                  />
	                                  <div className="flex flex-wrap gap-2">
	                                    <button
	                                      type="button"
	                                      disabled={dealActionSaving}
	                                      onClick={() => void onSavePaymentDetails()}
	                                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                                    >
	                                      Save Payment Details
	                                    </button>
	                                    <button
	                                      type="button"
	                                      disabled={dealActionSaving}
	                                      onClick={() => setShowPaymentForm(false)}
	                                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                    >
	                                      Cancel
	                                    </button>
	                                  </div>
	                                </div>
	                              ) : null}

	                              {showShippingForm && paymentConfirmed && !dealCompleted ? (
	                                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
	                                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Shipping Details</div>
	                                  <div className="flex flex-wrap gap-2">
	                                    <input
	                                      value={shippingCarrierDraft}
	                                      onChange={(e) => setShippingCarrierDraft(e.target.value)}
	                                      placeholder="Carrier"
	                                      className="flex-1 min-w-[220px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                                    />
	                                    <input
	                                      value={trackingNumberDraft}
	                                      onChange={(e) => setTrackingNumberDraft(e.target.value)}
	                                      placeholder="Tracking number"
	                                      className="flex-1 min-w-[220px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                                    />
	                                  </div>
	                                  <div className="flex flex-wrap gap-2">
	                                    <input
	                                      type="date"
	                                      value={shippedDateDraft}
	                                      onChange={(e) => setShippedDateDraft(e.target.value)}
	                                      className="w-44 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
	                                    />
	                                    <input
	                                      type="date"
	                                      value={deliveredDateDraft}
	                                      onChange={(e) => setDeliveredDateDraft(e.target.value)}
	                                      className="w-44 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
	                                    />
	                                    <input
	                                      value={shippingCostDraft}
	                                      onChange={(e) => setShippingCostDraft(e.target.value)}
	                                      placeholder="Shipping cost"
	                                      className="w-44 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                                    />
	                                  </div>
	                                  <div className="flex flex-wrap gap-3 items-center text-sm">
	                                    <label className="inline-flex items-center gap-2 text-slate-300">
	                                      <input type="checkbox" checked={insurancePurchasedDraft} onChange={(e) => setInsurancePurchasedDraft(e.target.checked)} />
	                                      Insurance purchased
	                                    </label>
	                                    <input
	                                      value={insuranceAmountDraft}
	                                      onChange={(e) => setInsuranceAmountDraft(e.target.value)}
	                                      placeholder="Insurance amount"
	                                      disabled={!insurancePurchasedDraft}
	                                      className="w-44 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none disabled:opacity-50 placeholder:text-slate-500"
	                                    />
	                                    <label className="inline-flex items-center gap-2 text-slate-300">
	                                      <input type="checkbox" checked={signatureRequiredDraft} onChange={(e) => setSignatureRequiredDraft(e.target.checked)} />
	                                      Signature required
	                                    </label>
	                                  </div>
	                                  <div className="flex flex-wrap gap-2">
	                                    <button
	                                      type="button"
	                                      disabled={dealActionSaving}
	                                      onClick={() => void onSaveShippingDetails()}
	                                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                                    >
	                                      Save Shipping Details
	                                    </button>
	                                    <button
	                                      type="button"
	                                      disabled={dealActionSaving}
	                                      onClick={() => setShowShippingForm(false)}
	                                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                    >
	                                      Cancel
	                                    </button>
	                                  </div>
	                                </div>
	                              ) : null}

	                              {!dealCompleted && paymentConfirmed && shippingRecorded ? (
	                                <div className="pt-1">
	                                  <button
	                                    type="button"
	                                    disabled={completedDealLoading || dealActionSaving}
	                                    onClick={() => void onMarkCompleted()}
	                                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
	                                  >
	                                    {completedDealLoading ? "Marking…" : "Mark Completed"}
	                                  </button>
	                                </div>
	                              ) : null}
	                            </div>
	                          ) : (
	                          <div className="space-y-2">
	                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Make an offer on this card</div>
	                            {latestDealOffer?.offer_amount != null ? (
	                              <div className="text-xs text-slate-500">
	                                Last offer: {formatDealMoney(Number(latestDealOffer.offer_amount))} ({dealOfferStatusLabel(latestDealOffer.status)})
	                              </div>
	                            ) : null}
	                            <div className="flex flex-wrap items-center gap-2">
	                              <input
	                                type="number"
	                                inputMode="decimal"
	                                step="0.01"
	                                value={offerAmountDraft}
	                                onChange={(e) => setOfferAmountDraft(e.target.value)}
	                                placeholder="Amount"
	                                className="w-36 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                              />
	                              <button
	                                type="button"
	                                disabled={dealActionSaving}
	                                onClick={() => void onMakeOffer()}
	                                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
	                              >
	                                {dealActionSaving ? "Sending…" : "Send offer"}
	                              </button>
	                            </div>
	                            <textarea
	                              value={offerMessageDraft}
	                              onChange={(e) => setOfferMessageDraft(e.target.value)}
	                              placeholder="Optional note to include with the offer"
	                              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
	                            />
	                          </div>
	                        )}

	                        <div className="pt-2 border-t border-white/10">
	                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Timeline</div>
	                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
	                            {dealMiniTimeline.length === 0 ? (
	                              <span>No deal activity yet.</span>
	                            ) : null}
	                            {dealMiniTimeline.map((item, idx) => (
	                              <div key={`${item.label}-${idx}`} className="flex items-baseline gap-2">
	                                <span className="font-semibold text-white">{item.label}</span>
	                                {item.detail ? <span className="text-emerald-200">{item.detail}</span> : null}
	                                {item.time ? <span className="text-slate-500">{item.time}</span> : null}
	                              </div>
	                            ))}
	                          </div>
	                        </div>
	                      </div>
	                    ) : null}
	                  </div>
	                </div>

	                <div className="my-4 border-t border-white/10" />

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
	                            className={`rounded-2xl border border-white/10 p-4 ${mine ? "border-emerald-500/20 bg-emerald-500/[0.05] ml-auto max-w-[80%]" : "bg-slate-950/20 mr-auto max-w-[80%]"}`}
	                          >
	                            <div className="flex items-start justify-between gap-3">
	                              <div className="min-w-0">
	                                <div className={`text-xs font-semibold ${mine ? "text-emerald-100" : "text-slate-300"}`}>
	                                  {mine ? "You" : senderLabel}
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
