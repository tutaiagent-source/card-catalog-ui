import { NextResponse } from "next/server";

import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";

type ReviewAction = "approve" | "reject";

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const targetProfileId = String(body?.profile_id || body?.user_id || body?.id || "").trim();
    const action = String(body?.action || "").trim().toLowerCase() as ReviewAction;

    if (!targetProfileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const patch =
      action === "approve"
        ? {
            shop_verification_status: "verified",
            shop_verified_at: new Date().toISOString(),
            shop_verified_by: adminUserId,
          }
        : {
            shop_verification_status: "rejected",
            shop_verified_at: null,
            shop_verified_by: null,
          };

    const { error: updateErr } = await supabaseAdmin.from("profiles").update(patch).eq("id", targetProfileId);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
