import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { driveToImageSrc } from "@/lib/googleDrive";

function isUuidV4Like(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get("token");
  const token = String(rawToken || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const cardIdRaw = request.nextUrl.searchParams.get("cardId");
  const cardId = String(cardIdRaw || "").trim();
  const sideRaw = String(request.nextUrl.searchParams.get("side") || "front").toLowerCase();
  const side: "front" | "back" = sideRaw === "back" ? "back" : "front";
  const variantParam = String(request.nextUrl.searchParams.get("variant") || "detail").toLowerCase();
  const variant: "grid" | "detail" = variantParam === "grid" ? "grid" : "detail";

  if (!token || !cardId || !isUuidV4Like(cardId)) {
    return NextResponse.json({ error: "Missing token or invalid cardId" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const { data: share, error } = await supabaseAdmin
    .from("listing_shares")
    .select("owner_user_id, expires_at, revoked_at")
    .eq("share_token", token)
    .maybeSingle();

  if (error || !share) {
    return NextResponse.json({ error: "Invalid share token" }, { status: 404 });
  }

  if (share.revoked_at) {
    return NextResponse.json({ error: "Share revoked" }, { status: 403 });
  }

  if (share.expires_at) {
    const exp = new Date(share.expires_at);
    if (Number.isFinite(exp.getTime()) && exp.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Share expired" }, { status: 403 });
    }
  }

  const { owner_user_id: ownerUserId } = share as { owner_user_id?: string | null };
  if (!ownerUserId) {
    return NextResponse.json({ error: "Share missing owner" }, { status: 500 });
  }

  const { data: card, error: cardErr } = await supabaseAdmin
    .from("cards")
    .select("image_url, back_image_url")
    .eq("id", cardId)
    .eq("user_id", ownerUserId)
    .eq("status", "Listed")
    .maybeSingle();

  if (cardErr || !card) {
    return NextResponse.json({ error: "Card not in shared listings" }, { status: 404 });
  }

  const { image_url: imageUrl, back_image_url: backImageUrl } = card as { image_url?: string | null; back_image_url?: string | null };
  const rawImageUrl = String(side === "back" ? backImageUrl : imageUrl || "").trim();
  if (!rawImageUrl) {
    return NextResponse.json({ error: "Requested image missing" }, { status: 404 });
  }

  let renderSrc: string;
  try {
    renderSrc = driveToImageSrc(rawImageUrl, { variant });
  } catch {
    return NextResponse.json({ error: "Could not build image URL" }, { status: 400 });
  }

  let renderUrlParsed: URL;
  try {
    renderUrlParsed = new URL(renderSrc);
  } catch {
    return NextResponse.json({ error: "Invalid render URL" }, { status: 400 });
  }

  const host = renderUrlParsed.hostname.replace(/^www\./, "").toLowerCase();
  const envSupabaseHost = (() => {
    try {
      const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!v) return null;
      return new URL(v).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return null;
    }
  })();

  const isSafeHost =
    (envSupabaseHost && host === envSupabaseHost) ||
    host.endsWith(".supabase.co") ||
    host === "drive.google.com" ||
    host === "docs.google.com";
  if (!isSafeHost) {
    return NextResponse.json({ error: "Disallowed image host" }, { status: 403 });
  }

  const upstream = await fetch(renderSrc, {
    headers: {
      "user-agent": "CardCat Listings Share Image Proxy",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "Upstream did not return an image" }, { status: 415 });
  }
  const arrayBuffer = await upstream.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "content-type": contentType,
      // Revocable/shared content: keep caching intentionally short.
      "cache-control": variant === "grid"
        ? "private, max-age=60, s-maxage=60"
        : "private, max-age=15, s-maxage=15",
    },
  });
}
