import MarketingNav from "@/components/MarketingNav";
import PhoneFeatureMockup from "@/components/PhoneFeatureMockup";

import BinderBackground from "@/components/BinderBackground";
import StatusChip from "@/components/StatusChip";

export default function CatalogFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <BinderBackground>
          <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <StatusChip status="catalog" icon="📚" />
              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Catalog your cards without the spreadsheet mess.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Add cards, images, values, notes, and quick comp links in one organized place.
              </p>
              </div>

              <div>
                <PhoneFeatureMockup variant="catalog" />
              </div>
            </div>
          </section>
        </BinderBackground>

        <section className="mt-8 space-y-4 lg:space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">What it does</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Track your full collection
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Add images, values, and notes
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Jump quickly to eBay sold comps
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">Why it matters</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Know what you own, what it may be worth, and what you want to keep, list, or sell.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">How it fits into the workflow</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Catalog → Listings → Market → Sold
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
            >
              Start Your Collection
            </a>
            <a
              href="/pricing"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
            >
              View Plans
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
