import { NextResponse } from "next/server";

import { stripe, stripeConfigured } from "@/lib/stripeServer";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";

function getRequiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    if (!stripeConfigured || !supabaseAdminConfigured || !stripe || !supabaseAdmin) {
      return NextResponse.json({ error: "Stripe/Supabase admin not configured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization: Bearer <supabase access token>" }, { status: 401 });
    }

    const { data: authUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !authUser?.user) {
      return NextResponse.json({ error: userError?.message || "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.user.id;
    const email = authUser.user.email;

    const body = await req.json();
    const tier = body?.tier;
    const interval = body?.interval;

    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    if (tier !== "collector" && tier !== "pro" && tier !== "seller") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    if (interval !== "month" && interval !== "annual") {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    const priceId = (() => {
      const proMonthly = getRequiredEnv("STRIPE_PRO_PRICE_MONTHLY_ID");
      const proAnnual = getRequiredEnv("STRIPE_PRO_PRICE_ANNUAL_ID");
      const sellerMonthly = getRequiredEnv("STRIPE_SELLER_PRICE_MONTHLY_ID");
      const sellerAnnual = getRequiredEnv("STRIPE_SELLER_PRICE_ANNUAL_ID");
      const collectorMonthly = getRequiredEnv("STRIPE_COLLECTOR_PRICE_MONTHLY_ID");
      const collectorAnnual = getRequiredEnv("STRIPE_COLLECTOR_PRICE_ANNUAL_ID");

      if (tier === "pro" && interval === "month") return proMonthly;
      if (tier === "pro" && interval === "annual") return proAnnual;
      if (tier === "seller" && interval === "month") return sellerMonthly;
      if (tier === "seller" && interval === "annual") return sellerAnnual;
      if (tier === "collector" && interval === "month") return collectorMonthly;
      if (tier === "collector" && interval === "annual") return collectorAnnual;
      throw new Error("Unexpected tier/interval");
    })();

    const { data: entitlement, error: entErr } = await supabaseAdmin
      .from("user_entitlements")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (entErr) {
      // If something is off with backfill/trigger, we still try to create a customer.
      console.warn("entitlement load error", entErr);
    }

    let customerId = entitlement?.stripe_customer_id as string | null | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await supabaseAdmin.from("user_entitlements").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
        },
        { onConflict: "user_id" }
      );
    }

    const origin = getRequiredEnv("NEXT_PUBLIC_APP_ORIGIN");

    const successUrl = `${origin}/account?checkout=success`;
    const cancelUrl = `${origin}/account?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          user_id: userId,
          tier,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout url" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
