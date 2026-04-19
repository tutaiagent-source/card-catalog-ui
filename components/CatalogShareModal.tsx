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

function cleanParallel(parallel: string) {
  const value = String(parallel || "").trim();
  if (!value || value.toLowerCase() === "n/a") return "";
  return value;
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
        await navigator.share({ title, text: caption });
        return;
      } catch {
        // fall through
      }
    }
    await copyCaption();
  }

  async function downloadShareImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(40, 40, 1000, 1000, 40);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.roundRect(80, 80, 920, 560, 32);
    ctx.fill();

    if (card.image_url) {
      try {
        const cardImage = await loadImage(driveToImageSrc(card.image_url), "anonymous");
        const imageRatio = cardImage.width / cardImage.height;
        const boxRatio = 920 / 560;
        let drawWidth = 920;
        let drawHeight = 560;
        let drawX = 80;
        let drawY = 80;

        if (imageRatio > boxRatio) {
          drawHeight = 920 / imageRatio;
          drawY = 80 + (560 - drawHeight) / 2;
        } else {
          drawWidth = 560 * imageRatio;
          drawX = 80 + (920 - drawWidth) / 2;
        }

        ctx.drawImage(cardImage, drawX, drawY, drawWidth, drawHeight);
      } catch {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(80, 80, 920, 560);
      }
    }

    const title = [card.year, card.player_name].filter(Boolean).join(" ");
    const titleLines = wrapText(title, 24).slice(0, 3);
    const detailLines = [card.set_name, cleanParallel(card.parallel), card.serial_number_text ? `Serial: ${card.serial_number_text}` : ""].filter(Boolean);

    ctx.textAlign = "center";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 46px Inter, Arial, sans-serif";
    titleLines.forEach((line, index) => {
      ctx.fillText(line, 540, 720 + index * 58);
    });

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 28px Inter, Arial, sans-serif";
    detailLines.forEach((line, index) => {
      ctx.fillText(line, 540, 870 + index * 40);
    });

    if (includePrice && price.trim()) {
      ctx.fillStyle = "#86efac";
      ctx.font = "700 52px Inter, Arial, sans-serif";
      ctx.fillText(`$${price.trim()}`, 540, 1010);
    }

    ctx.textAlign = "left";
    try {
      const logo = await loadImage("/icon.svg");
      ctx.drawImage(logo, 850, 955, 42, 42);
    } catch {
      // fall back to text only
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 24px Inter, Arial, sans-serif";
    ctx.fillText("CardCat", 904, 985);

    const a = document.createElement("a");
    const name = slugify([card.year, card.player_name, card.set_name].filter(Boolean).join(" ")) || "cardcat-share";
    a.href = canvas.toDataURL("image/jpeg", 0.92);
    a.download = `${name}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-slate-950 p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Share card</div>
            <h3 className="mt-2 text-xl font-bold text-white">Create a clean post image for selling groups</h3>
            <p className="mt-1 text-sm text-slate-400">Price is optional. Download a square image or use your device share sheet.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/10 bg-slate-900 p-4">
            <div className="mx-auto aspect-square max-w-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-[0_25px_80px_rgba(2,6,23,0.45)]">
              <div className="flex h-full flex-col">
                <div className="relative flex-[0_0_58%] overflow-hidden border-b border-white/10 bg-slate-950">
                  {card.image_url ? (
                    <img src={driveToImageSrc(card.image_url)} alt={card.player_name} className="h-full w-full object-contain" />
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
                    {includePrice && price.trim() ? <div className="mt-5 text-3xl font-bold text-emerald-300">${price.trim()}</div> : null}
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
  );
}
