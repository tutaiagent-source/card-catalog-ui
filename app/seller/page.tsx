import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";
import { CatalogShowcase, PcShowcase, SoldShowcase, ImportShowcase } from "@/components/MarketingScreens";

export const metadata: Metadata = {
  title: "Seller Plan | CardCat",
  description:
    "CardCat Seller plan unlocks everything in Pro, plus higher caps for catalog size and active Market listings (up to 10,000 cards + 250 active listings).",
  openGraph: {
    title: "Seller Plan | CardCat",
    description:
      "CardCat Seller plan unlocks everything in Pro, plus higher caps for catalog size and active Market listings (up to 10,000 cards + 250 active listings).",
    type: "website",
  },
};

export default function SellerPlanPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-orange-500/25 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.10] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
              Seller Plan
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Built for real seller volume.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Seller includes everything in Pro, plus higher caps for catalog size and active Market listings (up to 10,000 cards + 250 active listings).
              <span className="block mt-1 text-sm text-slate-200">
                You keep the same profit/ROI dashboards and CSV exports, just scaled for higher volume.
              </span>
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-200">
              Membership keeps the marketplace cleaner with no CardCat buyer fees and no CardCat seller fees. CardCat helps document deals, but does not process payments or provide escrow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(245,158,11,0.28)] transition-colors hover:bg-[#d97706]"
              >
                Create Account
              </a>
              <a
                href="/features"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
              >
                See Full Feature Overview
              </a>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <h2 className="text-2xl font-bold text-white">What Seller Unlocks</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              {[
                "Higher caps for catalog + active listings (10,000 cards + 250 active Market listings)",
                "CSV Import And Export (same as Pro)",
                "Bulk Inventory Tools (same as Pro)",
                "Advanced Sold Tracking + Seller Analytics (same profit/ROI suite as Pro)",
                "Profit / ROI Metrics (same calculations as Pro)",
                "Sales CSV Export With Analytics Fields (same exports as Pro)",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <h2 className="text-2xl font-bold text-white">Best For</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Active sellers who need higher throughput and more active listings. Seller is the same analytics as Pro, just scaled to higher volume.
            </p>
            <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/[0.08] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">Seller tip</div>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                Keep your sold updates tight (fees, shipping, and card cost) so your net profit, ROI, and exports stay consistent.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Seller Screens</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Workflow for listing, selling, and receipts</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Seller-focused tracking stays connected to your card records, so you can manage inventory, follow up in Messages, and download sales exports with analytics fields.
            </p>
          </div>

          <ImportShowcase />
          <SoldShowcase />
          <CatalogShowcase />
          <PcShowcase />
        </section>

        <section className="mt-12 rounded-[32px] border border-orange-500/25 bg-orange-500/[0.06] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Pro → Seller</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Same Pro suite, higher limits</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              If you like Pro’s workflow (CSV import/export, bulk tools, and profit/ROI dashboards + sales exports), Seller is mainly for scaling.
              <span className="block">You keep the same suite, but raise the caps to support bigger catalogs and more active listings.</span>
            </p>

            <div className="mt-6 grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.6fr_0.6fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Feature</div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.10] p-4 text-sm font-semibold text-amber-200">Pro</div>
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.12] p-4 text-sm font-semibold text-orange-200">Seller</div>
              </div>

              {[
                ["Up to 1,000 cards (Pro cap)", true, false],
                ["Up to 10,000 cards (Seller cap)", false, true],
                ["50 active Market listings (Pro cap)", true, false],
                ["250 active Market listings (Seller cap)", false, true],
                ["Pro’s suite (CSV import/export, bulk tools, profit/ROI + sales exports) is the same suite, scaled", true, true],
              ].map(([feature, pOn, sOn]) => (
                <div key={String(feature)} className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.6fr_0.6fr] items-center">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">{String(feature)}</div>

                  <div
                    className={`rounded-2xl border border-amber-500/20 p-4 text-center text-sm font-semibold ${
                      pOn ? "bg-amber-500/[0.10] text-amber-200" : "bg-white/[0.02] text-slate-500"
                    }`}
                  >
                    {pOn ? "✓" : "—"}
                  </div>

                  <div
                    className={`rounded-2xl border border-orange-500/20 p-4 text-center text-sm font-semibold ${
                      sOn ? "bg-orange-500/[0.12] text-orange-200" : "bg-white/[0.02] text-slate-500"
                    }`}
                  >
                    {sOn ? "✓" : "—"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(245,158,11,0.28)] transition-colors hover:bg-[#d97706]"
              >
                Start with Seller
              </a>
              <a href="/pro" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                See Pro
              </a>
              <a href="/collector" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                See Collector
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">FAQ</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Seller Questions</h2>

            <div className="mt-6 space-y-4">
              {[{ 
                q: "Is Seller just higher caps, or are tools different?",
                a: "Yes, mostly. Seller is Pro plus higher caps for catalog size and active Market listings (10,000 cards + 250 active listings), so you don't hit limits as you scale. The profit/ROI analytics and exports use the same calculations as Pro.",
              }, {
                q: "Does Seller export sold data with profit/ROI fields?",
                a: "Yes. Seller exports include the same analytics fields, so your reports match the Sold dashboard calculations.",
              }, {
                q: "Do I still get my Personal Collection (PC) view?",
                a: "Yes. PC separation is part of the core collector workflow that carries forward into Pro and Seller.",
              }].map((item) => (
                <details key={item.q} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-white">{item.q}</summary>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
