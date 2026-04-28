import MarketingNav from "@/components/MarketingNav";
import PhoneFeatureMockup from "@/components/PhoneFeatureMockup";
import PlanTierCaps from "@/components/PlanTierCaps";

export default function PcFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              ⭐ PC
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Keep your favorite cards in one place.
            </h1>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">What</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                PC is where you save the cards that matter most to you.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">How</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Mark any card from your Catalog as PC and keep it in a dedicated area for quick viewing and value tracking.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">Why</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Your personal collection should be easy to admire, manage, and reference without getting mixed in with what you’re selling.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/40 p-6">
            <h3 className="text-lg font-bold text-white">PC essentials</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                Save favorite cards
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

          <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold text-white">Your PC, always tidy</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  PC keeps your favorites separate from the cards you’re trying to sell, so your personal view stays easy to revisit.
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                    Star any card from Catalog
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                    Keep PC value signals up to date
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                    Tap through details fast
                  </li>
                </ul>
              </div>
              <PhoneFeatureMockup variant="pc" />
            </div>
          </section>

          <PlanTierCaps className="mt-8" />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
            >
              Build Your PC
            </a>
            <a
              href="/pro"
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
