import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      "user-agent": "CardCat Image Proxy",
    },
    cache: "force-cache",
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await upstream.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
