export function mapPlanLimitErrorMessage(raw: string): string | null {
  const msg = String(raw || "");
  const lower = msg.toLowerCase();

  if (msg.includes("PLAN_LIMIT_CATALOG_CARDS_EXCEEDED")) {
    return "Plan limit reached. You can’t add more cards to your catalog on your current plan. Move some cards to Sold (or reduce quantities) and try again.";
  }

  if (msg.includes("PLAN_LIMIT_MARKET_LISTINGS_EXCEEDED")) {
    return "Plan limit reached. You can’t publish more listings to CardCat Market on your current plan. Move some listings back to Catalog (or reduce which cards are visible) and try again.";
  }

  // Fallback: sometimes the database error surfaces slightly differently.
  if (lower.includes("plan_limit_catalog_cards_exceeded")) {
    return "Plan limit reached. You can’t add more cards to your catalog on your current plan. Move some cards to Sold (or reduce quantities) and try again.";
  }
  if (lower.includes("plan_limit_market_listings_exceeded")) {
    return "Plan limit reached. You can’t publish more listings to CardCat Market on your current plan. Move some listings back to Catalog (or reduce which cards are visible) and try again.";
  }

  return null;
}
