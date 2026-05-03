import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
}

function base64url(input: Buffer | string) {
  const b = typeof input === "string" ? Buffer.from(input) : input;
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unbase64url(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.user.id;

    const clientId = process.env.EBAY_OAUTH_CLIENT_ID;
    const clientSecret = process.env.EBAY_OAUTH_CLIENT_SECRET;
    const authorizeUrl = process.env.EBAY_OAUTH_AUTHORIZE_URL || "https://signin.ebay.com/oauth2/authorize";
    const redirectPath = process.env.EBAY_OAUTH_REDIRECT_PATH || "/api/ebay/oauth/callback";
    const scopes = process.env.EBAY_OAUTH_SCOPES;
    const stateSecret = process.env.EBAY_OAUTH_STATE_SECRET || clientSecret;

    if (!clientId || !clientSecret || !scopes || !stateSecret) {
      return NextResponse.json(
        { error: "eBay OAuth not configured. Set EBAY_OAUTH_CLIENT_ID, EBAY_OAUTH_CLIENT_SECRET, EBAY_OAUTH_SCOPES, EBAY_OAUTH_STATE_SECRET (optional)." },
        { status: 500 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
    if (!origin) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_ORIGIN" }, { status: 500 });
    }

    const redirectUri = `${origin}${redirectPath}`;

    const nonce = crypto.randomBytes(16).toString("hex");
    const payload = JSON.stringify({ u: userId, n: nonce });
    const sig = crypto.createHmac("sha256", stateSecret).update(payload).digest();
    const state = base64url(payload) + "." + base64url(sig);

    const url = new URL(authorizeUrl);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scopes);
    url.searchParams.set("state", state);

    return NextResponse.json({ redirectUrl: url.toString() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
