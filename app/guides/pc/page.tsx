import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";
import PcPersonalLayoutPreview from "@/components/PcPersonalLayoutPreview";

export const metadata: Metadata = {
  title: "PC Guide | CardCat",
  description: "How Personal Collection (PC ★) works, how to add/remove cards, and how to reorder.",
  openGraph: {
    title: "PC Guide | CardCat",
    description: "How Personal Collection (PC ★) works, how to add/remove cards, and how to reorder.",
    type: "website",
  },
};

export default function PcGuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <a href="/guides" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
              <span aria-hidden>←</span> Back to Guides
            </a>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              PC ★
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Personal Collection That Stays Readable</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Keep your favorites in PC without losing the full inventory context. PC cards are ordered for you and stay connected to the same underlying record.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">PC ★ visual</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A clean shelf view for your favorites</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                PC keeps the “what is this card?” context from Catalog, then arranges the cards into an at-a-glance shelf so browsing feels like a hobby, not a spreadsheet.
              </p>

              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>Star in Catalog (★) to add cards to your PC shelf.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>Reorder PC and the order is saved per-card.</span>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#020617]">
              <img
                src="/pc-guide-pc-preview.jpg"
                alt="PC layout preview"
                className="block w-full h-auto object-contain"
              />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">How to Use PC</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-amber-300">1</span>
                <span>On Catalog, tap the star (★) to add a card to PC.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-amber-300">2</span>
                <span>Open PC ★ to browse your favorites in a cleaner layout.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-amber-300">3</span>
                <span>Reorder PC (drag on desktop, and use the PC ordering flow for your workflow).</span>
              </li>
            </ol>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Estimates & Previews</h2>
            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Estimated price</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                PC lets you track an estimate for cards you care about. When you update sold data later, CardCat keeps history attached to the same card record.
              </div>
            </details>

            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Front/back flipping</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Tap the image to open the preview modal, then flip to see the back when a back image is available.
              </div>
            </details>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">PC side</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Where your cards live in PC</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                PC is your Personal Collection view of the same underlying card records. When you “★ in PC” from Catalog, CardCat keeps that
                relationship and stores your ordering in PC for quick, readable browsing.
              </p>

              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>Cards keep their images and catalog details (same record).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>Your PC order is saved (so your shelf stays readable).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>Removing from PC just clears the PC position (it doesn’t delete history).</span>
                </li>
              </ul>
            </div>

            <div>
              <PcPersonalLayoutPreview />
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Next: Sold Tracking</h2>
          <p className="mt-2 text-sm leading-7 text-amber-100/90">
            Once a card sells, move it to Sold and attach the sold price/date so your history stays clean.
          </p>
          <a href="/guides/sold" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
            Go to Sold <span aria-hidden>→</span>
          </a>
        </section>
      </div>
    </main>
  );
}
