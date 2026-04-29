import type { Metadata } from "next";
import Link from "next/link";

import MarketingNav from "@/components/MarketingNav";
import { ImportShowcase, PcShowcase, SoldShowcase } from "@/components/MarketingScreens";

export const metadata: Metadata = {
  title: "Pro Plan | CardCat",
  description:
    "CardCat Pro plan unlocks CSV import/export, bulk tools, and profit/ROI sold analytics for serious sellers (up to 1,000 cards + 50 active Market listings).",
  openGraph: {
    title: "Pro Plan | CardCat",
    description:
      "CardCat Pro plan unlocks CSV import/export, bulk tools, and profit/ROI sold analytics for serious sellers (up to 1,000 cards + 50 active Market listings).",
    type: "website",
  },
};

export default function ProPlanPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-amber-500/25 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.10] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Pro Plan
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Deeper sold insights for serious workflows.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Pro expands your workflow with CSV import/export, bulk inventory actions, and richer sold analytics like net profit and ROI.
              <span className="block mt-1 text-sm text-slate-200">
                Pro is built for serious selling within limits of up to 1,000 cards and 50 active Market listings.
              </span>
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-200">
              Membership keeps the marketplace cleaner with no CardCat buyer fees and no CardCat seller fees. CardCat helps document deals, but does not process payments or provide escrow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
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
            <h2 className="text-2xl font-bold text-white">What Pro Unlocks</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              {[
                "CSV Import And Export",
                "Bulk Inventory Tools",
                "Advanced Sold Insights",
                "Profit / ROI Metrics",
                "Richer Trends And Platform Breakdown",
                "Sales CSV Export With Analytics Fields",
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
              Sellers and serious collectors who want analytics beyond basic sold history. If you track costs, fees, and shipping, Pro helps you turn sales into numbers.
            </p>
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Pro tip</div>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                Keep your cost basis fields accurate during Sold updates. Profit and ROI charts will stay consistent and your export stays trustworthy.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Pro Screens</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Tools for Import, Cleanup & Profit Decisions</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Pro keeps your workflow moving: CSV import for cleaner rows, Sold tracking for context, and deeper analytics to help you understand ROI.
            </p>
          </div>

          <ImportShowcase />
          <SoldShowcase />
          <PcShowcase />
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/25 bg-amber-500/[0.06] p-6 sm:p-8">
          <div className="max-w-5xl">
            <h2 className="text-2xl font-bold text-white">Collector / Pro / Seller (Quick Visual)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Collector is built for organization. Pro is built for seller workflows that need import/export, bulk tools, and profit/ROI visibility.
              Seller includes Pro, then increases your caps for high-volume catalogs and active listings.
              <span className="block">The profit/ROI analytics and CSV exports are the same as Pro, just scaled to higher volume.</span>
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Collector</div>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  {[
                    "Cleaner catalog browsing",
                    "Personal Collection (PC) view",
                    "Manual card entry",
                    "Basic sold tracking",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 text-amber-300">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-amber-500/25 bg-amber-500/[0.08] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Pro</div>
                <ul className="mt-4 space-y-3 text-sm text-slate-100">
                  {[
                    "CSV import/export",
                    "Bulk inventory tools",
                    "Advanced sold insights",
                    "Profit / ROI metrics",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 text-amber-200">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-orange-500/25 bg-orange-500/[0.10] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Seller</div>
                <ul className="mt-4 space-y-3 text-sm text-slate-100">
                  {[
                    "Higher catalog + listing caps",
                    "Profit/ROI analytics at scale (same suite as Pro)",
                    "Bulk tools + exports",
                    "Export-ready sold receipts",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 text-orange-200">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Plan comparison</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Collector → Pro adds the workflow. Seller adds the headroom.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Collector gives clean organization and basic sold tracking. Pro adds the seller workflow upgrades (CSV import/export, bulk inventory tools, and profit/ROI analytics).
              Seller keeps Pro and mainly raises your catalog + active listing caps so you can stay in the same workflow as you scale.
            </p>

            <div className="mt-6 grid gap-6">
              <div>
                <div className="text-lg font-semibold text-white">Collector → Pro</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Upgrade from “organized” to “seller workflow” (imports, bulk tools, profit/ROI, and sales exports).
                </p>

                <div className="mt-4 grid gap-2">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.6fr_0.6fr]">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Feature</div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Collector</div>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.10] p-4 text-sm font-semibold text-amber-200">Pro</div>
                  </div>

                  {[
                    ["Up to 250 cards (Collector cap)", true, false],
                    ["Up to 1,000 cards (Pro cap)", false, true],
                    ["10 active Market listings (Collector cap)", true, false],
                    ["50 active Market listings (Pro cap)", false, true],
                    ["CSV import/export", false, true],
                    ["Bulk inventory tools", false, true],
                    ["Profit/ROI dashboards + Sales CSV export (analytics fields)", false, true],
                  ].map(([feature, cOn, pOn]) => (
                    <div key={String(feature)} className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.6fr_0.6fr] items-center">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">{String(feature)}</div>

                      <div
                        className={`rounded-2xl border border-white/10 p-4 text-center text-sm font-semibold ${
                          cOn ? "bg-white/[0.04] text-emerald-300" : "bg-white/[0.02] text-slate-500"
                        }`}
                      >
                        {cOn ? "✓" : "—"}
                      </div>

                      <div
                        className={`rounded-2xl border border-amber-500/20 p-4 text-center text-sm font-semibold ${
                          pOn ? "bg-amber-500/[0.10] text-amber-200" : "bg-white/[0.02] text-slate-500"
                        }`}
                      >
                        {pOn ? "✓" : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold text-white">Pro → Seller</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Same seller workflow. Higher caps so you don’t hit limits.
                </p>

                <div className="mt-4 grid gap-2">
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
                    ["Pro’s seller suite (CSV import/export, bulk tools, profit/ROI + sales exports) is the same suite, just scaled", true, true],
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
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start with Pro
              </a>
              <a href="/seller" className="rounded-xl border border-orange-500/25 bg-orange-500/[0.10] px-5 py-3 text-sm font-semibold text-orange-200 transition-colors hover:bg-orange-500/[0.14]">
                See Seller
              </a>
              <a
                href="/collector"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
              >
                See Collector
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Exports</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Export Your Inventory + Sold Data at Any Time</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Pro keeps your workflow portable. When you want a spreadsheet backup or want to analyze your results elsewhere,
              export your inventory from Catalog and your sold history from Sold.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-6">
                <h3 className="text-lg font-semibold text-white">Inventory Export (Catalog)</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Back up your cards, do cleanup in Sheets/Excel, and keep your data portable.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  {[
                    "Undo-proof backups before big edits",
                    "Move your inventory to another tool",
                    "Batch updates outside the app",
                  ].map((x) => (
                    <li key={x} className="flex items-start gap-3">
                      <span className="mt-1 text-emerald-300">•</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/[0.08] p-6">
                <h3 className="text-lg font-semibold text-white">Sales Export (Sold)</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200">Export sales with analytics fields so you can review performance quickly.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-100/90">
                  {[
                    "Track net profit + ROI in Sheets",
                    "Compare platforms and comps over time",
                    "Share a clean report with an accountant or buyer",
                  ].map((x) => (
                    <li key={x} className="flex items-start gap-3">
                      <span className="mt-1 text-amber-200">•</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-white">Collector Plan Still Included</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Pro includes all Collector capabilities, plus seller-focused tools and deeper sold analytics.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/collector" className="rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-5 py-3 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/[0.12]">
                Compare With Collector
              </a>
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">FAQ</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Pro Questions</h2>

            <div className="mt-6 space-y-4">
              {[{
                q: "Do I need profit/ROI fields to use Pro?",
                a: "You can. But Pro is also useful just for the workflow upgrades (CSV import/export, bulk actions, and richer sold trends). Profit/ROI becomes especially valuable once you track costs and fees.",
              }, {
                q: "Is CSV export ready to share?",
                a: "Yes. Pro’s exports include analytics fields so you can verify results and keep your workflow portable.",
              }, {
                q: "Will advanced charts match the CSV?",
                a: "That’s the goal: the same underlying profit/ROI calculations power both the dashboard and the sales export fields.",
              }, {
                q: "Can I keep using my Personal Collection?",
                a: "Absolutely. Pro includes everything from Collector, including PC separation and the clean inventory workflow.",
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
