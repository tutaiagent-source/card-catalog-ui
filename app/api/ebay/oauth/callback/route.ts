import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";

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

    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    // eBay is not consistently echoing back the `state` param.
    // Recover it from the HttpOnly cookie set during /oauth/start.
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("ebay_oauth_state")?.value;
    const stateFromQuery = url.searchParams.get("state");
    const state = stateFromQuery || stateCookie || null;

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    const cleanEnv = (v: string | undefined) => {
      const t = String(v ?? "").trim();
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1);
      }
      return t;
    };

    const clientId = cleanEnv(process.env.EBAY_OAUTH_CLIENT_ID);
    const clientSecret = cleanEnv(process.env.EBAY_OAUTH_CLIENT_SECRET);
    const tokenUrl = cleanEnv(process.env.EBAY_OAUTH_TOKEN_URL) || "https://api.ebay.com/identity/v1/oauth2/token";
    const redirectPath = cleanEnv(process.env.EBAY_OAUTH_REDIRECT_PATH) || "/api/ebay/oauth/callback";
    const stateSecret = cleanEnv(process.env.EBAY_OAUTH_STATE_SECRET) || clientSecret;

    if (!clientId || !clientSecret || !stateSecret) {
      return NextResponse.json({ error: "eBay OAuth not configured" }, { status: 500 });
    }

    const [payloadB64, sigB64] = state.split(".");
    if (!payloadB64 || !sigB64) return NextResponse.json({ error: "Invalid state" }, { status: 400 });

    const payloadStr = unbase64url(payloadB64);

    const sigB64Padded = sigB64 + (sigB64.length % 4 === 0 ? "" : "=".repeat(4 - (sigB64.length % 4)));
    const sig = Buffer.from(sigB64Padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");

    const expectedSig = crypto.createHmac("sha256", stateSecret).update(payloadStr).digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      return NextResponse.json({ error: "State signature mismatch" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr) as { u: string; n: string };
    const userId = payload.u;

    const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
    if (!origin) return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_ORIGIN" }, { status: 500 });
    const redirectUri = `${origin}${redirectPath}`;

    // Exchange code for tokens.
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const tokenJson: any = await tokenRes.json().catch(() => null);

    if (!tokenRes.ok) {
      return NextResponse.json({ error: "Token exchange failed", details: tokenJson }, { status: 400 });
    }

    const refreshToken = tokenJson?.refresh_token;
    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh_token in eBay response" }, { status: 400 });
    }

    const upsert = await supabaseAdmin
      .from("ebay_accounts")
      .upsert(
        {
          user_id: userId,
          refresh_token: refreshToken,
          access_token: tokenJson?.access_token,
          token_expires_at: tokenJson?.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null,
          scopes: tokenJson?.scope || null,
        },
        { onConflict: "user_id" }
      );

    if (upsert.error) {
      return NextResponse.json({ error: "Failed to store eBay tokens", details: upsert.error.message }, { status: 500 });
    }

    // Basic redirect back to account, and clear the state cookie.
    const res = NextResponse.redirect(`${origin}/account?ebay=connected`);
    const secure = origin.startsWith("https://");
    res.cookies.set("ebay_oauth_state", "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/ebay/oauth/callback",
      maxAge: 0,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
