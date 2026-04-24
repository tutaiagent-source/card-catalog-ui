type ImageVariant = "grid" | "detail" | "zoom";

type ImageSrcOptions = {
  variant?: ImageVariant;
};

const DRIVE_SIZE_BY_VARIANT: Record<ImageVariant, string> = {
  grid: "w600",
  detail: "w1400",
  zoom: "w2000",
};

const SUPABASE_WIDTH_BY_VARIANT: Record<ImageVariant, number> = {
  grid: 600,
  detail: 1400,
  zoom: 2000,
};

function buildDriveImageUrl(fileId: string, resourceKey?: string | null, variant: ImageVariant = "zoom") {
  const params = new URLSearchParams({ id: fileId, sz: DRIVE_SIZE_BY_VARIANT[variant] });
  if (resourceKey) params.set("resourcekey", resourceKey);
  return `https://drive.google.com/thumbnail?${params.toString()}`;
}

function buildSupabaseRenderUrl(raw: string, parsed: URL, variant: ImageVariant) {
  const objectPrefix = "/storage/v1/object/public/";
  if (!parsed.pathname.includes(objectPrefix)) return raw;

  const publicPath = parsed.pathname.split(objectPrefix)[1];
  if (!publicPath) return raw;

  const params = new URLSearchParams(parsed.search);
  params.set("width", String(SUPABASE_WIDTH_BY_VARIANT[variant]));
  params.set("quality", variant === "grid" ? "75" : "85");

  return `${parsed.origin}/storage/v1/render/image/public/${publicPath}?${params.toString()}`;
}

export function driveToImageSrc(url?: string | null, options?: ImageSrcOptions) {
  const raw = String(url || "").trim();
  if (!raw) return raw;

  const variant = options?.variant || "zoom";
  const fallbackId = raw.match(/\/d\/([^/?]+)/)?.[1] || raw.match(/[?&]id=([^&]+)/)?.[1];
  const fallbackResourceKey = raw.match(/[?&]resourcekey=([^&]+)/)?.[1];

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");
    const isGoogleDrive = host === "drive.google.com" || host === "docs.google.com";
    if (!isGoogleDrive) return buildSupabaseRenderUrl(raw, parsed, variant);

    const resourceKey = parsed.searchParams.get("resourcekey") || fallbackResourceKey;
    const explicitId = parsed.searchParams.get("id") || fallbackId;
    if (explicitId) return buildDriveImageUrl(explicitId, resourceKey, variant);

    const parts = parsed.pathname.split("/").filter(Boolean);
    const dIndex = parts.indexOf("d");
    if (dIndex !== -1 && parts[dIndex + 1]) {
      return buildDriveImageUrl(parts[dIndex + 1], resourceKey, variant);
    }
  } catch {
    if (fallbackId) return buildDriveImageUrl(fallbackId, fallbackResourceKey, variant);
  }

  return raw;
}
