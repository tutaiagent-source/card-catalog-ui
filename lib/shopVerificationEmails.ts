export type ShopType = "physical" | "online";

type EmailKind =
  | "submission" // user submitted shop info
  | "verified" // admin approved
  | "changes_requested" // admin asked for changes
  | "rejected"; // admin rejected

type ShopVerificationEmailData = {
  recipientName?: string;
  recipientEmail?: string;
  username?: string;

  shopName?: string;
  shopType?: ShopType;
  shopAddress?: string;
  shopPhone?: string;
  shopWebsite?: string;

  adminNote?: string;

  // for admin notifications
  adminLink?: string;
};

function getBaseUrl() {
  const raw = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_ORIGIN || "https://cardcat.io";
  return String(raw).replace(/\/$/, "");
}

function formatShopLine(label: string, value?: string | null) {
  const v = String(value || "").trim();
  return v ? `${label}: ${v}` : null;
}

function buildHtmlList(lines: Array<string | null>) {
  const items = lines.filter(Boolean).map((l) => `<li style="margin: 0 0 6px 0;">${l}</li>`);
  return `<ul style="margin: 0; padding-left: 18px;">${items.join("")}</ul>`;
}

function buildShopSummary(data: ShopVerificationEmailData, mode: "submission" | "verified" | "changes_requested" | "rejected") {
  const shopNameLine = formatShopLine("Shop", data.shopName);
  const typeLine = formatShopLine("Shop type", data.shopType);

  const lines: Array<string | null> = [shopNameLine, typeLine];
  if (data.shopType === "physical") {
    lines.push(formatShopLine("Address", data.shopAddress));
  } else if (data.shopType === "online") {
    lines.push(formatShopLine("Website", data.shopWebsite));
  }

  lines.push(formatShopLine("Phone", data.shopPhone));
  lines.push(formatShopLine("Website", data.shopType === "physical" ? data.shopWebsite : data.shopWebsite));

  // Filter blanks again.
  const cleaned = lines.map((l) => (l ? l : null));
  const listHtml = buildHtmlList(cleaned);

  const linesText = cleaned.filter(Boolean).map((l) => String(l)).join("\n");
  return { listHtml, linesText, mode };
}

