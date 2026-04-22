import { NextResponse } from "next/server";

const SUPPORT_EMAIL = "support@cardcat.io";

function isValidEmail(email: string) {
  const trimmed = email.trim();
  return trimmed.includes("@") && trimmed.includes(".");
}

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.RESEND_TO_EMAIL || SUPPORT_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL || SUPPORT_EMAIL;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const subjectLabel = String(body.subjectLabel ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!subjectLabel) {
      return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const safeEmail = email && isValidEmail(email) ? email : "";

    const subject = `[CardCat Contact] ${subjectLabel}`;

    const text = [
      message,
      "",
      "---",
      "Collector details (optional):",
      `Name: ${name || "N/A"}`,
      `Email: ${safeEmail || "N/A"}`,
    ].join("\n");

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject,
        text,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to send email", details: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
