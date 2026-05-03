import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
}

export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
    }

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.user.id;

    const { data: account, error: accErr } = await supabaseAdmin
      .from("ebay_accounts")
      .select("id, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (accErr) {
      return NextResponse.json({ error: accErr.message }, { status: 500 });
    }

    return NextResponse.json({ connected: Boolean(account), displayName: account?.display_name || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
