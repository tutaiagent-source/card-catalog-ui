import { NextResponse } from "next/server";

import { stripe, stripeConfigured } from "@/lib/stripeServer";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";

function getRequiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function priceIdToTier(priceId: string) {
  const proMonthly = getRequiredEnv("STRIPE_PRO_PRICE_MONTHLY_ID");
  const proAnnual = getRequiredEnv("STRIPE_PRO_PRICE_ANNUAL_ID");
  const sellerMonthly = getRequiredEnv("STRIPE_SELLER_PRICE_MONTHLY_ID");
  const sellerAnnual = getRequiredEnv("STRIPE_SELLER_PRICE_ANNUAL_ID");

  if (priceId === proMonthly || priceId === proAnnual) return "pro";
  if (priceId === sellerMonthly || priceId === sellerAnnual) return "seller";
  return "collector";
}

export async function POST(req: Request) {
  try {
    if (!stripeConfigured || !supabaseAdminConfigured || !stripe || !supabaseAdmin) {
      return new NextResponse("Stripe/Supabase admin not configured", { status: 500 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new NextResponse("Missing stripe-signature", { status: 400 });
    }

    const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");

    const rawBody = Buffer.from(await req.arrayBuffer());

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const subscriptionId: string | undefined = session?.subscription;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"],
        });

        const item = subscription.items.data[0];
        const priceId = item?.price?.id;
        if (!priceId) break;

        const tier = priceIdToTier(priceId);
        const userId = subscription.metadata?.user_id as string | undefined;

        if (!userId) {
          console.warn("Missing subscription user_id metadata; cannot map entitlement");
          break;
        }

        const currentPeriodEnd = subscription.current_period_end ? Number(subscription.current_period_end) : null;

        await supabaseAdmin.from("user_entitlements").upsert(
          {
            user_id: userId,
            tier,
            status: "active",
            stripe_customer_id:
              typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
            stripe_subscription_id: subscription.id,
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" }
        );

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const subscriptionId: string | undefined = subscription?.id;
        const userId: string | undefined = subscription?.metadata?.user_id;
        if (!userId) break;

        let tier: "collector" | "pro" | "seller" = "collector";
        if (subscriptionId) {
          try {
            const fullSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
            });
            const priceId = fullSubscription?.items?.data?.[0]?.price?.id;
            if (priceId) tier = priceIdToTier(priceId);
          } catch (e) {
            console.warn("Could not map tier from deleted subscription items; defaulting to collector", e);
          }
        }

        await supabaseAdmin.from("user_entitlements").upsert(
          {
            user_id: userId,
            tier,
            status: "inactive",
            stripe_subscription_id: subscriptionId,
            current_period_end: null,
          },
          { onConflict: "user_id" }
        );

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId: string | undefined = invoice?.subscription;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"],
        });

        const priceId = subscription?.items?.data?.[0]?.price?.id;
        if (!priceId) break;

        const userId = subscription.metadata?.user_id as string | undefined;
        if (!userId) break;

        const currentPeriodEnd = subscription.current_period_end ? Number(subscription.current_period_end) : null;
        const tier = priceIdToTier(priceId);

        await supabaseAdmin.from("user_entitlements").upsert(
          {
            user_id: userId,
            tier,
            status: "active",
            stripe_customer_id:
              typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
            stripe_subscription_id: subscription.id,
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" }
        );

        break;
      }

      default:
        break;
    }

    return new NextResponse("ok", { status: 200 });
  } catch (e: any) {
    console.error("Webhook error", e);
    return new NextResponse(`Webhook Error: ${e?.message || "Unknown"}`, { status: 400 });
  }
}
