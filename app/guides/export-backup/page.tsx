import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Exports & Backups Guide | CardCat",
  description: "Export inventory and sold history CSVs so your collection stays portable.",
  openGraph: {
    title: "Exports & Backups Guide | CardCat",
    description: "Export inventory and sold history CSVs so your collection stays portable.",
    type: "website",
  },
};

export default function ExportBackupGuidePage() {
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
              Exports & Backups
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Export your inventory + sold data any time</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Your collection stays yours. Backup your inventory from Catalog and export your sold history from Sold.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Inventory export (Catalog)</h2>
            <div className="mt-3 text-sm leading-7 text-slate-300">
              Use Catalog exports as your portability layer. If you do cleanup in Sheets/Excel, you can always rebuild your import.
            </div>
            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">When to export</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Export after meaningful updates: big imports, bulk edits, or before you make risky CSV changes.
              </div>
            </details>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Sold export (Sold)</h2>
            <div className="mt-3 text-sm leading-7 text-slate-300">
              Sold exports keep history attached to the same card records. Pro exports can include deeper analytics fields for more useful downstream analysis.
            </div>
            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">What you get</summary>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Sold price/date/platform, plus any profit/ROI analytics fields your plan unlocks.
              </div>
            </details>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Want the best import first?</h2>
          <p className="mt-2 text-sm leading-7 text-amber-100/90">
            Clean inputs lead to clean exports. Start with the CSV guide and optionally use the LLM reformat prompt.
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
