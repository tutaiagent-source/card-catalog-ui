import { NextResponse } from "next/server";

import { stripe, stripeConfigured } from "@/lib/stripeServer";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdminClient";
import { buildSubscriptionWelcomeEmail } from "@/lib/subscriptionWelcomeEmail";

function getRequiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function priceIdToTier(priceId: string): "collector" | "pro" | "seller" | null {
  const collectorMonthly = getRequiredEnv("STRIPE_COLLECTOR_PRICE_MONTHLY_ID");
  const collectorAnnual = getRequiredEnv("STRIPE_COLLECTOR_PRICE_ANNUAL_ID");
  const proMonthly = getRequiredEnv("STRIPE_PRO_PRICE_MONTHLY_ID");
  const proAnnual = getRequiredEnv("STRIPE_PRO_PRICE_ANNUAL_ID");
  const sellerMonthly = getRequiredEnv("STRIPE_SELLER_PRICE_MONTHLY_ID");
  const sellerAnnual = getRequiredEnv("STRIPE_SELLER_PRICE_ANNUAL_ID");

  if (priceId === collectorMonthly || priceId === collectorAnnual) return "collector";
  if (priceId === proMonthly || priceId === proAnnual) return "pro";
  if (priceId === sellerMonthly || priceId === sellerAnnual) return "seller";
  return null;
}

