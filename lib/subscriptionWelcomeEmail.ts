export type SubscriptionTier = "collector" | "pro" | "seller";

type PlanDetails = {
  planName: string;
  monthlyPrice: string;
  catalogUpTo: string;
  activeListings: string;
  showRoiNetProfit: boolean;
};

function tierToPlanDetails(tier: SubscriptionTier): PlanDetails {
  switch (tier) {
    case "collector":
      return {
        planName: "Collector",
        monthlyPrice: "$5/month",
        catalogUpTo: "Up to 250 cards",
        activeListings: "10 active CardCat Market listings",
        showRoiNetProfit: false,
      };
    case "pro":
      return {
        planName: "Pro",
        monthlyPrice: "$10/month",
        catalogUpTo: "Up to 1,000 cards",
        activeListings: "50 active CardCat Market listings",
        showRoiNetProfit: true,
      };
    case "seller":
      return {
        planName: "Seller",
        monthlyPrice: "$25/month",
        catalogUpTo: "Up to 10,000 cards",
        activeListings: "250 active CardCat Market listings",
        showRoiNetProfit: true,
      };
  }
}

export function buildSubscriptionWelcomeEmail(tier: SubscriptionTier) {
  const d = tierToPlanDetails(tier);

  const baseUrl = String(
    (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_ORIGIN || "https://cardcat.io").replace(/\/$/, "")
  );

  const subject = `Welcome to CardCat — You’re on the ${d.planName} plan`;
  const text = [
    `Congrats, you’ve signed up for the ${d.planName} plan.`,
    "",
    "Your plan includes:",
    `- ${d.catalogUpTo}`,
    `- ${d.activeListings}`,
    "- PC area",
    "- Listings manager",
    "- Messages and offers",
    "- Deal Records and receipts",
    "- Sold dashboard",
    "- CSV import/export",
    ...(d.showRoiNetProfit ? ["- ROI / net profit tracking"] : []),
    "",
    "Quick start:",
    "1) Add your first card to your Catalog",
    "2) Mark favorite cards as PC",
    "3) Move cards into Listings when you’re ready to sell",
    "4) Publish cards to the CardCat Market",
    "5) Use Messages and Offers to make deals",
    "6) Download Deal Records and receipts after a sale",
    "",
    "Dashboard: /catalog",
    "Support: /contact",
    "",
    "Important: CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes. CardCat also does not charge buyer/seller transaction fees; third-party payment, shipping, or external marketplaces may charge their own fees.",
  ].join("\n");

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; line-height: 1.45;">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
      <div>
          <img
          src="${baseUrl}/brand/card_cat_horizontal.svg"
          alt="CardCat"
          width="220"
          style="display:block; height:auto; max-width:100%; margin: 0 0 6px 0; object-fit:contain;"
        />
      </div>
      <h1 style="margin: 8px 0 0; font-size: 26px; letter-spacing: -0.02em;">Welcome to CardCat</h1>
      <p style="margin: 12px 0 0; font-size: 16px;">Congrats, you’ve signed up for the <strong>${d.planName}</strong> plan.</p>

      <div style="margin-top: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
        <div style="font-weight: 600; margin-bottom: 8px;">Your plan includes</div>
        <ul style="margin: 0; padding-left: 18px;">
          <li>${d.catalogUpTo}</li>
          <li>${d.activeListings}</li>
          <li>PC area</li>
          <li>Listings manager</li>
          <li>Messages and offers</li>
          <li>Deal Records and receipts</li>
          <li>Sold dashboard</li>
          <li>CSV import/export</li>
          ${d.showRoiNetProfit ? "<li>ROI / net profit tracking</li>" : ""}
        </ul>
      </div>

      <div style="margin-top: 18px;">
        <div style="font-weight: 600; margin-bottom: 8px;">Quick start</div>
        <ol style="margin: 0; padding-left: 18px;">
          <li>Add your first card to your Catalog</li>
          <li>Mark favorite cards as PC</li>
          <li>Move cards into Listings when you’re ready to sell</li>
          <li>Publish cards to the CardCat Market</li>
          <li>Use Messages and Offers to make deals</li>
          <li>Download Deal Records and receipts after a sale</li>
        </ol>
      </div>

      <div style="margin-top: 18px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="${baseUrl}/catalog" style="display: inline-block; background: #d50000; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 10px; font-weight: 700;">Go to Dashboard</a>
        <a href="${baseUrl}/add-card" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 10px; font-weight: 700;">Add Your First Card</a>
      </div>

      <div style="margin-top: 16px; font-size: 14px; color: #334155;">
        Useful links:
        <ul style="margin: 8px 0 0; padding-left: 18px;">
          <li><a href="${baseUrl}/catalog">Dashboard</a></li>
          <li><a href="${baseUrl}/add-card">Add Card</a></li>
          <li><a href="${baseUrl}/pc">PC</a></li>
          <li><a href="${baseUrl}/listed">Listings</a></li>
          <li><a href="${baseUrl}/market">Market</a></li>
          <li><a href="${baseUrl}/sold">Sold</a></li>
          <li><a href="${baseUrl}/import">Import CSV</a></li>
          <li><a href="${baseUrl}/account">Account / Billing</a></li>
          <li><a href="${baseUrl}/contact">Help / Support</a></li>
        </ul>
      </div>

      <div style="margin-top: 18px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0 0 8px;">Important note:</p>
        <p style="margin: 0;">CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes.</p>
        <p style="margin: 8px 0 0;">CardCat also does not charge buyer/seller transaction fees. Third-party payment platforms, shipping providers, or external marketplaces may charge their own fees.</p>
      </div>
    </div>
  </div>
  `;

  return { subject, text, html };
}
