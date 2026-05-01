import { NextResponse } from "next/server";

import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";

export async function POST(req: Request) {
  try {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const buyerUserId = authUser.user.id;

    const body = await req.json().catch(() => ({}));
    const cardIdsRaw = Array.isArray(body?.card_ids) ? body.card_ids : [];
    const cardIds = cardIdsRaw.map((x: any) => String(x)).filter(Boolean);

    const offerAmount = Number(body?.offer_amount);
    const note = body?.note ? String(body.note) : null;

    if (cardIds.length < 2) {
      return NextResponse.json({ error: "Select at least 2 cards" }, { status: 400 });
    }
    if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
      return NextResponse.json({ error: "Enter a valid offer amount" }, { status: 400 });
    }

    // Load cards and validate availability.
    const { data: cards, error: cardsErr } = await supabaseAdmin
      .from("cards")
      .select(
        "id, user_id, player_name, year, brand, set_name, parallel, card_number, team, sport, competition, serial_number_text, image_url, back_image_url, asking_price, status"
      )
      .in("id", cardIds);

    if (cardsErr) {
      return NextResponse.json({ error: cardsErr.message }, { status: 500 });
    }

    const foundUnordered = (cards ?? []) as any[];
    if (foundUnordered.length !== cardIds.length) {
      return NextResponse.json({ error: "One or more selected cards no longer exist" }, { status: 400 });
    }

    const foundById = new Map<string, any>(foundUnordered.map((c: any) => [String(c.id), c]));
    const found = cardIds
      .map((id: string) => foundById.get(id))
      .filter(Boolean) as any[];

    const sellerUserId = String(found[0]?.user_id ?? "");
    if (!sellerUserId) {
      return NextResponse.json({ error: "Could not determine seller" }, { status: 400 });
    }
    if (sellerUserId === buyerUserId) {
      return NextResponse.json({ error: "You can’t bundle your own cards" }, { status: 400 });
    }

    for (const c of found) {
      if (String(c.user_id) !== sellerUserId) {
        return NextResponse.json({ error: "Bundled offers can only include cards from one seller" }, { status: 400 });
      }
      if (String(c.status || "").toLowerCase() !== "listed") {
        return NextResponse.json({ error: "One or more selected cards are no longer available" }, { status: 400 });
      }
      const ask = Number(c.asking_price);
      if (!Number.isFinite(ask) || ask <= 0) {
        return NextResponse.json({ error: "One or more selected cards are missing a valid asking price" }, { status: 400 });
      }
    }

    const primaryCardId = String(cardIds[0]);

    // Seller profile (for summary text)
    const { data: sellerProfile, error: sellerErr } = await supabaseAdmin
      .from("profiles")
      .select("username, shop_name")
      .eq("id", sellerUserId)
      .maybeSingle();

    if (sellerErr || !sellerProfile?.username) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 500 });
    }

    const sellerUsername = String(sellerProfile.username);
    const sellerShopName = sellerProfile.shop_name ? String(sellerProfile.shop_name) : null;

    // Find existing direct conversation between buyer and seller.
    const { data: buyerParts, error: buyerPartsErr } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", buyerUserId);

    if (buyerPartsErr) {
      return NextResponse.json({ error: buyerPartsErr.message }, { status: 500 });
    }

    const buyerConversationIds = Array.from(
      new Set((buyerParts ?? []).map((p: any) => String(p.conversation_id)))
    );

    const intersection = new Set<string>();
    if (buyerConversationIds.length > 0) {
      const { data: sellerParts, error: sellerPartsErr } = await supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", sellerUserId)
        .in("conversation_id", buyerConversationIds);

      if (sellerPartsErr) {
        return NextResponse.json({ error: sellerPartsErr.message }, { status: 500 });
      }

      for (const p of (sellerParts ?? []) as any[]) {
        intersection.add(String(p.conversation_id));
      }
    }

    let conversationId: string;
    if (intersection.size > 0) {
      const { data: convoRows, error: convoErr } = await supabaseAdmin
        .from("conversations")
        .select("id, context_card_id, last_message_at")
        .eq("conversation_type", "direct")
        .in("id", Array.from(intersection));

      if (convoErr) {
        return NextResponse.json({ error: convoErr.message }, { status: 500 });
      }

      const directConvos = (convoRows ?? []) as any[];
      directConvos.sort((a, b) =>
        String(b.last_message_at || "").localeCompare(String(a.last_message_at || ""))
      );

      conversationId = String(directConvos[0].id);

      // Best-effort: ensure context_card_id is set.
      if (!directConvos[0].context_card_id) {
        const { error: ctxErr } = await supabaseAdmin
          .from("conversations")
          .update({ context_card_id: primaryCardId })
          .eq("id", conversationId);

        if (ctxErr) {
          // Non-fatal.
        }
      }
    } else {
      const { data: newConvo, error: newConvoErr } = await supabaseAdmin
        .from("conversations")
        .insert({ conversation_type: "direct", created_by: buyerUserId, context_card_id: primaryCardId })
        .select("id")
        .single();

      if (newConvoErr || !newConvo?.id) {
        return NextResponse.json({ error: newConvoErr?.message || "Could not create conversation" }, { status: 500 });
      }

      conversationId = String(newConvo.id);

      const { error: participantsErr } = await supabaseAdmin
        .from("conversation_participants")
        .insert([
          { conversation_id: conversationId, user_id: buyerUserId },
          { conversation_id: conversationId, user_id: sellerUserId },
        ]);

      if (participantsErr) {
        return NextResponse.json({ error: participantsErr.message }, { status: 500 });
      }
    }

    // Create bundle deal record (single negotiation thread)
    const { data: deal, error: dealErr } = await supabaseAdmin
      .from("deal_records")
      .insert({
        conversation_id: conversationId,
        card_id: primaryCardId,
        created_by_user_id: buyerUserId,
        deal_type: "bundle_sale",
        status: "offer_pending",
        agreed_price: null,
        buyer_user_id: buyerUserId,
        seller_user_id: sellerUserId,
        currency: "USD",
      })
      .select("*")
      .single();

    if (dealErr || !deal?.id) {
      return NextResponse.json(
        { error: dealErr?.message || "Could not create deal record" },
        { status: 500 }
      );
    }

    const dealRecordId = String(deal.id);

    // Create pending offer
    const { error: offerErr } = await supabaseAdmin.from("deal_offers").insert({
      deal_record_id: dealRecordId,
      from_user_id: buyerUserId,
      to_user_id: sellerUserId,
      offer_amount: offerAmount,
      currency: "USD",
      message: note,
      status: "pending",
    });

    if (offerErr) {
      return NextResponse.json({ error: offerErr.message }, { status: 500 });
    }

    // Create bundle items + snapshots
    const bundleItems = found.map((c: any) => {
      const snap = {
        player_name: c.player_name,
        year: c.year,
        brand: c.brand,
        set_name: c.set_name,
        parallel: c.parallel,
        card_number: c.card_number,
        team: c.team,
        sport: c.sport,
        competition: c.competition,
        serial_number_text: c.serial_number_text,
        image_url: c.image_url,
        back_image_url: c.back_image_url,
        asking_price: Number(c.asking_price),
      };

      return {
        deal_record_id: dealRecordId,
        card_id: String(c.id),
        seller_user_id: sellerUserId,
        asking_price_at_offer: Number(c.asking_price),
        card_snapshot_json: snap,
      };
    });

    const { error: itemsErr } = await supabaseAdmin.from("bundle_deal_items").insert(bundleItems);
    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    // Post a summary message into the conversation
    const sellerLabel = sellerShopName || sellerUsername;
    const summary = `Bundled offer sent: $${offerAmount} for ${bundleItems.length} cards to ${sellerLabel}.`;

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_user_id: buyerUserId,
      body: summary,
    });

    return NextResponse.json({ ok: true, conversation_id: conversationId, deal_record_id: dealRecordId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
