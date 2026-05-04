import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";

function cleanEnv(v: string | undefined) {
  const t = String(v ?? "").trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function safeRedactHeaders(h: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(h)) {
    out[k] = k.toLowerCase() === "authorization" ? "Bearer REDACTED" : v;
  }
  return out;
}

function buildCardTitle(card: any) {
  const titleParts = [card.year, card.player_name, card.brand, card.set_name, card.parallel]
    .map((p: any) => String(p ?? "").trim())
    .filter(Boolean);
  return titleParts.join(" ");
}

function buildEbaySellPrefillText(card: any) {
  const titleParts = [card.year, card.player_name, card.brand, card.set_name, card.parallel]
    .map((p: any) => String(p ?? "").trim())
    .filter(Boolean);

  const startPriceRaw = card.asking_price ?? card.estimated_price;
  const price = startPriceRaw != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(startPriceRaw)) : "";

  const lines: string[] = [];
  lines.push(`Title: ${titleParts.join(" ")}`);
  if (price) lines.push(`Price (starting): ${price}`);
  if (card.card_number) lines.push(`Card #: ${card.card_number}`);
  if (card.serial_number_text) lines.push(`Serial: ${card.serial_number_text}`);
  if (card.competition) lines.push(`Competition: ${card.competition}`);
  if (card.team) lines.push(`Team: ${card.team}`);
  if (card.sport) lines.push(`Sport/Category: ${card.sport}`);
  if (card.parallel) lines.push(`Parallel: ${card.parallel}`);

  return lines.join("\n");
}

function cleanEbayAspects(rawAspects: Record<string, any>) {
  const cleaned: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(rawAspects || {})) {
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
}

async function ensureEbayAccessTokenForLatestAccount() {
  if (!supabaseAdmin) return { accessToken: null as string | null, refreshToken: null as string | null, scopes: null as string | null, userId: null as string | null };

  const { data: account } = await supabaseAdmin
    .from("ebay_accounts")
    .select("user_id, refresh_token, access_token, token_expires_at, scopes")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) return { accessToken: null, refreshToken: null, scopes: null, userId: null };

  const tokenUrl = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL);
  const clientId = cleanEnv(process.env.EBAY_OAUTH_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.EBAY_OAUTH_CLIENT_SECRET);

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : null;
  const hasFreshAccess = account.access_token && expiresAt != null && expiresAt - Date.now() > 60 * 1000;
  if (hasFreshAccess) {
    return {
      accessToken: String(account.access_token),
      refreshToken: String(account.refresh_token),
      scopes: account.scopes ? String(account.scopes) : null,
      userId: String(account.user_id),
    };
  }

  const refreshToken = account.refresh_token ? String(account.refresh_token) : null;
  if (!refreshToken || !clientId || !clientSecret || !tokenUrl) {
    return {
      accessToken: account.access_token ? String(account.access_token) : null,
      refreshToken,
      scopes: account.scopes ? String(account.scopes) : null,
      userId: String(account.user_id),
    };
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    return { accessToken: account.access_token ? String(account.access_token) : null, refreshToken, scopes: account.scopes ? String(account.scopes) : null, userId: String(account.user_id) };
  }

  // Best-effort update
  await supabaseAdmin
    .from("ebay_accounts")
    .update({
      access_token: tokenJson.access_token,
      refresh_token: tokenJson?.refresh_token || refreshToken,
      token_expires_at: tokenJson?.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null,
      scopes: tokenJson?.scope || account.scopes || null,
    })
    .eq("user_id", account.user_id);

  return {
    accessToken: String(tokenJson.access_token),
    refreshToken,
    scopes: tokenJson?.scope ? String(tokenJson.scope) : (account.scopes ? String(account.scopes) : null),
    userId: String(account.user_id),
  };
}

