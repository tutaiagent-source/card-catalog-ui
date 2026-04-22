"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  children: React.ReactNode;
};

export default function MarketingImageLightbox({ src, alt, children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-zoom-in overflow-hidden rounded-[28px]"
        aria-label={`Open preview: ${alt}`}
      >
        {children}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className="absolute right-0 top-0 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-sm text-white hover:bg-black/60"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <img src={src} alt={alt} className="block w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
