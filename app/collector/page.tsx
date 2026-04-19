import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";
import { CatalogShowcase, PcShowcase, SoldShowcase } from "@/components/MarketingScreens";

export const metadata: Metadata = {
  title: "Collector Plan | CardCat",
  description:
    "CardCat Collector plan helps you organize your personal collection with clean catalog browsing, a dedicated PC view, and simple sold tracking.",
  openGraph: {
    title: "Collector Plan | CardCat",
    description:
      "CardCat Collector plan helps you organize your personal collection with clean catalog browsing, a dedicated PC view, and simple sold tracking.",
    type: "website",
  },
};

export default function CollectorPlanPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Collector Plan
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              A clean home for your collection.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Keep your catalog searchable, your Personal Collection focused, and your sold history attached to the original card.
              Collector is built for fast day-to-day organization without extra complexity.
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
                See What’s Included
              </a>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <h2 className="text-2xl font-bold text-white">What Collector gives you</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              {[
                "Up To 150 Cards",
                "Manual Card Entry",
                "Personal Collection (PC) View",
                "Cleaner Catalog Browsing",
                "Basic Sold Tracking",
                "Quick context via Recent Sold Listings",
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
              Collectors who want organization first. If you mainly care about browsing your catalog, keeping PC separate, and recording sold dates and prices, Collector keeps it simple.
            </p>
            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Collector tip</div>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                Use the Catalog flow to keep card fields consistent. Sold history stays connected to the same card record so your future self can find everything faster.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Collector Screens</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">What you’ll actually use every day</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              These are the core workflow screens the Collector plan focuses on: catalog browsing, PC organization, and sold tracking context.
            </p>
          </div>

          <CatalogShowcase />
          <PcShowcase />
          <SoldShowcase />
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Collector Workflow</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Simple, clean, and always connected</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Collector keeps your day-to-day flow tight: browse the catalog, keep PC separate, and record sold info on the same card record.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1) Catalog",
                  body: "Search, filter, and move through your inventory without clutter.",
                },
                {
                  title: "2) Personal Collection",
                  body: "Keep favorites in the PC view so your “real home” stays readable.",
                },
                {
                  title: "3) Sold tracking",
                  body: "Attach sold price/date to the card record for quick future lookup.",
                },
              ].map((step) => (
                <div key={step.title} className="rounded-[28px] border border-white/10 bg-slate-950/50 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                  <div className="text-sm font-semibold text-white">{step.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{step.body}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start with Collector
              </a>
              <a
                href="/features"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
              >
                Compare Screens
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Plan comparison</div>
            <h2 className="mt-3 text-2xl font-bold text-white">What’s different in Pro</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Collector keeps your workflow clean. Pro adds seller-focused workflow upgrades, including import/export, bulk tools, and profit/ROI analytics.
            </p>

            <div className="mt-6 grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_0.7fr_0.7fr]">
                <div className="rounded-2xl border border-amber-500/20 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Feature</div>
                <div className="rounded-2xl border border-amber-500/20 bg-slate-950/40 p-4 text-sm font-semibold text-slate-100">Collector</div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.10] p-4 text-sm font-semibold text-amber-200">Pro</div>
              </div>

              {[
                ["Up to 150 cards", true, true],
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
                href="/pro"
                className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/[0.12]"
              >
                See Pro
              </a>
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start with Collector
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">When you should upgrade</div>
              <h2 className="mt-3 text-2xl font-bold text-white">When your workflow starts becoming a seller workflow</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Pro adds CSV import/export, bulk inventory tools, and deeper sold analytics like profit and ROI. If you track costs and want export-ready insights, it’s the next step.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/pro"
                className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/[0.12]"
              >
                See Pro
              </a>
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start with Collector
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">FAQ</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Collector questions</h2>

            <div className="mt-6 space-y-4">
              {[{
                q: "Can I upgrade to Pro later?",
                a: "Yes. If you outgrow basic organization and start wanting import/export plus profit/ROI insight, Pro is your next step.",
              }, {
                q: "Is my PC separate from my catalog?",
                a: "Yes. Collector keeps your Personal Collection focused while still letting you reference the bigger inventory context.",
              }, {
                q: "Does Sold tracking stay attached to the card?",
                a: "That’s the whole idea. Sold entries remain connected to the original card record so future searching stays fast and consistent.",
              }, {
                q: "Is the app built for mobile?",
                a: "Yes. The core workflow is designed to feel clean on smaller screens, with tighter spacing and easier navigation.",
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
