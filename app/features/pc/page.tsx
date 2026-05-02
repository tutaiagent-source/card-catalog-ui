import MarketingNav from "@/components/MarketingNav";
import PhoneFeatureMockup from "@/components/PhoneFeatureMockup";

import BinderBackground from "@/components/BinderBackground";
import StatusChip from "@/components/StatusChip";

export default function PcFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <BinderBackground>
          <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <StatusChip status="pc" icon="⭐" />
              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Keep your favorite cards in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                PC gives your personal collection its own dedicated space.
              </p>
              </div>

              <div>
                <PhoneFeatureMockup variant="pc" />
              </div>
            </div>
          </section>
        </BinderBackground>

        <section className="mt-8 space-y-4 lg:space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">What it does</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Star cards from your Catalog
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Track PC value
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Keep PC separate from sale inventory
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">Why it matters</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Your favorites stay easy to reference
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Your sale inventory stays clean
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Value tracking helps you decide what to sell
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">How it fits into the workflow</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Catalog → Listings → Market → Sold</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
            >
              Build Your PC
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
