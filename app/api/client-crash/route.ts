import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // eslint-disable-next-line no-console
    console.log("[client-crash]", {
      id: body?.id,
      at: body?.at,
      href: body?.href,
      lastClickedHref: body?.lastClickedHref,
      type: body?.type,
      message: body?.message,
      stack: body?.stack,
      userAgent: body?.userAgent,
    });
  } catch (_e) {
    // ignore
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