async function sendSubscriptionWelcomeEmail({
  tier,
  recipientEmail,
}: {
  tier: "collector" | "pro" | "seller";
  recipientEmail: string;
}) {
  if (!recipientEmail) return;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("Server misconfigured: missing RESEND_API_KEY");

  const fromEmail = process.env.RESEND_FROM_EMAIL || "support@cardcat.io";

  const email = buildSubscriptionWelcomeEmail(tier);

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipientEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const message = (data as any)?.error?.message ?? (data as any)?.message ?? "Resend error";
    throw new Error(message);
  }

  const resendMessageId: string | undefined = (data as any)?.id;

  return resendMessageId ?? null;
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

        const recipientEmail: string | undefined =
          session?.customer_details?.email || session?.customer_email || undefined;

        if (!userId) {
          console.warn("Missing subscription user_id metadata; cannot map entitlement");
          break;
        }

        const currentPeriodEnd = subscription.current_period_end ? Number(subscription.current_period_end) : null;

        if (!tier) {
          console.warn(`Unknown Stripe priceId for checkout.session.completed: ${priceId}. Skipping entitlement update.`);
          break;
        }

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

        // Send a welcome email once per user (initial signup only), race-safe under webhook retries.
        if (recipientEmail && (subscription.status === "active" || subscription.status === "trialing")) {
          const emailType = "subscription_welcome";
          const planName = tier === "pro" ? "Pro" : tier === "seller" ? "Seller" : "Collector";
          const stripeSubscriptionId = subscription.id;

          let claimedEmailEventId: string | null = null;

          // User-level gate (so this stays correct even if uniqueness is mid-migration).
          // We query all rows to avoid the “maybeSingle returns a failed row even though another row is already sent” edge case.
          const { data: existingBeforeClaimRows } = await supabaseAdmin
            .from("email_events")
            .select("id, status")
            .eq("email_type", emailType)
            .eq("user_id", userId);

          const rows = Array.isArray(existingBeforeClaimRows) ? existingBeforeClaimRows : [];
          const hasSentOrSending = rows.some((r) => r?.status === "sent" || r?.status === "sending");
          if (hasSentOrSending) break;

          const failedRow = rows.find((r) => r?.status === "failed");
          if (failedRow?.id) {
            const { data: reClaimed, error: reClaimErr } = await supabaseAdmin
              .from("email_events")
              .update({
                stripe_subscription_id: stripeSubscriptionId,
                recipient_email: recipientEmail,
                plan_name: planName,
                status: "sending",
                resend_message_id: null,
              })
              .eq("id", failedRow.id)
              .eq("status", "failed")
              .select("id")
              .maybeSingle();

            if (reClaimErr) throw reClaimErr;
            claimedEmailEventId = reClaimed?.id ?? null;
          }

          // Claim (insert) before sending so retries cannot double-send.
          if (!claimedEmailEventId) {
            try {
              const { data: claimed, error: claimErr } = await supabaseAdmin
                .from("email_events")
                .insert({
                  user_id: userId,
                  email_type: emailType,
                  stripe_subscription_id: stripeSubscriptionId,
                  recipient_email: recipientEmail,
                  plan_name: planName,
                  status: "sending",
                  resend_message_id: null,
                })
                .select("id")
                .maybeSingle();

              if (claimErr) throw claimErr;
              claimedEmailEventId = claimed?.id ?? null;
            } catch (e: any) {
              // If already claimed/sent, just read status; if failed, we try to re-claim.
              const existingCode = e?.code;
              if (existingCode !== "23505") {
                console.error("Welcome email claim failed (continuing to check existing state)", e);
              }

              const { data: existingRows } = await supabaseAdmin
                .from("email_events")
                .select("id, status")
                .eq("email_type", emailType)
                .eq("user_id", userId);

              const existing = Array.isArray(existingRows) ? existingRows : [];
              if (!existing.length) break;

              const hasSentOrSendingExisting = existing.some(
                (r) => r?.status === "sent" || r?.status === "sending"
              );
              if (hasSentOrSendingExisting) break;

              const failedExistingRow = existing.find((r) => r?.status === "failed");
              if (failedExistingRow?.id) {
                const { data: reClaimed, error: reClaimErr } = await supabaseAdmin
                  .from("email_events")
                  .update({
                    stripe_subscription_id: stripeSubscriptionId,
                    recipient_email: recipientEmail,
                    plan_name: planName,
                    status: "sending",
                    resend_message_id: null,
                  })
                  .eq("id", failedExistingRow.id)
                  .eq("status", "failed")
                  .select("id")
                  .maybeSingle();

                if (reClaimErr) throw reClaimErr;
                claimedEmailEventId = reClaimed?.id ?? null;
              }
            }
          }

          if (!claimedEmailEventId) {
            // Either already sent, currently sending, or could not re-claim.
            break;
          }

          try {
            const resendMessageId = await sendSubscriptionWelcomeEmail({
              tier,
              recipientEmail,
            });

            await supabaseAdmin.from("email_events").update({
              status: "sent",
              resend_message_id: resendMessageId,
            }).eq("id", claimedEmailEventId).eq("status", "sending");
          } catch (sendErr) {
            console.error("Subscription welcome email send failed", sendErr);
            await supabaseAdmin
              .from("email_events")
              .update({ status: "failed" })
              .eq("id", claimedEmailEventId)
              .eq("status", "sending");
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const subscriptionId: string | undefined = subscription?.id;
        const userId: string | undefined = subscription?.metadata?.user_id;
        if (!userId) break;

        // Fail-safe: do not silently overwrite the user's tier with "collector" when the priceId is unknown.
        // On subscription deletion we still mark the entitlement inactive, but we preserve the existing tier
        // if we can't map the Stripe price.
        const { data: existingEnt } = await supabaseAdmin
          .from("user_entitlements")
          .select("tier")
          .eq("user_id", userId)
          .maybeSingle();

        const fallbackTier: "collector" | "pro" | "seller" =
          existingEnt?.tier === "pro" || existingEnt?.tier === "seller" || existingEnt?.tier === "collector"
            ? existingEnt.tier
            : "collector";

        let mappedTier: "collector" | "pro" | "seller" | null = null;
        if (subscriptionId) {
          try {
            const fullSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
            });
            const priceId = fullSubscription?.items?.data?.[0]?.price?.id;
            mappedTier = priceId ? priceIdToTier(priceId) : null;
          } catch (e) {
            console.warn("Could not map tier from deleted subscription items; preserving existing tier.", e);
          }
        }

        const tierToSet: "collector" | "pro" | "seller" = mappedTier ?? fallbackTier;

        await supabaseAdmin.from("user_entitlements").upsert(
          {
            user_id: userId,
            tier: tierToSet,
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

        if (!tier) {
          console.warn(`Unknown Stripe priceId for invoice.paid: ${priceId}. Skipping entitlement update.`);
          break;
        }

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