export function buildShopVerificationEmail(kind: EmailKind, data: ShopVerificationEmailData) {
  const baseUrl = getBaseUrl();
  const username = data.username ? `@${data.username.replace(/^@/, "")}` : "";

  const shop = buildShopSummary(data, kind);

  const greeting = data.recipientName
    ? `Hi ${data.recipientName},`
    : username
      ? `Hi ${username},`
      : "Hi,";

  if (kind === "submission") {
    const subject = `[CardCat] Shop verification request received`;
    const text = [
      greeting,
      "\nThanks for submitting your CardCat shop info for verification.",
      "Here’s what we received:",
      shop.linesText || "(details provided)",
      "\nWe’ll review it manually and update you soon.",
      "\nSupport: https://cardcat.io/contact",
      "— CardCat",
    ].join("\n");

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; line-height: 1.5;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0; font-size: 20px;">Shop verification request received</h2>
          <p style="margin: 12px 0 0;">${greeting.replace(/,$/, "")} </p>
          <p style="margin: 12px 0 0;">Thanks for submitting your CardCat shop info for verification.</p>
          <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Details we received</div>
            ${shop.listHtml}
          </div>
          <p style="margin: 16px 0 0;">We’ll review it manually and update you soon.</p>
          <p style="margin: 16px 0 0; font-size: 13px; color: #334155;">Support: <a href="${baseUrl}/contact">${baseUrl}/contact</a></p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">— CardCat</p>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

  if (kind === "verified") {
    const subject = `[CardCat] Your shop is verified ✅`;
    const text = [
      greeting,
      "\nGood news: your shop info has been approved and is now verified on CardCat.",
      "\nApproved details:",
      shop.linesText || "(details verified)",
      "\nNote: Public address/phone/website visibility still follows your “show publicly” toggles.",
      "\nThanks!",
      "— CardCat",
    ].join("\n");

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; line-height: 1.5;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0; font-size: 20px;">Your shop is verified ✅</h2>
          <p style="margin: 12px 0 0;">${greeting.replace(/,$/, "")} </p>
          <p style="margin: 12px 0 0;">Good news: your shop info has been approved and is now verified on CardCat.</p>
          <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Approved details</div>
            ${shop.listHtml}
          </div>
          <p style="margin: 16px 0 0;">Public address/phone/website visibility still follows your “show publicly” toggles.</p>
          <p style="margin: 16px 0 0; font-size: 13px; color: #475569;">— CardCat</p>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

  if (kind === "changes_requested") {
    const subject = `[CardCat] Changes requested for your shop verification`;
    const text = [
      greeting,
      "\nAdmin requested changes to your shop verification.",
      "\nAdmin note:",
      data.adminNote ? data.adminNote : "(no note provided)",
      "\nSubmitted details:",
      shop.linesText || "(details provided)",
      "\nPlease update your info in your Account page and resubmit for verification.",
      "\nSupport: https://cardcat.io/contact",
      "— CardCat",
    ].join("\n");

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; line-height: 1.5;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0; font-size: 20px;">Changes requested</h2>
          <p style="margin: 12px 0 0;">${greeting.replace(/,$/, "")} </p>
          <p style="margin: 12px 0 0;">Admin requested changes to your shop verification.</p>
          <div style="margin-top: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px;">
            <div style="font-weight: 700;">Admin note</div>
            <div style="margin-top: 8px; white-space: pre-wrap;">${String(data.adminNote || "(no note provided)").replace(/</g, "&lt;")}</div>
          </div>
          <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Submitted details</div>
            ${shop.listHtml}
          </div>
          <p style="margin: 16px 0 0;">Please update your info in your Account page and resubmit for verification.</p>
          <p style="margin: 16px 0 0; font-size: 13px; color: #334155;">Support: <a href="${baseUrl}/contact">${baseUrl}/contact</a></p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">— CardCat</p>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

  // rejected
  const subject = `[CardCat] Shop verification not approved`;
  const text = [
    greeting,
    "\nThanks for submitting your shop verification.",
    "Unfortunately, your request was not approved.",
    "\nShop details:",
    shop.linesText || "(details provided)",
    "\nIf you believe this is a mistake, you can resubmit your info from your Account page.",
    "\nSupport: https://cardcat.io/contact",
    "— CardCat",
  ].join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; line-height: 1.5;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0; font-size: 20px;">Shop verification not approved</h2>
        <p style="margin: 12px 0 0;">${greeting.replace(/,$/, "")} </p>
        <p style="margin: 12px 0 0;">Unfortunately, your shop verification request was not approved.</p>
        <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Shop details</div>
          ${shop.listHtml}
        </div>
        <p style="margin: 16px 0 0;">If you believe this is a mistake, you can resubmit your info from your Account page.</p>
        <p style="margin: 16px 0 0; font-size: 13px; color: #334155;">Support: <a href="${baseUrl}/contact">${baseUrl}/contact</a></p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">— CardCat</p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export function buildShopAdminNotificationEmail(kind: EmailKind, data: ShopVerificationEmailData) {
  const baseUrl = getBaseUrl();
  const username = data.username ? `@${data.username.replace(/^@/, "")}` : "(unknown user)";
  const link = data.adminLink || `${baseUrl}/admin/shops`;

  const subjectMap: Record<EmailKind, string> = {
    submission: `[CardCat Admin] New shop verification request`,
    verified: `[CardCat Admin] Shop verification approved`,
    changes_requested: `[CardCat Admin] Shop verification changes requested`,
    rejected: `[CardCat Admin] Shop verification rejected`,
  };

  const subject = subjectMap[kind];

  const shopLines = buildShopSummary(data, kind).linesText || "";

  const notePart = data.adminNote ? `\nAdmin note:\n${data.adminNote}` : "";

  const text = [
    subject,
    "",
    `User: ${username}`,
    `Recipient email: ${data.recipientEmail || "(unknown)"}`,
    "",
    "Shop submission:",
    shopLines || "(details provided)",
    notePart,
    "",
    `Admin review: ${link}`,
    "",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; line-height: 1.5;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0; font-size: 18px;">${subject}</h2>
        <p style="margin: 12px 0 0;"><strong>User:</strong> ${username}</p>
        <p style="margin: 8px 0 0;"><strong>Recipient email:</strong> ${data.recipientEmail || "(unknown)"}</p>
        <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <div style="font-weight: 700; margin-bottom: 8px;">Shop details</div>
          ${buildShopSummary(data, kind).listHtml}
        </div>
        ${data.adminNote ? `<div style="margin-top: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px;">
          <div style="font-weight: 700;">Admin note</div>
          <div style="margin-top: 8px; white-space: pre-wrap;">${String(data.adminNote).replace(/</g, "&lt;")}</div>
        </div>` : ""}
        <p style="margin: 16px 0 0;">Admin review: <a href="${link}">${link}</a></p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export async function sendShopVerificationEmail({
  to,
  kind,
  data,
  from,
}: {
  to: string;
  kind: EmailKind;
  data: ShopVerificationEmailData;
  from?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Server misconfigured: missing RESEND_API_KEY");
  }

  const fromEmail = from || process.env.RESEND_FROM_EMAIL || "support@cardcat.io";

  const email = buildShopVerificationEmail(kind, data);

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    const message = (data as any)?.error?.message ?? (data as any)?.message ?? "Resend error";
    throw new Error(message);
  }
}

export async function sendShopAdminNotificationEmail({
  to,
  kind,
  data,
  from,
}: {
  to: string;
  kind: EmailKind;
  data: ShopVerificationEmailData;
  from?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Server misconfigured: missing RESEND_API_KEY");
  }

  const fromEmail = from || process.env.RESEND_FROM_EMAIL || "support@cardcat.io";

  const email = buildShopAdminNotificationEmail(kind, data);

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    const message = (data as any)?.error?.message ?? (data as any)?.message ?? "Resend error";
    throw new Error(message);
  }
}
