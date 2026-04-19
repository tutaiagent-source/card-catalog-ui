import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Sold Tracking Guide | CardCat",
  description: "Move cards to Sold and attach sold price/date/platform so your history stays connected.",
  openGraph: {
    title: "Sold Tracking Guide | CardCat",
    description: "Move cards to Sold and attach sold price/date/platform so your history stays connected.",
    type: "website",
  },
};

export default function SoldGuidePage() {
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
              Sold
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Track Sold History Without Losing the Collection Story</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              CardCat keeps sold metadata attached to the original card record, so your catalog stays coherent over time.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">What You Enter</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {[
                ["Sold price", "sold_price"],
                ["Sold date", "sold_at"],
                ["Platform", "sale_platform"],
                ["Notes", "notes"],
              ].map(([t, f]) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">•</span>
                  <span>
                    <span className="font-semibold text-slate-100">{t}</span> <span className="text-slate-400">({f})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Why It Stays Clean</h2>
            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">One card record</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                When you move a card to Sold, CardCat updates the same underlying row. Your browsing, PC favorites, and sold history all remain connected.
              </div>
            </details>

            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Fast comps</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                The app can open recent sold listings on eBay from a card record to speed up market checks.
              </div>
            </details>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Backup Anytime</h2>
          <p className="mt-2 text-sm leading-7 text-amber-100/90">
            Sold data is exportable. Use the backup guide to keep your inventory portable.
          </p>
          <a href="/guides/export-backup" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
            Go to Exports <span aria-hidden>→</span>
          </a>
        </section>
      </div>
    </main>
  );
}
