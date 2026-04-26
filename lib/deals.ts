import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

export type DealRecordRow = {
  id: string;
  conversation_id: string;
  card_id?: string | null;
  buyer_user_id?: string | null;
  seller_user_id?: string | null;
  created_by_user_id: string;
  deal_type: string;
  status: string;
  agreed_price?: number | null;
  trade_value?: number | null;
  currency: string;
  accepted_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type DealOfferRow = {
  id: string;
  deal_record_id: string;
  from_user_id: string;
  to_user_id: string;
  offer_amount?: number | null;
  currency?: string;
  trade_notes?: string | null;
  message?: string | null;
  status: string;
  expires_at?: string | null;
  responded_at?: string | null;
  created_at: string;
};

export type DealTimelineEventRow = {
  id: string;
  deal_record_id: string;
  user_id: string;
  event_type: string;
  title: string;
  description?: string | null;
  metadata_json?: any;
  created_at: string;
};

export type DealDetailsUpsert = Partial<{
  payment_method_note: string | null;
  paid_date: string | null;
  payment_reference_note: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  shipping_cost: number | null;
  insurance_purchased: boolean | null;
  insurance_amount: number | null;
  signature_required: boolean | null;
  condition_notes: string | null;
  card_serial_number: string | null;
  card_grade: string | null;
  included_extras: string | null;
  buyer_notes: string | null;
  seller_notes: string | null;
  issue_reported: boolean | null;
  issue_notes: string | null;
  final_status: string | null;
}>;

export async function loadDealRecordsForConversation(conversationId: string, cardId?: string | null) {
  if (!supabaseConfigured || !supabase) return [] as DealRecordRow[];

  let query = supabase
    .from("deal_records")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (cardId) {
    query = query.eq("card_id", cardId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as DealRecordRow[];
}

export async function loadDealOffersForDealRecord(dealRecordId: string) {
  if (!supabaseConfigured || !supabase) return [] as DealOfferRow[];

  const { data, error } = await supabase
    .from("deal_offers")
    .select("*")
    .eq("deal_record_id", dealRecordId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? []) as DealOfferRow[];
}

export async function createDealRecord(params: {
  conversationId: string;
  cardId?: string | null;
  dealType?: string;
  createdByUserId: string;
}) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  const { conversationId, cardId, dealType, createdByUserId } = params;

  const { data, error } = await supabase
    .from("deal_records")
    .insert({
      conversation_id: conversationId,
      card_id: cardId ?? null,
      created_by_user_id: createdByUserId,
      deal_type: dealType ?? "sale",
      status: "draft",
      currency: "USD",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DealRecordRow;
}

export async function createDealOffer(params: {
  dealRecordId: string;
  fromUserId: string;
  toUserId: string;
  offerAmount: number;
  message?: string | null;
  tradeNotes?: string | null;
  currency?: string;
}) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("deal_offers")
    .insert({
      deal_record_id: params.dealRecordId,
      from_user_id: params.fromUserId,
      to_user_id: params.toUserId,
      offer_amount: params.offerAmount,
      currency: params.currency ?? "USD",
      message: params.message ?? null,
      trade_notes: params.tradeNotes ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DealOfferRow;
}

export async function respondToDealOffer(params: {
  offerId: string;
  actorUserId: string;
  responseStatus: "accepted" | "declined" | "countered";
  respondedAtIso?: string;
  counterOfferAmount?: number;
}) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  // We keep this client-side for phase 2. RLS ensures only participants can update.
  const { error } = await supabase
    .from("deal_offers")
    .update({
      status: params.responseStatus,
      responded_at: params.respondedAtIso ?? new Date().toISOString(),
    })
    .eq("id", params.offerId);

  if (error) throw error;
}

export async function addDealTimelineEvent(params: {
  dealRecordId: string;
  userId: string;
  eventType: string;
  title: string;
  description?: string | null;
  metadata?: any;
}) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("deal_timeline_events")
    .insert({
      deal_record_id: params.dealRecordId,
      user_id: params.userId,
      event_type: params.eventType,
      title: params.title,
      description: params.description ?? null,
      metadata_json: params.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DealTimelineEventRow;
}
