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
    const honeypot = String(body.honeypot ?? "").trim();
    const message = String(body.message ?? "").trim();

    // Honeypot: spambots often fill it. Real users won’t touch it.
    if (honeypot) {
      return NextResponse.json({ error: "Spam detected" }, { status: 400 });
    }

    if (!subjectLabel) {
      return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email is required (please enter a valid email)." },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Message too short" }, { status: 400 });
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
      const message =
        (data as any)?.error?.message ??
        (data as any)?.message ??
        (data as any)?.error ??
        JSON.stringify(data);

      return NextResponse.json(
        { error: message, details: data },
        { status: 400 }
      );
    }

    // Optional auto-acknowledgement to the sender (so they know we received it)
    if (safeEmail) {
      const ackSubject = `[CardCat] We received your message: ${subjectLabel}`;
      const ackText = [
        `Hi${name ? ` ${name}` : ""},`,
        "",
        "Thanks for reaching out to CardCat! We received your message and we’ll review it soon.",
        `Topic: ${subjectLabel}`,
        "",
        "— CardCat Support",
      ].join("\n");

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: safeEmail,
            subject: ackSubject,
            text: ackText,
          }),
        });
      } catch {
        // Don’t fail the contact submission if auto-ack fails.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
