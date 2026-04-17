import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";
import { ImportShowcase, PcShowcase, SoldShowcase } from "@/components/MarketingScreens";

export const metadata: Metadata = {
  title: "Pro Plan | CardCat",
  description:
    "CardCat Pro plan unlocks CSV import/export, bulk tools, and deeper sold insights including profit and ROI metrics for your seller workflow.",
  openGraph: {
    title: "Pro Plan | CardCat",
    description:
      "CardCat Pro plan unlocks CSV import/export, bulk tools, and deeper sold insights including profit and ROI metrics for your seller workflow.",
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
            <h2 className="text-2xl font-bold text-white">What Pro unlocks</h2>
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
            <h2 className="text-2xl font-bold text-white">Best for</h2>
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
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Tools for import, cleanup, and profit decisions</h2>
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
            <h2 className="text-2xl font-bold text-white">Collector vs Pro (quick visual)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Collector is built for organization. Pro is built for workflows that need import/export, bulk tools, and profit/ROI visibility.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Plan comparison</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Everything Pro adds (clearly)</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Collector covers organization and basic sold tracking. Pro expands workflows with import/export, bulk actions, and profit/ROI-ready analytics.
            </p>

            <div className="mt-6 grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.7fr_0.7fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Feature</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Collector</div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.10] p-4 text-sm font-semibold text-amber-200">Pro</div>
              </div>

              {[
                ["Up to 100 cards", true, true],
                ["More room to grow", false, true],
                ["Manual card entry", true, true],
                ["CSV import/export", false, true],
                ["Personal Collection (PC) view", true, true],
                ["Cleaner catalog browsing", true, true],
                ["Basic sold tracking", true, true],
                ["Advanced sold insights", false, true],
                ["Profit + ROI metrics", false, true],
                ["Sales CSV export with analytics fields", false, true],
              ].map(([feature, cOn, pOn]) => (
                <div key={String(feature)} className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.7fr_0.7fr] items-center">
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

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start with Pro
              </a>
              <a href="/collector" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                See Collector
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-white">Collector plan still included</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Pro includes all Collector capabilities, plus seller-focused tools and deeper sold analytics.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/collector" className="rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-5 py-3 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/[0.12]">
                Compare With Collector
              </a>
              <a href="/" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                Back to Home
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">FAQ</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Pro questions</h2>

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
