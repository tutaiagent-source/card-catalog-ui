import { NextResponse } from "next/server";

import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";

export async function GET(req: Request) {
  try {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const adminUserId = authUser.user.id;

    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", adminUserId)
      .maybeSingle();

    if (profileError || !adminProfile?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (String(adminProfile.username).trim().toLowerCase() !== "cardcat") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: pending, error: pendingErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, shop_name, shop_address, shop_phone, shop_website, shop_show_address, shop_show_phone, shop_show_website, shop_verification_status, created_at"
      )
      .eq("is_shop", true)
      .eq("shop_verification_status", "pending")
      .order("created_at", { ascending: false });

    if (pendingErr) {
      return NextResponse.json({ error: pendingErr.message }, { status: 500 });
    }

    return NextResponse.json({ pending: pending ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
