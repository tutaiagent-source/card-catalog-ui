function buildDriveImageUrl(fileId: string, resourceKey?: string | null) {
  const params = new URLSearchParams({ id: fileId, sz: "w2000" });
  if (resourceKey) params.set("resourcekey", resourceKey);
  return `https://drive.google.com/thumbnail?${params.toString()}`;
}

export function driveToImageSrc(url?: string | null) {
  const raw = String(url || "").trim();
  if (!raw) return raw;

  const fallbackId = raw.match(/\/d\/([^/?]+)/)?.[1] || raw.match(/[?&]id=([^&]+)/)?.[1];
  const fallbackResourceKey = raw.match(/[?&]resourcekey=([^&]+)/)?.[1];

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");
    const isGoogleDrive = host === "drive.google.com" || host === "docs.google.com";
    if (!isGoogleDrive) return raw;

    const resourceKey = parsed.searchParams.get("resourcekey") || fallbackResourceKey;
    const explicitId = parsed.searchParams.get("id") || fallbackId;
    if (explicitId) return buildDriveImageUrl(explicitId, resourceKey);

    const parts = parsed.pathname.split("/").filter(Boolean);
    const dIndex = parts.indexOf("d");
    if (dIndex !== -1 && parts[dIndex + 1]) {
      return buildDriveImageUrl(parts[dIndex + 1], resourceKey);
    }
  } catch {
    if (fallbackId) return buildDriveImageUrl(fallbackId, fallbackResourceKey);
  }

  return raw;
}
