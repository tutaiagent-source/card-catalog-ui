export function driveToImageSrc(url?: string | null) {
  const raw = String(url || "").trim();
  if (!raw) return raw;

  const fallbackId = raw.match(/\/d\/([^/?]+)/)?.[1] || raw.match(/[?&]id=([^&]+)/)?.[1];

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");
    const isGoogleDrive = host === "drive.google.com" || host === "docs.google.com";
    if (!isGoogleDrive) return raw;

    const explicitId = parsed.searchParams.get("id") || fallbackId;
    if (explicitId) return `https://drive.google.com/uc?export=view&id=${explicitId}`;

    const parts = parsed.pathname.split("/").filter(Boolean);
    const dIndex = parts.indexOf("d");
    if (dIndex !== -1 && parts[dIndex + 1]) {
      return `https://drive.google.com/uc?export=view&id=${parts[dIndex + 1]}`;
    }
  } catch {
    if (fallbackId) return `https://drive.google.com/uc?export=view&id=${fallbackId}`;
  }

  return raw;
}
