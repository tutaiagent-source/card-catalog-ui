import { NextResponse } from "next/server";

import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";
import {
  sendShopAdminNotificationEmail,
  sendShopVerificationEmail,
} from "@/lib/shopVerificationEmails";

export async function POST(req: Request) {
  try {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const profileId = String((await req.json().catch(() => ({})) )?.profile_id || authUser.user.id || "").trim();
    if (!profileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });

    // Only notify for the authenticated user's own profile.
    if (profileId !== authUser.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch latest shop row to read pending fields when reverification is required.
    const { data: row, error: rowErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, username, shop_verification_status, shop_type, " +
          "shop_name, shop_address, shop_phone, shop_website, " +
          "pending_shop_name, pending_shop_address, pending_shop_phone, pending_shop_website, pending_shop_type"
      )
      .eq("id", profileId)
      .maybeSingle();

    if (rowErr || !row) {
      return NextResponse.json({ error: rowErr?.message || "Profile not found" }, { status: 404 });
    }

    const r: any = row as any;

    const status = String(r.shop_verification_status || "").toLowerCase();
    const isReverification = status === "reverification_required";

    const effective = {
      username: r.username,
      shopName: isReverification ? r.pending_shop_name : r.shop_name,
      shopType: (isReverification ? r.pending_shop_type : r.shop_type) as any,
      shopAddress: isReverification ? r.pending_shop_address : r.shop_address,
      shopPhone: isReverification ? r.pending_shop_phone : r.shop_phone,
      shopWebsite: isReverification ? r.pending_shop_website : r.shop_website,
    };

    const userEmail = authUser.user?.email;
    const recipientName = authUser.user?.user_metadata?.name || undefined;

    const kind = "submission" as const;

    // User email: request received.
    // Admin notification: new submission.
    try {
      if (userEmail) {
        await sendShopVerificationEmail({
          to: userEmail,
          kind,
          data: {
            recipientName,
            recipientEmail: userEmail,
            username: effective.username,
            shopName: effective.shopName,
            shopType: effective.shopType,
            shopAddress: effective.shopAddress,
            shopPhone: effective.shopPhone,
            shopWebsite: effective.shopWebsite,
          },
        });
      }
    } catch (e) {
      console.error("Shop verification submit user-email failed", e);
    }

    const adminTo = "support@cardcat.io";
    try {
      await sendShopAdminNotificationEmail({
        to: adminTo,
        kind,
        data: {
          recipientEmail: userEmail || undefined,
          username: effective.username,
          shopName: effective.shopName,
          shopType: effective.shopType,
          shopAddress: effective.shopAddress,
          shopPhone: effective.shopPhone,
          shopWebsite: effective.shopWebsite,
        },
      });
    } catch (e) {
      console.error("Shop verification submit admin-email failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
