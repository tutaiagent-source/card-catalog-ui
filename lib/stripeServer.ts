import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripeConfigured = Boolean(stripeSecretKey);

export const stripe = stripeConfigured
  ? new Stripe(stripeSecretKey as string, {
      apiVersion: "2024-06-20",
      typescript: true,
    })
  : null;
