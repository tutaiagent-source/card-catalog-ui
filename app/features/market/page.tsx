import MarketingNav from "@/components/MarketingNav";
import PhoneFeatureMockup from "@/components/PhoneFeatureMockup";

export default function MarketFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              💬 CardCat Market
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              List cards in a member marketplace with no CardCat seller fees.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              The CardCat Market is where members can browse cards, message sellers about specific cards, and make offers.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">What</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                A private member marketplace for collector-to-collector deals.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">How</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Publish cards from Listings to the Market. Buyers browse, message you, and send offers.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">Why</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                CardCat helps collectors make deals without taking a CardCat buyer or seller fee.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/40 p-6">
            <h3 className="text-lg font-bold text-white">Market essentials</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                List cards in the CardCat Market
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                Receive messages and offers
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                No CardCat buyer or seller fees
              </li>
            </ul>

            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm leading-6 text-red-100">
              CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes.
            </div>
          </div>

          <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold text-white">Message, then make the deal</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Market keeps conversations grounded in the card: message sellers about specific items, make offers, and finish the deal inside CardCat.
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    Receive messages and offers
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    Keep deal steps organized
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    Move into Sold when complete
                  </li>
                </ul>
              </div>
              <PhoneFeatureMockup variant="market" />
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
            >
              Explore the Market
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