export async function POST(req: Request) {
  try {
    const testSecret = cleanEnv(process.env.EBAY_TEST_SECRET);
    if (testSecret) {
      const headerSecret = String(req.headers.get("x-ebay-test-secret") || "").trim();
      if (headerSecret !== testSecret) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const cardId: string | null = body?.cardId ? String(body.cardId) : null;
    const skuPrefix = body?.skuPrefix ? String(body.skuPrefix) : `cardcat-test-${Date.now()}`;

    if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

    const { accessToken, scopes, userId } = await ensureEbayAccessTokenForLatestAccount();
    const apiOrigin = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL) ? new URL(cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL)).origin : "https://api.sandbox.ebay.com";
    const env = apiOrigin.includes("sandbox") ? "sandbox" : "production";

    if (!accessToken) {
      return NextResponse.json({ error: "No eBay access token available" }, { status: 500 });
    }

    const hasSellInventoryScope = Boolean(scopes && String(scopes).includes("/sell.inventory"));

    const card = cardId
      ? (await supabaseAdmin.from("cards").select("id, user_id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, team, sport, competition, grading_company, graded, grade, grading_cert_number_text, image_url, back_image_url, asking_price, estimated_price, notes, quantity").eq("id", cardId).maybeSingle()).data
      : (await supabaseAdmin.from("cards").select("id, user_id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, team, sport, competition, grading_company, graded, grade, grading_cert_number_text, image_url, back_image_url, asking_price, estimated_price, notes, quantity").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()).data;

    const cardSafe: any = card || {};

    const sku = `${skuPrefix}`;

    const inventoryItemUrl = `${apiOrigin}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`;
    const offerUrl = `${apiOrigin}/sell/inventory/v1/offer`;

    const rawTitle = buildCardTitle(cardSafe);
    const rawDescription = buildEbaySellPrefillText(cardSafe);
    let title = rawTitle;
    let description = rawDescription;
    const fallbackImageUrl = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg";
    const images = [cardSafe.image_url, cardSafe.back_image_url].filter(Boolean);
    if (!images.length) {
      images.push(fallbackImageUrl);
    }

    const rawAspects: Record<string, any> = {
      Sport: cardSafe.sport,
      "Player/Athlete": cardSafe.player_name,
      Manufacturer: cardSafe.brand,
      Set: cardSafe.set_name,
      Season: cardSafe.year,
      Team: cardSafe.team,
      "Card Number": cardSafe.card_number || cardSafe.serial_number_text,
      "Parallel/Variety": cardSafe.parallel,
      Country: cardSafe.country_code || cardSafe.country || process.env.EBAY_DEFAULT_COUNTRY || "US",
      "Item.Country": cardSafe.country_code || cardSafe.country || process.env.EBAY_DEFAULT_COUNTRY || "US",
    };

    let aspects = cleanEbayAspects(rawAspects);
    const rawAspectsEmpty = !aspects || Object.keys(aspects).length === 0;

    // Fallbacks so the isolated test always sends a minimally valid payload.
    // (If there are no cards in Supabase for this account, we must not send an empty title.)
    const usedFallbackTitle = !title;
    const usedFallbackDescription = !description;
    if (!title) title = "2025 Ashton Jeanty Panini Select Tie-Dye /25";
    if (!description) description = "2025 Ashton Jeanty Panini Select Tie-Dye sports trading card.";
    const usedFallbackAspects = rawAspectsEmpty;
    if (!aspects || Object.keys(aspects).length === 0) {
      aspects = {
        Sport: ["Football"],
        "Player/Athlete": ["Ashton Jeanty"],
        Manufacturer: ["Panini"],
        Set: ["Select"],
        Season: ["2025"],
        Team: ["Raiders"],
        "Card Number": ["204"],
        "Parallel/Variety": ["Tie-Dye"],
      };
    }

    // Test 1: ungraded fixed-price
    const condition = "USED_VERY_GOOD";
    const conditionDescriptors = [{ name: "40001", values: ["400010"] }];
    const availabilityQuantity = 1;

    const inventoryItemPayload: any = {
      condition,
      conditionDescriptors,
      availability: {
        shipToLocationAvailability: {
          quantity: availabilityQuantity,
        },
      },
      product: {
        title,
        description,
        imageUrls: images,
        aspects,
      },
    };

    const ebayHeaders = new Headers();
    ebayHeaders.set("Authorization", `Bearer ${accessToken}`);
    ebayHeaders.set("Content-Type", "application/json");
    ebayHeaders.set("Content-Language", "en-US");
    ebayHeaders.set("Accept", "application/json");
    ebayHeaders.set("Accept-Language", "en-US");

    const actualHeaders = Object.fromEntries(ebayHeaders.entries());
    const safeHeaders = safeRedactHeaders({
      ...actualHeaders,
    });

    const invRes = await fetch(inventoryItemUrl, {
      method: "PUT",
      headers: ebayHeaders,
      body: JSON.stringify(inventoryItemPayload),
    });

    const invText = await invRes.text();
    let invJson: any = null;
    try {
      invJson = JSON.parse(invText);
    } catch {
      invJson = null;
    }

    const didPutInventorySucceed = invRes.ok;

    let categoryProductItemId: string | null = null;
    let inventoryItemDetails: any = null;
    let inventoryItemDetailsStatus: number | null = null;

    // Best-effort: fetch inventory item details so we can see if eBay returns
    // categoryProductItemId.
    try {
      if (didPutInventorySucceed) {
        const detailsRes = await fetch(inventoryItemUrl, {
          method: "GET",
          headers: ebayHeaders,
        });
        inventoryItemDetailsStatus = detailsRes.status;
        const detailsText = await detailsRes.text();
        try {
          inventoryItemDetails = JSON.parse(detailsText);
        } catch {
          inventoryItemDetails = { raw: detailsText };
        }

        categoryProductItemId =
          inventoryItemDetails?.categoryProductItemId ||
          inventoryItemDetails?.category_product_item_id ||
          inventoryItemDetails?.categoryProduct?.categoryProductItemId ||
          null;
      }
    } catch {
      // ignore
    }

    let didOfferRun = false;
    let didOfferSucceed = false;
    let rawOfferResponse: any = null;
    let offerStatus: number | null = null;

    let offerId: string | null = null;
    let offerDetails: any = null;
    let offerDetailsAttempted: string[] = [];

    let publishAttempts: any[] = [];
    let didPublishSucceed = false;
    let publishStatus: number | null = null;
    let rawPublishResponse: any = null;
    let publishedListingUrl: string | null = null;
    let publishedListingId: string | null = null;

    let offerPayload: any = null;
    if (didPutInventorySucceed) {
      didOfferRun = true;
      offerPayload = {
        sku,
        marketplaceId: "EBAY_US",
        format: "FIXED_PRICE",
        availableQuantity: availabilityQuantity,
        categoryId: "261328",
        listingDescription: description,
        listingDuration: "GTC",
        pricingSummary: {
          price: {
            value: String(cardSafe.asking_price ?? cardSafe.estimated_price ?? 25),
            currency: "USD",
          },
        },
      };

      const offerRes = await fetch(offerUrl, {
        method: "POST",
        headers: ebayHeaders,
        body: JSON.stringify(offerPayload),
      });

      offerStatus = offerRes.status;
      const offerText = await offerRes.text();
      try {
        rawOfferResponse = JSON.parse(offerText);
      } catch {
        rawOfferResponse = { raw: offerText };
      }
      offerId = rawOfferResponse?.offerId || rawOfferResponse?.id || null;
      didOfferSucceed = offerRes.ok;

      // Best-effort: fetch offer details to find categoryProductItemId.
      if (didOfferSucceed && offerId) {
        const endpoints = [
          `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}`,
          `${apiOrigin}/sell/inventory/v1/offers/${encodeURIComponent(String(offerId))}`,
        ];
        for (const u of endpoints) {
          offerDetailsAttempted.push(u);
          const detailsRes = await fetch(u, {
            method: "GET",
            headers: ebayHeaders,
          });
          const detailsText = await detailsRes.text();
          let detailsJson: any = null;
          try {
            detailsJson = JSON.parse(detailsText);
          } catch {
            detailsJson = { raw: detailsText };
          }
          if (detailsRes.ok) {
            offerDetails = detailsJson;
            break;
          }
        }
      }

      // Best-effort: attempt to publish the offer so we can open a real listing page.
      if (didOfferSucceed && offerId) {
        const publishCandidates: Array<{ url: string; method: string; body?: any }> = [
          {
            url: `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}/publish`,
            method: "POST",
            body: {},
          },
          {
            url: `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}/publishOffer`,
            method: "POST",
            body: {},
          },
          {
            url: `${apiOrigin}/sell/inventory/v1/publishOffer`,
            method: "POST",
            body: { offerId: String(offerId) },
          },
          {
            url: `${apiOrigin}/sell/inventory/v1/publish_offer`,
            method: "POST",
            body: { offerId: String(offerId) },
          },
          {
            url: `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}/publish`,
            method: "PUT",
            body: {},
          },
        ];

        for (const cand of publishCandidates) {
          const attempt: any = { url: cand.url, method: cand.method };
          const details = await fetch(cand.url, {
            method: cand.method,
            headers: ebayHeaders,
            body: cand.body ? JSON.stringify(cand.body) : undefined,
          });
          attempt.status = details.status;
          const txt = await details.text();
          try {
            attempt.response = JSON.parse(txt);
          } catch {
            attempt.response = { raw: txt };
          }
          publishAttempts.push(attempt);

          if (details.ok) {
            didPublishSucceed = true;
            publishStatus = details.status;
            rawPublishResponse = attempt.response;

            publishedListingId =
              String(
                attempt.response?.listingId ||
                  attempt.response?.listing_id ||
                  attempt.response?.inventoryListingId ||
                  attempt.response?.inventory_listing_id ||
                  attempt.response?.itemId ||
                  attempt.response?.item_id ||
                  attempt.response?.itemId
              ) || null;

            publishedListingUrl =
              attempt.response?.listingUrl ||
              attempt.response?.listing_url ||
              attempt.response?.url ||
              attempt.response?.itemUrl ||
              null;

            if (!publishedListingUrl && publishedListingId) {
              // Fallback best-effort URL pattern.
              publishedListingUrl = `https://www.ebay.com/itm/${encodeURIComponent(String(publishedListingId))}`;
            }
            break;
          }
        }
      }
    }

    return NextResponse.json({
      publishDebugMarker: "PUBLISH_STEP_ENABLED",
      env,
      tokenScopes: scopes,
      hasSellInventoryScope,

      sku,
      brandNewSku: true,
      usedCardId: card?.id || null,

      safeHeaders,
      safeInventoryItemBody: inventoryItemPayload,
      condition,
      conditionDescriptors,
      wereConditionDescriptorsIncluded: true,
      wereImageUrlsIncluded: images.length > 0,
      usedAspects: aspects,

      debugFallback: {
        usedFallbackTitle,
        usedFallbackDescription,
        usedFallbackAspects,
        titleLen: title ? String(title).length : 0,
        descriptionLen: description ? String(description).length : 0,
      },

      didPutInventorySucceed,
      putInventoryStatus: invRes.status,
      rawPutInventoryResponse: invJson || { raw: invText },

      inventoryItemDetailsStatus,
      categoryProductItemId,

      inventoryItemDetailsProductAspects: inventoryItemDetails?.product?.aspects || null,
      inventoryItemDetailsRawSample: inventoryItemDetails ? JSON.stringify(inventoryItemDetails).slice(0, 5000) : null,

      didOfferRun,
      didOfferSucceed,
      offerStatus,
      rawOfferResponse,
      offerId,
      offerDetails,
      offerDetailsAttempted,
      offerPayload,

      didPublishSucceed,
      publishStatus,
      publishedListingId,
      publishedListingUrl,
      rawPublishResponse,
      publishAttempts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
