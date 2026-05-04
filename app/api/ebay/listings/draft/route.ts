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
  existingOfferId,
}: {
  ebayAccessToken: string;
  tokenScopes?: string | null;
  listingType: string;
  auctionDurationDays: number;
  startPrice: number | null;
  card: any;
  existingOfferId?: string | null;
}) {
  // IMPORTANT: Inventory API flow (unpublished offer / draft-like object)
  // Do NOT call /sell/inventory/v1/drafts (not a valid endpoint in our setup).

  const tokenUrl = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL);
  const apiOrigin = tokenUrl ? new URL(tokenUrl).origin : "https://api.ebay.com";

  const marketplaceId = cleanEnv(process.env.EBAY_SELL_MARKETPLACE_ID) || "EBAY_US";
  const categoryId = cleanEnv(process.env.EBAY_SELL_CATEGORY_ID) || "261328";

  const gradedConditionId = cleanEnv(process.env.EBAY_SELL_CONDITION_ID_GRADED) || "2750";
  const ungradedConditionId = cleanEnv(process.env.EBAY_SELL_CONDITION_ID_UNGRADED) || "4000";

  // eBay Inventory API conditionDescriptors IDs for ungraded sports singles (MVP)
  // 40001 = Card Condition, 400010 = Near Mint or Better
  const ungradedConditionDescriptorName =
    cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_UNGRADED_NAME) || "40001";
  const ungradedConditionDescriptorValue =
    cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_UNGRADED_VALUE) || "400010";

  // eBay Inventory API conditionDescriptors IDs for graded PSA 10 (example)
  const gradedProGraderName = cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_GRADED_PRO_GRADER_NAME) || "27501";
  const gradedProGraderValue = cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_GRADED_PRO_GRADER_VALUE) || "275010";
  const gradedGradeName = cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_GRADED_GRADE_NAME) || "27502";
  const gradedGradeValue = cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_GRADED_GRADE_VALUE) || "275020";
  const gradedCertNumberName = cleanEnv(process.env.EBAY_SELL_CONDITION_DESCRIPTOR_GRADED_CERT_NUMBER_NAME) || "27503";

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
    // Required for publishing the offer.
    Country: (card.country_code || card.country || process.env.EBAY_DEFAULT_COUNTRY || "United States"),
    "Item.Country": (card.country_code || card.country || process.env.EBAY_DEFAULT_COUNTRY || "United States"),
  };

  const publishCountry = card.country_code || card.country || process.env.EBAY_DEFAULT_COUNTRY || "United States";

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
    // MVP graded: send numeric descriptor IDs in the shape eBay expects.
    // (Full mapping from grade/company to descriptor values will be added later.)
    conditionDescriptors.push({ name: gradedProGraderName, values: [gradedProGraderValue] });
    conditionDescriptors.push({ name: gradedGradeName, values: [gradedGradeValue] });

    const cert = String(card?.grading_cert_number_text || "").trim();
    if (cert) {
      conditionDescriptors.push({ name: gradedCertNumberName, additionalInfo: cert });
    }
  } else {
    // Ungraded MVP: Card Condition = Near Mint or Better
    conditionDescriptors.push({ name: ungradedConditionDescriptorName, values: [ungradedConditionDescriptorValue] });
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

  // We'll attach the ACTUAL headers passed to fetch into requestSnapshot
  // at the point of the request.

  const inventoryItemPayload: any = {
    sku,
    condition: conditionEnum,
    conditionDescriptors,
    availability: {
      shipToLocationAvailability: {
        quantity: availableQty,
        shipToLocations: [{ country: publishCountry }],
      },
    },
    item: {
      country: publishCountry,
      Country: publishCountry,
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

  const ebayHeaders1 = new Headers();
  ebayHeaders1.set("Authorization", `Bearer ${ebayAccessToken}`);
  ebayHeaders1.set("Content-Type", "application/json");
  ebayHeaders1.set("Content-Language", "en-US");
  ebayHeaders1.set("Accept", "application/json");
  // Explicitly set to avoid ambiguity.
  ebayHeaders1.set("Accept-Language", "en-US");
  // Ensure no other language-related variants are present.
  ebayHeaders1.delete("language");

  const actualHeaders1 = Object.fromEntries(ebayHeaders1.entries());
  const safeActualHeaders1: Record<string, any> = {};
  for (const [k, v] of Object.entries(actualHeaders1)) {
    const lk = k.toLowerCase();
    safeActualHeaders1[lk] = lk === "authorization" ? "Bearer REDACTED" : v;
  }
  // Ensure exact expected keys exist (at least for debug).
  if (!('accept-language' in safeActualHeaders1)) {
    safeActualHeaders1['accept-language'] = 'MISSING';
  }
  if (!('accept' in safeActualHeaders1)) {
    safeActualHeaders1['accept'] = 'MISSING';
  }

  // Make sure debug reflects the actual value set on the Headers object.
  const alValue = ebayHeaders1.get('accept-language') || ebayHeaders1.get('Accept-Language');
  if (alValue) safeActualHeaders1['accept-language'] = alValue;
  const acceptValue = ebayHeaders1.get('accept');
  if (acceptValue) safeActualHeaders1['accept'] = acceptValue;
  requestSnapshot.actualHeadersInventoryItem = safeActualHeaders1;

  const itemRes = await fetch(inventoryItemUrl, {
    method: "PUT",
    headers: ebayHeaders1,
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

  let categoryProductItemId: string | null = null;
  let inventoryItemDetails: any = null;
  let inventoryItemDetailsStatus: number | null = null;

  // Best-effort: fetch inventory item details so we can build the correct
  // eBay lstng URL (it needs categoryProductItemId).
  try {
    const detailsRes = await fetch(inventoryItemUrl, {
      method: "GET",
      headers: ebayHeaders1,
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
  } catch {
    // ignore
  }

  requestSnapshot.categoryProductItemId = categoryProductItemId;
  requestSnapshot.inventoryItemDetailsStatus = inventoryItemDetailsStatus;

  // 2) Create offer (unpublished)
  const offerUrl = `${apiOrigin}/sell/inventory/v1/offer`;

  requestSnapshot.endpoints.offer = offerUrl;

  const offerPayload: any = {
    sku,
    marketplaceId,
    format: listingType === "auction" ? "AUCTION" : "FIXED_PRICE",
    availableQuantity: availableQty,
    categoryId,
    // eBay Inventory API expects listingDescription as a string, not an object.
    listingDescription: description,
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
    item: { country: publishCountry, Country: publishCountry },
    Item: { Country: publishCountry },
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

  const ebayHeaders2 = new Headers();
  ebayHeaders2.set("Authorization", `Bearer ${ebayAccessToken}`);
  ebayHeaders2.set("Content-Type", "application/json");
  ebayHeaders2.set("Content-Language", "en-US");
  ebayHeaders2.set("Accept", "application/json");
  // Explicitly set to avoid ambiguity.
  ebayHeaders2.set("Accept-Language", "en-US");
  ebayHeaders2.delete("language");

  const actualHeaders2 = Object.fromEntries(ebayHeaders2.entries());
  const safeActualHeaders2: Record<string, any> = {};
  for (const [k, v] of Object.entries(actualHeaders2)) {
    const lk = k.toLowerCase();
    safeActualHeaders2[lk] = lk === "authorization" ? "Bearer REDACTED" : v;
  }
  const alValue2 = ebayHeaders2.get('accept-language') || ebayHeaders2.get('Accept-Language');
  if (alValue2) safeActualHeaders2['accept-language'] = alValue2;
  const acceptValue2 = ebayHeaders2.get('accept');
  if (acceptValue2) safeActualHeaders2['accept'] = acceptValue2;
  requestSnapshot.actualHeadersOffer = safeActualHeaders2;

  let offerId: string | null = null;
  let postOfferSucceeded = false;
  let postOfferReusedExisting = false;

  if (existingOfferId) {
    offerId = String(existingOfferId);
    postOfferSucceeded = true;
    postOfferReusedExisting = true;
  } else {
    const offerRes = await fetch(offerUrl, {
      method: "POST",
      headers: ebayHeaders2,
      body: JSON.stringify(offerPayload),
    });

    const offerJson: any = await offerRes.json().catch(() => null);

    if (offerRes.ok) {
      offerId = offerJson?.offerId || offerJson?.id || null;
      postOfferSucceeded = Boolean(offerId);
      postOfferReusedExisting = false;
    } else {
      const firstErr = offerJson?.errors?.[0];
      const errId = firstErr?.errorId;
      const params = Array.isArray(firstErr?.parameters) ? firstErr.parameters : [];
      const offerIdFromParams = params.find((p: any) => p?.name === "offerId")?.value;

      // eBay returns errorId=25002 when an offer already exists for the same SKU.
      // In that case, we can safely reuse the existing offerId.
      if (errId === 25002 && offerIdFromParams) {
        offerId = String(offerIdFromParams);
        postOfferSucceeded = true;
        postOfferReusedExisting = true;
      } else {
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
    }
  }

  // 2b) Verification: GET /sell/inventory/v1/offer/{offerId}
  let verifiedOffer: any = null;
  let offerVerificationOk = false;
  let offerVerificationIssues: string[] = [];

  const offerReusedExistingFromStore = Boolean(existingOfferId);

  // Normalized values extracted from the GET /offer verification.
  let returnedMarketplaceId: any = null;
  let returnedCategoryId: any = null;
  let returnedStatus: any = null;
  let returnedPriceValue: any = null;

  if (offerId) {
    const offerDetailsUrl = `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}`;
    const offerDetailsUrl2 = `${apiOrigin}/sell/inventory/v1/offers/${encodeURIComponent(String(offerId))}`;

    let detailsRes = await fetch(offerDetailsUrl, {
      method: "GET",
      headers: ebayHeaders2,
    });
    let detailsText = await detailsRes.text();
    if (!detailsRes.ok) {
      detailsRes = await fetch(offerDetailsUrl2, {
        method: "GET",
        headers: ebayHeaders2,
      });
      detailsText = await detailsRes.text();
    }

    try {
      verifiedOffer = JSON.parse(detailsText);
    } catch {
      verifiedOffer = { raw: detailsText };
    }

    const returnedSku = verifiedOffer?.sku || verifiedOffer?.offer?.sku;
    const returnedOfferId = verifiedOffer?.offerId || verifiedOffer?.id;
    returnedMarketplaceId = verifiedOffer?.marketplaceId;
    returnedCategoryId = verifiedOffer?.categoryId;
    returnedStatus = verifiedOffer?.status;
    returnedPriceValue = verifiedOffer?.pricingSummary?.price?.value;

    if (!detailsRes.ok) {
      offerVerificationIssues.push(`GET offer failed (HTTP ${detailsRes.status})`);
    }
    if (String(returnedOfferId || "") !== String(offerId)) {
      offerVerificationIssues.push(`offerId mismatch (got ${String(returnedOfferId || "")})`);
    }
    if (returnedSku != null && String(returnedSku) !== String(sku)) {
      offerVerificationIssues.push(`SKU mismatch (got ${String(returnedSku)})`);
    }
    if (returnedMarketplaceId && String(returnedMarketplaceId) !== String(marketplaceId)) {
      offerVerificationIssues.push(`marketplaceId mismatch (got ${String(returnedMarketplaceId)})`);
    }
    if (returnedCategoryId && String(returnedCategoryId) !== String(categoryId)) {
      offerVerificationIssues.push(`categoryId mismatch (got ${String(returnedCategoryId)})`);
    }

    if (returnedStatus && String(returnedStatus).toLowerCase() !== "unpublished") {
      offerVerificationIssues.push(`status is ${String(returnedStatus)}`);
    }

    if (startPrice != null && returnedPriceValue != null) {
      const expected = Number(startPrice);
      const got = Number(returnedPriceValue);
      if (Number.isFinite(expected) && Number.isFinite(got) && Math.abs(expected - got) > 0.01) {
        offerVerificationIssues.push(`price mismatch (expected ${expected}, got ${got})`);
      }
    }

    offerVerificationOk = detailsRes.ok && verifiedOffer != null;
  }

  if (!offerId || !offerVerificationOk) {
    return {
      draftUrl: null as string | null,
      draftId: null as string | null,
      error: {
        status: 502,
        response: { verifiedOffer, offerVerificationIssues },
        requestSnapshot,
        attemptedUrls: [offerUrl],
      },
    };
  }

  const verifiedMarketplaceIdFinal =
    returnedMarketplaceId ?? marketplaceId;
  const verifiedCategoryIdFinal =
    returnedCategoryId ?? categoryId;
  const verifiedStatusFinal = returnedStatus ?? (String(verifiedOffer?.status || "UNPUBLISHED"));
  const verifiedPriceValueFinal =
    returnedPriceValue != null ? returnedPriceValue : startPrice;
  const verifiedPriceCurrencyFinal =
    verifiedOffer?.pricingSummary?.price?.currency ||
    verifiedOffer?.offer?.pricingSummary?.price?.currency ||
    "USD";

  const enablePublish = String(process.env.EBAY_ENABLE_PUBLISH || "").toLowerCase() === "true";

  // 3) Publish the offer (best-effort). Disabled by default (requires explicit approval via EBAY_ENABLE_PUBLISH).
  let didPublishSucceed = false;
  let publishedListingUrl: string | null = null;
  let publishedListingId: string | null = null;
  let publishErrorMessage: string | null = null;
  let publishAttempts: Array<{ url: string; method: string; status: number; errorMessage: string | null }> = [];

  if (enablePublish && offerId && postOfferSucceeded) {
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
      try {
        const publishRes = await fetch(cand.url, {
          method: cand.method,
          headers: ebayHeaders2,
          body: cand.body ? JSON.stringify(cand.body) : undefined,
        });

        const txt = await publishRes.text();
        const pubJson: any = await (async () => {
          try {
            return JSON.parse(txt);
          } catch {
            return { raw: txt };
          }
        })();

        const firstErr = pubJson?.errors?.[0];
        const errMsg =
          firstErr?.message ||
          firstErr?.longMessage ||
          firstErr?.errorDescription ||
          pubJson?.message ||
          pubJson?.error ||
          null;

        const fallbackErrText = !errMsg ? JSON.stringify(pubJson).slice(0, 800) : null;
        const finalErrMsg =
          String(errMsg || fallbackErrText || `Publish failed (HTTP ${publishRes.status})`).slice(0, 300) ||
          `Publish failed (HTTP ${publishRes.status})`;

        publishAttempts.push({
          url: cand.url,
          method: cand.method,
          status: publishRes.status,
          errorMessage: finalErrMsg,
        });

        if (!publishErrorMessage && !publishRes.ok) publishErrorMessage = finalErrMsg;

        if (publishRes.ok) {
          didPublishSucceed = true;

          publishedListingUrl = pubJson?.listingUrl || pubJson?.listing_url || pubJson?.url || pubJson?.itemUrl || null;
          publishedListingId =
            pubJson?.listingId ||
            pubJson?.listing_id ||
            pubJson?.inventoryListingId ||
            pubJson?.inventory_listing_id ||
            pubJson?.itemId ||
            pubJson?.item_id ||
            null;

          // Best-effort: re-fetch offer details in case publish response omits listing URL.
          const offerDetailEndpoints = [
            `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}`,
            `${apiOrigin}/sell/inventory/v1/offers/${encodeURIComponent(String(offerId))}`,
          ];

          for (const du of offerDetailEndpoints) {
            try {
              const offerDetailsRes = await fetch(du, {
                method: "GET",
                headers: ebayHeaders2,
              });
              if (!offerDetailsRes.ok) continue;
              const odTxt = await offerDetailsRes.text();
              let odJson: any = null;
              try {
                odJson = JSON.parse(odTxt);
              } catch {
                odJson = { raw: odTxt };
              }

              publishedListingUrl =
                odJson?.listingUrl ||
                odJson?.listing_url ||
                odJson?.url ||
                odJson?.itemUrl ||
                publishedListingUrl;
              publishedListingId =
                odJson?.listingId ||
                odJson?.listing_id ||
                odJson?.inventoryListingId ||
                odJson?.inventory_listing_id ||
                odJson?.itemId ||
                odJson?.item_id ||
                publishedListingId;
              break;
            } catch {
              // ignore
            }
          }

          if (!publishedListingUrl && publishedListingId) {
            publishedListingUrl = `https://www.ebay.com/itm/${encodeURIComponent(String(publishedListingId))}`;
          }

          if (!publishedListingUrl) {
            didPublishSucceed = false;
            publishErrorMessage = `Publish succeeded but listing URL was not returned.`;
          }

          break;
        }
      } catch {
        // ignore and try next candidate
      }
    }
  }

  return {
    draftUrl: null as string | null,
    draftId: offerId,
    error: null,
    putInventorySucceeded: true,
    postOfferSucceeded: postOfferSucceeded,
    postOfferReusedExisting: postOfferReusedExisting,
    offerReusedExistingFromStore,
    verifiedOffer,
    offerVerificationOk,
    offerVerificationIssues,
    verifiedMarketplaceId: verifiedMarketplaceIdFinal,
    verifiedCategoryId: verifiedCategoryIdFinal,
    verifiedStatus: verifiedStatusFinal,
    verifiedPriceValue: verifiedPriceValueFinal,
    verifiedPriceCurrency: verifiedPriceCurrencyFinal,
    didPublishSucceed,
    publishedListingId,
    publishedListingUrl,
    publishErrorMessage,
    publishAttempts,
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
        "id, user_id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, team, sport, competition, rookie, is_autograph, has_memorabilia, graded, grade, grading_company, image_url, back_image_url, asking_price, estimated_price, notes, quantity"
      )
      .eq("id", cardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (cardErr) return NextResponse.json({ error: cardErr.message }, { status: 500 });
    if (!card) return NextResponse.json({ error: "Card not found or not owned" }, { status: 404 });

    const prefillText = buildEbaySellPrefillText(card);
    const stagedSummary = buildStagedSummary(card, listingType, auctionDurationDays);

    // If we already created an unpublished offer for this card, reuse it to avoid duplicates.
    const existingOfferDraft = await supabaseAdmin
      .from("ebay_listing_drafts")
      .select("card_snapshot")
      .eq("user_id", userId)
      .eq("card_id", cardId)
      .eq("status", "unpublished_offer_created")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const existingOfferId = String(existingOfferDraft?.data?.card_snapshot?.ebay_offer_id || "").trim() || null;

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
      .select("id, card_snapshot")
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

    // If connected, attempt to create an unpublished eBay offer via Inventory API.
    // Do NOT redirect to eBay listing UI from this flow.
    let fallbackSellUrl: string | null = "https://www.ebay.com/sl/sell";
    let unpublishedOffer:
      | {
          sku: string;
          offerId: string;
          status: string;
          putInventorySucceeded?: boolean;
          postOfferSucceeded?: boolean;
          postOfferReusedExisting?: boolean;
          offerReusedExistingFromStore?: boolean;
          reusedExisting?: boolean;
          verifiedOffer?: any;
          offerVerificationOk?: boolean;
          offerVerificationIssues?: string[];

          verifiedCategoryId?: string;
          verifiedMarketplaceId?: string;
          verifiedPriceValue?: any;
          verifiedPriceCurrency?: string;
        }
      | null = null;
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

		          const {
		            draftId,
		            error,
		            putInventorySucceeded,
		            postOfferSucceeded,
		            postOfferReusedExisting,
		            offerReusedExistingFromStore,
		            verifiedOffer,
		            offerVerificationOk,
		            offerVerificationIssues,
		            verifiedCategoryId,
		            verifiedMarketplaceId,
		            verifiedPriceValue,
		            verifiedPriceCurrency,
		          } = await createEbayDraftFromCard({
		            ebayAccessToken: accessToken,
		            tokenScopes,
		            listingType,
		            auctionDurationDays,
		            startPrice,
		            card,
		            existingOfferId,
		          });

		          if (draftId) {
		            const offerIdStr = String(draftId);
		            const reusedExisting = Boolean(offerReusedExistingFromStore || postOfferReusedExisting);

		            unpublishedOffer = {
		              sku: String(verifiedOffer?.sku || card.id || ""),
		              offerId: offerIdStr,
		              status: "unpublished_offer_created",
		              putInventorySucceeded: Boolean(putInventorySucceeded),
		              postOfferSucceeded: Boolean(postOfferSucceeded),
		              postOfferReusedExisting: Boolean(postOfferReusedExisting),
		              offerReusedExistingFromStore: Boolean(offerReusedExistingFromStore),
		              reusedExisting,
		              verifiedOffer,
		              offerVerificationOk: Boolean(offerVerificationOk),
		              offerVerificationIssues: offerVerificationIssues || [],
		              verifiedCategoryId: verifiedCategoryId || undefined,
		              verifiedMarketplaceId: verifiedMarketplaceId || undefined,
		              verifiedPriceValue: verifiedPriceValue || undefined,
		              verifiedPriceCurrency: verifiedPriceCurrency || undefined,
		            };

		            // Connected + successful Inventory API flow: stay in CardCat.
		            fallbackSellUrl = null;

		            if (stagedDraft?.id) {
		              const priorSnapshot = stagedDraft.card_snapshot || {};
		              await supabaseAdmin
		                .from("ebay_listing_drafts")
		                .update({
		                  status: "unpublished_offer_created",
		                  ebay_draft_id: offerIdStr,
		                  draft_url: null,
		                  error_message: null,
		                  card_snapshot: {
		                    ...priorSnapshot,
		                    ebay_sku: unpublishedOffer.sku,
		                    ebay_offer_id: offerIdStr,
		                    ebay_offer_status: "unpublished_offer_created",
		                    ebay_last_sync_at: new Date().toISOString(),
		                    ebay_listing_url: null,
		                    ebay_listing_id: null,
		                    ebay_offer_verification_ok: Boolean(offerVerificationOk),
		                    ebay_offer_verification_issues: offerVerificationIssues || [],
		                  },
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
      unpublishedOffer,
      unpublishedOfferCreated: Boolean(unpublishedOffer),
      draftCreateError,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
