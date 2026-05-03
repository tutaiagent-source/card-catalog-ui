import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function buildEbaySellPrefillText(card: any) {
  const titleParts = [card.year, card.player_name, card.brand, card.set_name, card.parallel]
    .map((p: any) => String(p ?? "").trim())
    .filter(Boolean);

  const startPriceRaw = card.asking_price ?? card.estimated_price;
  const price = startPriceRaw != null ? formatMoney(Number(startPriceRaw)) : "";

  const lines: string[] = [];
  lines.push(`Title: ${titleParts.join(" ")}`);
  if (price) lines.push(`Price (starting): ${price}`);
  if (card.card_number) lines.push(`Card #: ${card.card_number}`);
  if (card.serial_number_text) lines.push(`Serial: ${card.serial_number_text}`);
  if (card.competition) lines.push(`Competition: ${card.competition}`);
  if (card.team) lines.push(`Team: ${card.team}`);
  if (card.sport) lines.push(`Sport/Category: ${card.sport}`);
  if (card.parallel) lines.push(`Parallel: ${card.parallel}`);

  if (card.image_url || card.back_image_url) {
    lines.push("Image URLs:");
    if (card.image_url) lines.push(`- ${card.image_url}`);
    if (card.back_image_url) lines.push(`- ${card.back_image_url}`);
  }

  return lines.join("\n");
}

function buildStagedSummary(card: any, listingType: string, auctionDurationDays: number) {
  const startPriceRaw = card.asking_price ?? card.estimated_price;
  const startPrice = startPriceRaw != null && Number.isFinite(Number(startPriceRaw)) ? Number(startPriceRaw) : null;

  return {
    listingType,
    auctionDurationDays: listingType === "auction" ? auctionDurationDays : null,
    startPrice,
    currency: "USD",
  };
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.user.id;

    const body = await req.json();
    const cardId = String(body?.cardId || "");
    const listingType = body?.listingType === "fixed" ? "fixed" : "auction";
    const auctionDurationDays = Number(body?.auctionDurationDays || 7);

    if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

    const { data: account } = await supabaseAdmin
      .from("ebay_accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const connected = Boolean(account);

    // Load the card so we can build a draft payload.
    const { data: card, error: cardErr } = await supabaseAdmin
      .from("cards")
      .select(
        "id, user_id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, team, sport, competition, rookie, is_autograph, has_memorabilia, graded, grade, grading_company, image_url, back_image_url, asking_price, estimated_price, notes"
      )
      .eq("id", cardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (cardErr) return NextResponse.json({ error: cardErr.message }, { status: 500 });
    if (!card) return NextResponse.json({ error: "Card not found or not owned" }, { status: 404 });

    const prefillText = buildEbaySellPrefillText(card);
    const stagedSummary = buildStagedSummary(card, listingType, auctionDurationDays);

    const { data: stagedDraft, error: draftErr } = await supabaseAdmin
      .from("ebay_listing_drafts")
      .insert({
      user_id: userId,
      card_id: cardId,
      listing_type: listingType,
      auction_duration_days: listingType === "auction" ? auctionDurationDays : null,
      start_price: stagedSummary.startPrice,
      status: "staged",
      draft_url: null,
      card_snapshot: {
        card,
        prefillText,
        stagedSummary,
        imageUrls: [card.image_url, card.back_image_url].filter(Boolean),
      },
    })
      .select("id")
      .maybeSingle();

    if (draftErr) {
      // Still allow the user to proceed even if staging persistence fails.
      return NextResponse.json({
        connected,
        connectedRequired: false,
        stagedDraftId: null,
        stagedSummary,
        prefillText,
        fallbackSellUrl: "https://www.ebay.com/sl/sell",
        stagingError: draftErr.message,
      });
    }

    // Optionally provide a connect URL if OAuth is configured.
    let connectUrl: string | null = null;
    const canOAuth = Boolean(process.env.EBAY_OAUTH_CLIENT_ID && process.env.EBAY_OAUTH_CLIENT_SECRET && process.env.EBAY_OAUTH_SCOPES);
    if (!connected && canOAuth && process.env.NEXT_PUBLIC_APP_ORIGIN) {
      try {
        const startRes = await fetch(`${process.env.NEXT_PUBLIC_APP_ORIGIN}/api/ebay/oauth/start`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (startRes.ok) {
          const startJson: any = await startRes.json();
          connectUrl = startJson?.redirectUrl || null;
        }
      } catch {
        connectUrl = null;
      }
    }

    return NextResponse.json({
      ok: true,
      connected,
      connectUrl,
      stagedDraftId: stagedDraft?.id || null,
      stagedSummary,
      prefillText,
      fallbackSellUrl: "https://www.ebay.com/sl/sell",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
