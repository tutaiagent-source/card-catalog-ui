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

function cleanEnv(v: string | undefined) {
  const t = String(v ?? "").trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function buildCardTitle(card: any) {
  const titleParts = [card.year, card.player_name, card.brand, card.set_name, card.parallel]
    .map((p: any) => String(p ?? "").trim())
    .filter(Boolean);
  return titleParts.join(" ");
}

async function ensureEbayAccessToken({
  supabaseAdmin,
  userId,
}: {
  supabaseAdmin: any;
  userId: string;
}) {
  const tokenUrl =
    cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL) || "https://api.ebay.com/identity/v1/oauth2/token";
  const clientId = cleanEnv(process.env.EBAY_OAUTH_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.EBAY_OAUTH_CLIENT_SECRET);

  if (!clientId || !clientSecret) return { accessToken: null as string | null, scopes: null as string | null };

  const { data: account, error } = await supabaseAdmin
    .from("ebay_accounts")
    .select("refresh_token, access_token, token_expires_at, scopes")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !account) return { accessToken: null as string | null, scopes: null as string | null };

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : null;
  const hasFreshAccess =
    account.access_token && expiresAt != null && expiresAt - Date.now() > 60 * 1000;

  if (hasFreshAccess) {
    return { accessToken: String(account.access_token), scopes: account.scopes ? String(account.scopes) : null };
  }

  const refreshToken = account.refresh_token;
  if (!refreshToken) return { accessToken: null as string | null, scopes: account.scopes ? String(account.scopes) : null };

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: String(refreshToken),
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basicAuth}`,
    },
    body,
  });

  const tokenJson: any = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !tokenJson?.access_token) {
    return { accessToken: null as string | null, scopes: account.scopes ? String(account.scopes) : null, error: tokenJson };
  }

  const newRefresh = tokenJson?.refresh_token || refreshToken;
  const updated = await supabaseAdmin
    .from("ebay_accounts")
    .update({
      access_token: tokenJson.access_token,
      refresh_token: newRefresh,
      token_expires_at: tokenJson?.expires_in
        ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString()
        : null,
      scopes: tokenJson?.scope || account.scopes || null,
    })
    .eq("user_id", userId);

  if (updated?.error) {
    // even if update fails, we can still attempt to create the draft
  }

  return { accessToken: String(tokenJson.access_token), scopes: tokenJson?.scope ? String(tokenJson.scope) : (account.scopes ? String(account.scopes) : null) };
}

async function createEbayDraftFromCard({
  ebayAccessToken,
  tokenScopes,
  listingType,
  auctionDurationDays,
  startPrice,
  card,
}: {
  ebayAccessToken: string;
  tokenScopes?: string | null;
  listingType: string;
  auctionDurationDays: number;
  startPrice: number | null;
  card: any;
}) {
  // IMPORTANT: Inventory API flow (unpublished offer / draft-like object)
  // Do NOT call /sell/inventory/v1/drafts (not a valid endpoint in our setup).

  const tokenUrl = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL);
  const apiOrigin = tokenUrl ? new URL(tokenUrl).origin : "https://api.ebay.com";

  const marketplaceId = cleanEnv(process.env.EBAY_SELL_MARKETPLACE_ID) || "EBAY_US";
  const categoryId = cleanEnv(process.env.EBAY_SELL_CATEGORY_ID) || "261328";

  const gradedConditionId = cleanEnv(process.env.EBAY_SELL_CONDITION_ID_GRADED) || "2750";
  const ungradedConditionId = cleanEnv(process.env.EBAY_SELL_CONDITION_ID_UNGRADED) || "4000";

  const isGraded = card?.graded === true;
  const conditionId = isGraded ? gradedConditionId : ungradedConditionId;

  const listingDuration = listingType === "auction" ? `DAYS_${Number(auctionDurationDays)}` : "GTC";

  const title = buildCardTitle(card);
  const description = buildEbaySellPrefillText(card);

  const rawAspects: Record<string, any> = {
    Sport: card.sport,
    "Player/Athlete": card.player_name,
    Manufacturer: card.brand,
    Set: card.set_name,
    Season: card.year,
    Team: card.team,
    "Card Number": card.card_number || card.serial_number_text,
    "Parallel/Variety": card.parallel,
  };

  const cleanEbayAspects = (raw: Record<string, any>) => {
    const cleaned: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(raw || {})) {
      if (!k) continue;
      if (v === null || v === undefined) continue;

      const values = Array.isArray(v) ? v : [v];
      const stringValues = values
        .map((x) => {
          if (x === null || x === undefined) return "";
          if (typeof x === "object") return "";
          return String(x).trim();
        })
        .filter(Boolean);

      if (stringValues.length) cleaned[k] = stringValues;
    }
    return cleaned;
  };

  const cleanedAspects = cleanEbayAspects(rawAspects);
  const images = [card.image_url, card.back_image_url].filter(Boolean);

  const conditionEnum = isGraded ? "LIKE_NEW" : "USED_VERY_GOOD";

  const conditionDescriptors: any[] = [];
  if (isGraded) {
    // Graded: professional grader + grade (cert number optional)
    const grader = String(card?.grading_company || "").trim();
    const grade = card?.grade != null ? String(card.grade).trim() : "";
    const cert = String(card?.grading_cert_number_text || "").trim();

    if (grader) conditionDescriptors.push({ descriptorName: "Professional Grader", descriptorValue: grader });
    if (grade) conditionDescriptors.push({ descriptorName: "Grade", descriptorValue: grade });
    if (cert) conditionDescriptors.push({ descriptorName: "Certification Number", descriptorValue: cert });
  } else {
    // Ungraded: card condition required
    conditionDescriptors.push({ descriptorName: "Card Condition", descriptorValue: "Near Mint or better" });
  }

  const env = tokenUrl?.includes("sandbox") ? "sandbox" : "production";

  // Debug snapshot (no secrets/tokens)
  const requestSnapshot: any = {
    marketplaceId,
    format: listingType === "auction" ? "AUCTION" : "FIXED_PRICE",
    categoryId,
    conditionEnum,
    // Keep conceptual mapping for our UI even though the API wants enums.
    legacyConditionId: conditionId,
    startPrice,
    availableQuantity: Number(card.quantity || 1),
    listingDuration,
    listingType,
    env,
    tokenScopes: tokenScopes ? String(tokenScopes).slice(0, 500) : null,
    hasSellInventoryScope: Boolean(
      tokenScopes && String(tokenScopes).includes("/sell.inventory")
    ),
    endpoints: null,
    methods: null,
  };

  if (startPrice == null) {
    return {
      draftUrl: null as string | null,
      draftId: null as string | null,
      error: { status: 400, response: { errors: [{ message: "Missing start price" }] }, requestSnapshot },
    };
  }

  const sku = String(card.id || Date.now());
  const availableQty = Number(card.quantity || 1);

  // 1) Create inventory item (PUT inventory_item/{sku})
  const inventoryItemUrl = `${apiOrigin}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`;

  requestSnapshot.endpoints = {
    inventoryItem: inventoryItemUrl,
    offer: null,
  };
  requestSnapshot.methods = {
    inventoryItem: "PUT",
    offer: "POST",
  };

  const inventoryItemPayload: any = {
    sku,
    condition: conditionEnum,
    conditionDescriptors,
    availability: {
      shipToLocationAvailability: {
        quantity: availableQty,
      },
    },
    product: {
      title,
      description,
      imageUrls: images,
      aspects: cleanedAspects,
    },
  };

  requestSnapshot.inventoryItemPayload = {
    sku,
    condition: inventoryItemPayload.condition,
    conditionDescriptors: conditionDescriptors?.slice?.(0, 5) || conditionDescriptors,
    availabilityQuantity: inventoryItemPayload.availability?.shipToLocationAvailability?.quantity,
    product: {
      title,
      descriptionLength: String(description || "").length,
      imageUrlsCount: images.length,
      aspects: cleanedAspects,
    },
  };

  const itemRes = await fetch(inventoryItemUrl, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${ebayAccessToken}`,
      "content-type": "application/json",
      "content-language": "en-US",
      accept: "application/json",
      "accept-language": "en-US",
    },
    body: JSON.stringify(inventoryItemPayload),
  });

  const itemJson: any = await itemRes.json().catch(() => null);
  if (!itemRes.ok) {
    return {
      draftUrl: null as string | null,
      draftId: null as string | null,
      error: {
        status: itemRes.status,
        response: itemJson,
        requestSnapshot,
        attemptedUrls: [inventoryItemUrl],
      },
    };
  }

  const inventoryItemId = itemJson?.inventoryItemId || itemJson?.id || null;

  // 2) Create offer (unpublished)
  const offerUrl = `${apiOrigin}/sell/inventory/v1/offer`;

  requestSnapshot.endpoints.offer = offerUrl;

  const offerPayload: any = {
    sku,
    marketplaceId,
    format: listingType === "auction" ? "AUCTION" : "FIXED_PRICE",
    availableQuantity: availableQty,
    categoryId,
    listingDescription: {
      title,
      description,
    },
    listingDuration,
    pricingSummary:
      listingType === "auction"
        ? {
            auctionStartPrice: {
              value: String(startPrice),
              currency: "USD",
            },
          }
        : {
            price: {
              value: String(startPrice),
              currency: "USD",
            },
          },
  };

  requestSnapshot.offerPayload = {
    sku,
    marketplaceId,
    format: offerPayload.format,
    categoryId,
    listingDuration: offerPayload.listingDuration,
    pricingSummary: offerPayload.pricingSummary,
    availableQuantity: offerPayload.availableQuantity,
    listingDescriptionLength: String(description || "").length,
  };

  const offerRes = await fetch(offerUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ebayAccessToken}`,
      "content-type": "application/json",
      "content-language": "en-US",
      accept: "application/json",
      "accept-language": "en-US",
    },
    body: JSON.stringify(offerPayload),
  });

  const offerJson: any = await offerRes.json().catch(() => null);
  if (!offerRes.ok) {
    return {
      draftUrl: null as string | null,
      draftId: null as string | null,
      error: {
        status: offerRes.status,
        response: offerJson,
        requestSnapshot,
        attemptedUrls: [offerUrl],
        // inventoryItemId is optional; endpoint may link by sku.
      },
    };
  }

  const offerId = offerJson?.offerId || offerJson?.id || null;
  const draftUrl = offerId
    ? `https://www.ebay.com/lstng?offerId=${encodeURIComponent(String(offerId))}&mode=AddItem`
    : null;

  return { draftUrl, draftId: offerId, error: null };
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
        "id, user_id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, team, sport, competition, rookie, is_autograph, has_memorabilia, graded, grade, grading_company, image_url, back_image_url, asking_price, estimated_price, notes, quantity"
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

    // Messaging integration (while OAuth is pending):
    // If there’s an existing direct conversation for this card where the seller is a participant,
    // drop a system-like update message so the buyer sees it in Messages.
    const stagedDraftId = stagedDraft?.id ? String(stagedDraft.id) : null;
    if (stagedDraftId) {
      const existing = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("sender_user_id", userId)
        .ilike("body", `%${stagedDraftId}%`)
        .limit(1);

      const alreadySent = Boolean(existing?.data?.length);

      if (!alreadySent) {
        const { data: cpRows } = await supabaseAdmin
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", userId);

        const conversationIds = Array.from(new Set((cpRows ?? []).map((r: any) => String(r.conversation_id || "")).filter(Boolean)));

        if (conversationIds.length) {
          const { data: convRows } = await supabaseAdmin
            .from("conversations")
            .select("id")
            .in("id", conversationIds)
            .eq("conversation_type", "direct")
            .eq("context_card_id", cardId);

          const directConversationIds = Array.from(new Set((convRows ?? []).map((r: any) => String(r.id || "")).filter(Boolean)));

          if (directConversationIds.length) {
            const durationPart =
              stagedSummary.listingType === "auction" && stagedSummary.auctionDurationDays
                ? `Auction · ${stagedSummary.auctionDurationDays} days`
                : stagedSummary.listingType === "fixed"
                  ? "Fixed price"
                  : "";
            const pricePart = stagedSummary.startPrice != null ? ` · ${formatMoney(Number(stagedSummary.startPrice))}` : "";
            const body = `eBay draft staged (id: ${stagedDraftId}): ${durationPart}${pricePart}`.trim();

            if (body.length <= 5000) {
              await supabaseAdmin.from("messages").insert(
                directConversationIds.map((cid: string) => ({
                  conversation_id: cid,
                  sender_user_id: userId,
                  body,
                }))
              );
            }
          }
        }
      }
    }

    // Optionally provide a connect URL if OAuth is configured.
    let connectUrl: string | null = null;
    const canOAuth = Boolean(process.env.EBAY_OAUTH_CLIENT_ID && process.env.EBAY_OAUTH_CLIENT_SECRET && process.env.EBAY_OAUTH_SCOPES);

    // If connected, attempt to create an actual eBay listing draft and return its URL.
    let fallbackSellUrl: string = "https://www.ebay.com/sl/sell";
    let draftCreateError: any = null;
  if (connected && canOAuth && process.env.NEXT_PUBLIC_APP_ORIGIN) {
      try {
    const { accessToken, scopes: tokenScopes } = await ensureEbayAccessToken({ supabaseAdmin, userId });
    if (accessToken) {
      const startPriceRaw = card.asking_price ?? card.estimated_price;
      const startPrice = startPriceRaw != null && Number.isFinite(Number(startPriceRaw)) ? Number(startPriceRaw) : null;

      // eBay Sell Inventory draft creation typically requires a price.
      // If we don't have one, fall back to the manual flow.
      if (startPrice == null) {
        draftCreateError = { status: 400, response: { errors: [{ message: "Missing start price (asking_price/estimated_price)" }] } };
      } else {

          const { draftUrl, draftId, error } = await createEbayDraftFromCard({
            ebayAccessToken: accessToken,
            tokenScopes,
            listingType,
            auctionDurationDays,
            startPrice,
            card,
          });

          if (draftUrl && draftId) {
            fallbackSellUrl = draftUrl;
            if (stagedDraft?.id) {
              await supabaseAdmin
                .from("ebay_listing_drafts")
                .update({
                  status: "submitted",
                  ebay_draft_id: String(draftId),
                  draft_url: draftUrl,
                  error_message: null,
                })
                .eq("id", stagedDraft.id);
            }
          } else if (error && stagedDraft?.id) {
            draftCreateError = error;
            await supabaseAdmin
              .from("ebay_listing_drafts")
              .update({
                status: "error",
                error_message: typeof error === "string" ? error : JSON.stringify(error).slice(0, 4000),
              })
              .eq("id", stagedDraft.id);
          } else if (error) {
            draftCreateError = error;
          }
      }
        }
      } catch (e: any) {
        // Keep manual flow if draft creation fails.
      }
    }

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
      fallbackSellUrl,
      draftCreateError,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
