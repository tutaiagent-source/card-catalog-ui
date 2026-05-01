import { NextResponse } from "next/server";

import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";

import {
  sendShopAdminNotificationEmail,
  sendShopVerificationEmail,
} from "@/lib/shopVerificationEmails";

type ReviewAction = "verify" | "request_changes" | "reject";

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
    const adminNote = String(body?.admin_note || "").trim();

    if (!targetProfileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    if (!adminNote && action === "request_changes") {
      return NextResponse.json({ error: "admin_note is required for request_changes" }, { status: 400 });
    }
    if (action !== "verify" && action !== "request_changes" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // We also fetch the current row so we can decide how to handle reject (verified vs unverified).
    const { data: currentRow, error: currentErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, username, shop_verified_at, shop_verification_status, " +
          "shop_name, shop_address, shop_phone, shop_website, shop_type, avatar_url, shop_verified_by, shop_admin_note, " +
          "pending_shop_name, pending_shop_address, pending_shop_phone, pending_shop_website, pending_shop_type, pending_avatar_url"
      )
      .eq("id", targetProfileId)
      .maybeSingle();

    if (currentErr || !currentRow) {
      return NextResponse.json({ error: currentErr?.message || "Profile not found" }, { status: 404 });
    }

    const row: any = currentRow as any;

    // For verify: copy pending fields into live ones. If pending fields are empty, keep existing live values.
    // For request_changes: keep verified public info as-is.
    // For reject: if it was already verified, keep verified public info; otherwise clear.
    const isCurrentlyVerified = !!row.shop_verified_at;

    const patch =
      action === "verify"
        ? {
            shop_verification_status: "verified",
            shop_verified_at: nowIso,
            shop_verified_by: adminUserId,
            shop_name: row.pending_shop_name ? row.pending_shop_name : row.shop_name,
            shop_address: row.pending_shop_address ? row.pending_shop_address : row.shop_address,
            shop_phone: row.pending_shop_phone ? row.pending_shop_phone : row.shop_phone,
            shop_website: row.pending_shop_website ? row.pending_shop_website : row.shop_website,
            shop_type:
              String(row.shop_verification_status || "").toLowerCase() === "reverification_required" &&
              row.pending_shop_type &&
              row.pending_shop_type !== ""
                ? row.pending_shop_type
                : row.shop_type,
            avatar_url:
              row.pending_avatar_url && row.pending_avatar_url !== "" ? row.pending_avatar_url : row.avatar_url,
            shop_admin_note: "",
          }
        : action === "request_changes"
          ? {
              shop_verification_status: "changes_requested",
              shop_admin_note: adminNote,
            }
          : {
              shop_verification_status: isCurrentlyVerified ? "verified" : "rejected",
              shop_verified_at: isCurrentlyVerified ? row.shop_verified_at : null,
              shop_verified_by: isCurrentlyVerified ? row.shop_verified_by : null,
              shop_admin_note: isCurrentlyVerified ? row.shop_admin_note : "",
            };

    const { error: updateErr } = await supabaseAdmin.from("profiles").update(patch).eq("id", targetProfileId);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Emails (best-effort; never block the admin action).
    try {
      const { data: authTarget, error: authErr } = await supabaseAdmin.auth.admin.getUserById(targetProfileId);
      const targetEmail: string | undefined = authTarget?.user?.email || undefined;
      if (targetEmail) {
        const statusBefore = String(row.shop_verification_status || "").toLowerCase();
        const isReverification = statusBefore === "reverification_required";

        const effective = {
          username: row.username,
          shopName: isReverification ? row.pending_shop_name : row.shop_name,
          shopType: (isReverification ? row.pending_shop_type : row.shop_type) as any,
          shopAddress: isReverification ? row.pending_shop_address : row.shop_address,
          shopPhone: isReverification ? row.pending_shop_phone : row.shop_phone,
          shopWebsite: isReverification ? row.pending_shop_website : row.shop_website,
        };

        const kind =
          action === "verify"
            ? "verified"
            : action === "request_changes"
              ? "changes_requested"
              : "rejected";

        await sendShopVerificationEmail({
          to: targetEmail,
          kind: kind as any,
          data: {
            recipientEmail: targetEmail,
            username: effective.username,
            shopName: effective.shopName,
            shopType: effective.shopType,
            shopAddress: effective.shopAddress,
            shopPhone: effective.shopPhone,
            shopWebsite: effective.shopWebsite,
            adminNote: action === "request_changes" ? adminNote : undefined,
          },
        });
      }

      // Admin/support notification always.
      const adminTo = "support@cardcat.io";
      const statusBefore = String(row.shop_verification_status || "").toLowerCase();
      const isReverification = statusBefore === "reverification_required";
      const effective = {
        username: row.username,
        shopName: isReverification ? row.pending_shop_name : row.shop_name,
        shopType: (isReverification ? row.pending_shop_type : row.shop_type) as any,
        shopAddress: isReverification ? row.pending_shop_address : row.shop_address,
        shopPhone: isReverification ? row.pending_shop_phone : row.shop_phone,
        shopWebsite: isReverification ? row.pending_shop_website : row.shop_website,
      };

      const kind =
        action === "verify"
          ? "verified"
          : action === "request_changes"
            ? "changes_requested"
            : "rejected";

      await sendShopAdminNotificationEmail({
        to: adminTo,
        kind: kind as any,
        data: {
          recipientEmail: targetEmail || undefined,
          username: effective.username,
          shopName: effective.shopName,
          shopType: effective.shopType,
          shopAddress: effective.shopAddress,
          shopPhone: effective.shopPhone,
          shopWebsite: effective.shopWebsite,
          adminNote: action === "request_changes" ? adminNote : undefined,
        },
      });
    } catch (e) {
      console.error("Shop verification review-email failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
