"use client";

import { useMemo, useState } from "react";
import { driveToImageSrc } from "@/lib/googleDrive";

type ShareCard = {
  player_name: string;
  year: string;
  set_name: string;
  parallel: string;
  serial_number_text: string;
  asking_price?: number | null;
  image_url?: string;
  back_image_url?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars = 28) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImage(src: string, crossOrigin?: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = crossOrigin;
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function cleanParallel(parallel: string) {
  const value = String(parallel || "").trim();
  if (!value || value.toLowerCase() === "n/a") return "";
  return value;
}

function proxyImageSrc(src?: string | null) {
  const normalized = driveToImageSrc(src);
  if (!normalized) return "";
  return `/api/image-proxy?src=${encodeURIComponent(normalized)}`;
}

function buildCaption(card: ShareCard, includePrice: boolean, price: string) {
  const lines = [
    [card.year, card.player_name].filter(Boolean).join(" "),
    card.set_name,
    cleanParallel(card.parallel),
    card.serial_number_text ? `Serial: ${card.serial_number_text}` : "",
    includePrice && price.trim() ? `Price: $${price.trim()}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

export default function CatalogShareModal({ card, onClose }: { card: ShareCard; onClose: () => void }) {
  const [includePrice, setIncludePrice] = useState(Boolean(card.asking_price));
  const [price, setPrice] = useState(card.asking_price != null ? Number(card.asking_price).toFixed(2) : "");
  const parallel = cleanParallel(card.parallel);
  const hasBackImage = Boolean(card.back_image_url);
  const caption = useMemo(() => buildCaption(card, includePrice, price), [card, includePrice, price]);

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      alert("Share caption copied.");
    } catch {
      alert("Could not copy the caption on this device.");
    }
  }

  async function nativeShare() {
    const title = [card.year, card.player_name].filter(Boolean).join(" ");
    if (navigator.share) {
      try {
        const canvas = await renderShareCanvas();
        const blob = await canvasToBlob(canvas);
        const name = `${slugify([card.year, card.player_name, card.set_name].filter(Boolean).join(" ")) || "cardcat-share"}.jpg`;
        if (blob) {
          const file = new File([blob], name, { type: "image/jpeg" });
          const shareData = { title, text: caption, files: [file] };
          if (!(navigator as Navigator & { canShare?: (data: ShareData) => boolean }).canShare || (navigator as Navigator & { canShare?: (data: ShareData) => boolean }).canShare?.(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        await navigator.share({ title, text: caption });
        return;
      } catch {
        // fall through
      }
    }
    await copyCaption();
  }

  async function renderShareCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(40, 40, 1000, 1000, 40);
    ctx.fill();

    const imageBoxes = hasBackImage
      ? [
          { x: 80, y: 80, width: 440, height: 700, src: card.image_url, label: "Front" },
          { x: 560, y: 80, width: 440, height: 700, src: card.back_image_url, label: "Back" },
        ]
      : [{ x: 80, y: 80, width: 920, height: 720, src: card.image_url, label: "Card" }];

    for (const box of imageBoxes) {
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.width, box.height, 32);
      ctx.fill();

      if (box.src) {
        try {
          const cardImage = await loadImage(proxyImageSrc(box.src));
          const imageRatio = cardImage.width / cardImage.height;
          const boxRatio = box.width / box.height;
          let drawWidth = box.width;
          let drawHeight = box.height;
          let drawX = box.x;
          let drawY = box.y;

          if (imageRatio > boxRatio) {
            drawHeight = box.width / imageRatio;
            drawY = box.y + (box.height - drawHeight) / 2;
          } else {
            drawWidth = box.height * imageRatio;
            drawX = box.x + (box.width - drawWidth) / 2;
          }

          ctx.drawImage(cardImage, drawX, drawY, drawWidth, drawHeight);
        } catch {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(box.x, box.y, box.width, box.height);
        }
      }

      if (hasBackImage) {
        ctx.fillStyle = "rgba(2,6,23,0.72)";
        ctx.beginPath();
        ctx.roundRect(box.x + 18, box.y + 18, 86, 34, 17);
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 18px Inter, Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(box.label, box.x + 42, box.y + 41);
      }
    }

    const title = [card.year, card.player_name].filter(Boolean).join(" ");
    const titleLines = wrapText(title, 24).slice(0, 2);
    const meta = [cleanParallel(card.parallel), card.serial_number_text ? `Serial: ${card.serial_number_text}` : ""].filter(Boolean).join(" • ");
    const metaLines = wrapText(meta, 42).slice(0, 2);
    const panelY = hasBackImage ? 805 : 820;
    const panelHeight = hasBackImage ? 215 : 180;

    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.roundRect(80, panelY, 920, panelHeight, 30);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 44px Inter, Arial, sans-serif";
    titleLines.forEach((line, index) => {
      ctx.fillText(line, 540, panelY + 58 + index * 48);
    });

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 28px Inter, Arial, sans-serif";
    ctx.fillText(card.set_name, 540, panelY + 118 + Math.max(0, titleLines.length - 1) * 18);
    ctx.font = "500 24px Inter, Arial, sans-serif";
    metaLines.forEach((line, index) => {
      ctx.fillText(line, 540, panelY + 152 + Math.max(0, titleLines.length - 1) * 18 + index * 28);
    });

    if (includePrice && price.trim()) {
      ctx.fillStyle = "#86efac";
      ctx.font = "700 34px Inter, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`$${price.trim()}`, 110, panelY + panelHeight - 22);
    }

    ctx.textAlign = "left";
    try {
      const logo = await loadImage("/icon.svg");
      ctx.drawImage(logo, 850, panelY + panelHeight - 62, 42, 42);
    } catch {
      // fall back to text only
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 24px Inter, Arial, sans-serif";
    ctx.fillText("CardCat", 904, panelY + panelHeight - 32);

    return canvas;
  }

  async function downloadShareImage() {
    const canvas = await renderShareCanvas();
    const a = document.createElement("a");
    const name = slugify([card.year, card.player_name, card.set_name].filter(Boolean).join(" ")) || "cardcat-share";
    a.href = canvas.toDataURL("image/jpeg", 0.92);
    a.download = `${name}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 p-3 sm:flex sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div className="mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Share card</div>
            <h3 className="mt-2 text-xl font-bold text-white">Create a clean post image for selling groups</h3>
            <p className="mt-1 text-sm text-slate-400">Price is optional. Download a square image or use your device share sheet.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/10 bg-slate-900 p-4">
            <div className="mx-auto aspect-square max-w-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-[0_25px_80px_rgba(2,6,23,0.45)]">
              <div className="flex h-full flex-col">
                <div className={`relative ${hasBackImage ? "flex-[0_0_70%] p-3" : "flex-[0_0_72%]"} overflow-hidden border-b border-white/10 bg-slate-950`}>
                  {hasBackImage ? (
                    <div className="grid h-full grid-cols-2 gap-3">
                      {[{ src: card.image_url, label: "Front" }, { src: card.back_image_url, label: "Back" }].map((image) => (
                        <div key={image.label} className="relative overflow-hidden rounded-[22px] bg-slate-900">
                          {image.src ? (
                            <img src={proxyImageSrc(image.src)} alt={image.label} className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{image.label}</div>
                          )}
                          <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                            {image.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : card.image_url ? (
                    <img src={proxyImageSrc(card.image_url)} alt={card.player_name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_35%),linear-gradient(180deg,#111827,#020617)] text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Card image
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                    CardCat Share
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="text-center">
                    <div className="text-3xl font-black tracking-tight text-white">{[card.year, card.player_name].filter(Boolean).join(" ")}</div>
                    <div className="mt-3 text-base text-slate-300">{card.set_name}</div>
                    {parallel ? <div className="mt-2 text-sm text-slate-400">{parallel}</div> : null}
                    {card.serial_number_text ? <div className="mt-2 text-sm text-slate-400">Serial: {card.serial_number_text}</div> : null}
                    {includePrice && price.trim() ? <div className="mt-4 text-2xl font-bold text-emerald-300">${price.trim()}</div> : null}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-4 text-right text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <img src="/icon.svg" alt="CardCat" className="h-4 w-4" />
                    <span>CardCat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              <span>Include price on the share image</span>
              <input type="checkbox" checked={includePrice} onChange={(e) => setIncludePrice(e.target.checked)} />
            </label>

            <label className="mt-4 block">
              <div className="mb-2 text-sm font-semibold text-slate-200">Price</div>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Optional"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                disabled={!includePrice}
              />
            </label>

            <label className="mt-4 block">
              <div className="mb-2 text-sm font-semibold text-slate-200">Caption preview</div>
              <textarea readOnly value={caption} className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-200 outline-none" />
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={copyCaption} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">
                Copy caption
              </button>
              <button type="button" onClick={nativeShare} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">
                Share
              </button>
              <button type="button" onClick={downloadShareImage} className="rounded-2xl bg-[#d50000] px-4 py-3 text-sm font-semibold text-white hover:bg-[#b80000]">
                Download image
              </button>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">Download saves a square JPG image sized for social posts and selling groups.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
