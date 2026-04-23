import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

export async function GET(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get("token");
  const token = String(rawToken || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  if (!rawToken || !token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: "Supabase admin not configured" }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("listing_shares")
    .select("created_at, expires_at, revoked_at, show_pricing")
    .eq("share_token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    found: Boolean(data),
    share: data
      ? {
          created_at: data.created_at,
          expires_at: data.expires_at,
          revoked_at: data.revoked_at,
          show_pricing: data.show_pricing,
        }
      : null,
  });
}
