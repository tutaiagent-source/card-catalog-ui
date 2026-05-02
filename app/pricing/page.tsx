import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";
import BinderBackground from "@/components/BinderBackground";

export const metadata: Metadata = {
  title: "Pricing | CardCat",
  description:
    "Compare Collector, Pro, and Seller plans for catalog limits, listings, and sold tracking analytics.",
};

const plans = [
  {
    tier: "Collector",
    highlight: false,
    accent: "bg-emerald-500/[0.06] border-emerald-500/20",
    priceMonthly: "$5 / month",
    priceAnnual: "$50 / year",
    caps:
      "Up to 250 catalog cards and 10 active CardCat Market listings.",
    features: [
      "Cleaner catalog browsing",
      "Personal Collection (PC) view",
      "Manual add/edit",
      "Basic sold tracking + basic dashboard",
    ],
  },
  {
    tier: "Pro",
    highlight: true,
    accent: "bg-amber-500/[0.06] border-amber-500/20",
    priceMonthly: "$10 / month",
    priceAnnual: "$100 / year",
    caps:
      "Up to 1,000 catalog cards and 50 active CardCat Market listings.",
    features: [
      "CSV import/export and bulk inventory tools",
      "Profit/ROI metrics + deeper sold insights",
      "Sales CSV export with analytics fields",
      "Same collector workflow, with higher limits",
    ],
  },
  {
    tier: "Seller",
    highlight: false,
    accent: "bg-orange-500/[0.06] border-orange-500/20",
    priceMonthly: "$25 / month",
    priceAnnual: "$250 / year",
    caps:
      "Up to 10,000 catalog cards and 250 active CardCat Market listings.",
    features: [
      "Higher catalog and active listing caps",
      "Same Pro profit/ROI suite, scaled to volume",
      "Bulk tools + CSV exports",
      "Export-ready sold receipts and analytics",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-amber-500/25 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.10] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Pricing
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Choose a plan that fits your selling volume.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Collector keeps your catalog clean. Pro adds profit/ROI analytics.
              Seller increases your caps when you scale.
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-200">
              No CardCat buyer fees. No CardCat seller fees. Third-party services
              (payment, shipping, or external marketplaces) may charge their own fees.
              CardCat documents deals, but does not process payments or provide escrow.
            </p>
          </div>
        </section>

        <BinderBackground>
          <section className="mt-10">
          <div className="grid gap-4 lg:gap-6">
            <div className="grid grid-cols-1 gap-4 border border-white/10 rounded-[32px] bg-white/[0.04] p-6 lg:grid-cols-[0.95fr_1.4fr_0.7fr] lg:items-start">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Plan
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Features
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Pricing options
              </div>
            </div>

            {plans.map((p) => (
              <div
                key={p.tier}
                className={`relative grid grid-cols-1 gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[0.95fr_1.4fr_0.7fr] lg:items-start ${
                  p.highlight ? "shadow-[0_30px_90px_rgba(245,158,11,0.08)]" : ""
                }`}
              >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 rounded-[32px] border border-white/10 bg-white/[0.02] translate-y-1 opacity-40" />
                <div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      p.accent
                    }`}
                  >
                    {p.tier}
                  </div>

                  <div className="mt-4 text-sm text-slate-300">
                    {p.priceMonthly} <span className="text-slate-400">or</span> {p.priceAnnual}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm leading-6 text-slate-200">
                    {p.caps}
                  </div>
                </div>

                <div className="space-y-2">
                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-white/30" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <a
                    href="/login"
                    className={`block rounded-xl border border-white/10 bg-[#d50000] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b80000]`}
                  >
                    Sign in to start monthly
                  </a>
                  <a
                    href="/login"
                    className={`block rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]`}
                  >
                    Sign in to start annual
                  </a>
                  <div className="text-xs text-slate-400">
                    Your signup and checkout happen after you sign in.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </BinderBackground>
      </div>
    </main>
  );
}
