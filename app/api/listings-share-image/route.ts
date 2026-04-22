import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const src = request.nextUrl.searchParams.get("src");

  if (!token || !src) {
    return NextResponse.json({ error: "Missing token or src" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const { data: share, error } = await supabaseAdmin
    .from("listing_shares")
    .select("expires_at, revoked_at")
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

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      "user-agent": "CardCat Listings Share Image Proxy",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await upstream.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
