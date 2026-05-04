import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
}

function cleanEnv(v: string | undefined) {
  const t = String(v ?? "").trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

async function ensureEbayAccessToken({
  supabaseAdmin,
  userId,
}: {
  supabaseAdmin: any;
  userId: string;
}) {
  const tokenUrl = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL) || "https://api.ebay.com/identity/v1/oauth2/token";
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
  const hasFreshAccess = account.access_token && expiresAt != null && expiresAt - Date.now() > 60 * 1000;

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
    return { accessToken: null as string | null, scopes: account.scopes ? String(account.scopes) : null };
  }

  const newRefresh = tokenJson?.refresh_token || refreshToken;
  await supabaseAdmin
    .from("ebay_accounts")
    .update({
      access_token: tokenJson.access_token,
      refresh_token: newRefresh,
      token_expires_at: tokenJson?.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null,
      scopes: tokenJson?.scope || account.scopes || null,
    })
    .eq("user_id", userId);

  return {
    accessToken: String(tokenJson.access_token),
    scopes: tokenJson?.scope ? String(tokenJson.scope) : account.scopes ? String(account.scopes) : null,
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

    const body = await req.json().catch(() => ({}));
    const cardId = body?.cardId ? String(body.cardId) : null;
    if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

    const { data: account } = await supabaseAdmin
      .from("ebay_accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!account) return NextResponse.json({ error: "eBay not connected" }, { status: 400 });

    const { accessToken: ebayAccessToken } = await ensureEbayAccessToken({ supabaseAdmin, userId });
    if (!ebayAccessToken) return NextResponse.json({ error: "No eBay access token" }, { status: 500 });

    const tokenUrl = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL);
    const apiOrigin = tokenUrl ? new URL(tokenUrl).origin : "https://api.ebay.com";

    const publishCountry = process.env.EBAY_DEFAULT_COUNTRY || "United States";

    // Load latest draft row to find the stored offerId.
    const { data: draftRow, error: draftErr } = await supabaseAdmin
      .from("ebay_listing_drafts")
      .select("id, card_snapshot")
      .eq("user_id", userId)
      .eq("card_id", cardId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftErr) return NextResponse.json({ error: draftErr.message }, { status: 500 });
    if (!draftRow) return NextResponse.json({ error: "No eBay draft/offer found for this card" }, { status: 404 });

    const offerId = String(draftRow?.card_snapshot?.ebay_offer_id || "").trim();
    const sku = String(draftRow?.card_snapshot?.ebay_sku || "").trim();
    if (!offerId) return NextResponse.json({ error: "Missing ebay_offer_id for this card" }, { status: 400 });

    const ebayHeaders = new Headers();
    ebayHeaders.set("Authorization", `Bearer ${ebayAccessToken}`);
    ebayHeaders.set("Content-Type", "application/json");
    ebayHeaders.set("Content-Language", "en-US");
    ebayHeaders.set("Accept", "application/json");
    ebayHeaders.set("Accept-Language", "en-US");
    ebayHeaders.delete("language");

    const publishBodyBase: any = {
      offerId: String(offerId),
      item: { country: publishCountry, Country: publishCountry },
      Item: { Country: publishCountry },
      merchantLocation: { country: publishCountry },
    };

    const candidates: Array<{ url: string; method: string; body?: any }> = [
      {
        url: `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}/publish`,
        method: "POST",
        body: publishBodyBase,
      },
      {
        url: `${apiOrigin}/sell/inventory/v1/offer/${encodeURIComponent(String(offerId))}/publishOffer`,
        method: "POST",
        body: publishBodyBase,
      },
      {
        url: `${apiOrigin}/sell/inventory/v1/publishOffer`,
        method: "POST",
        body: publishBodyBase,
      },
      {
        url: `${apiOrigin}/sell/inventory/v1/publish_offer`,
        method: "POST",
        body: publishBodyBase,
      },
    ];

    let lastError: any = null;
    let listingUrl: string | null = null;
    let listingId: string | null = null;

    for (const cand of candidates) {
      const res = await fetch(cand.url, {
        method: cand.method,
        headers: ebayHeaders,
        body: cand.body ? JSON.stringify(cand.body) : undefined,
      });

      const txt = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(txt);
      } catch {
        json = { raw: txt };
      }

      if (res.ok) {
        listingUrl = json?.listingUrl || json?.listing_url || json?.url || json?.itemUrl || null;
        listingId =
          json?.listingId ||
          json?.listing_id ||
          json?.inventoryListingId ||
          json?.inventory_listing_id ||
          json?.itemId ||
          json?.item_id ||
          null;
        if (!listingUrl && listingId) {
          listingUrl = `https://www.ebay.com/itm/${encodeURIComponent(String(listingId))}`;
        }

        await supabaseAdmin
          .from("ebay_listing_drafts")
          .update({
            status: "published_offer_created",
            ebay_draft_id: offerId,
            draft_url: listingUrl,
            error_message: null,
            card_snapshot: {
              ...(draftRow?.card_snapshot || {}),
              ebay_offer_status: "published_offer_created",
              ebay_listing_url: listingUrl,
              ebay_listing_id: listingId,
              ebay_last_sync_at: new Date().toISOString(),
            },
          })
          .eq("id", draftRow.id);

        return NextResponse.json({
          ok: true,
          offerId,
          sku,
          listingId,
          listingUrl,
          raw: json,
        });
      }

      lastError = {
        status: res.status,
        response: json,
        attemptedUrl: cand.url,
      };
    }

    return NextResponse.json(
      {
        ok: false,
        offerId,
        sku,
        error: lastError,
      },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

