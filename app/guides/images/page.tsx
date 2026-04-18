import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Image Upload Guide | CardCat",
  description: "Supported front/back image formats, sizing rules, and how CardCat handles large iPhone images.",
  openGraph: {
    title: "Image Upload Guide | CardCat",
    description: "Supported front/back image formats, sizing rules, and how CardCat handles large iPhone images.",
    type: "website",
  },
};

export default function ImagesGuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Images
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Front & back images that look great in previews</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              CardCat supports front/back images for better browsing and flipping previews. If an image is too large, CardCat will resize/compress it before upload.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Supported formats</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "PNG",
                "JPG",
                "WebP",
                "GIF",
              ].map((f) => (
                <span key={f} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Sizing policy</div>
              <div className="mt-2 text-sm leading-6 text-slate-100">
                CardCat targets images that are safe for the UI. If your PNG/JPG/WebP is larger than the limits, it’s resized and converted to WebP before upload.
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">How to set images (CSV)</h2>
            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Use these fields</summary>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <div><span className="font-semibold text-slate-100">image_url</span> → front image</div>
                <div><span className="font-semibold text-slate-100">back_image_url</span> → back image</div>
              </div>
            </details>

            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Tip</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                If you want flipping previews, include <span className="font-semibold text-slate-100">back_image_url</span> whenever you have a back photo.
              </div>
            </details>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Need a CSV first?</h2>
          <p className="mt-2 text-sm leading-7 text-amber-100/90">
            Start with the CSV guide, then use the LLM reformat prompt if your columns don’t match.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/guides/csv" className="inline-flex items-center rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-sm font-semibold text-amber-200 hover:text-amber-100">CSV Import</a>
            <a href="/guides/csv/llm" className="inline-flex items-center rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-sm font-semibold text-amber-200 hover:text-amber-100">LLM Reformat</a>
          </div>
        </section>
      </div>
    </main>
  );
}
