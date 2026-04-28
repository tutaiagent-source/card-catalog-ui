import MarketingNav from "@/components/MarketingNav";
import ListingsFeaturePreview from "@/components/ListingsFeaturePreview";

export default function ListingsFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                📌 Listings
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Manage the cards you have for sale.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                Listings is where you keep track of what you’re actively selling, with asking prices, sale links, and notes.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 sm:col-span-1">
                  <h2 className="text-lg font-bold text-white">What</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    A single place for your active sale inventory.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 sm:col-span-1">
                  <h2 className="text-lg font-bold text-white">How</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Move cards from Catalog or PC into Listings.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 sm:col-span-1">
                  <h2 className="text-lg font-bold text-white">Why</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Keep everything together instead of juggling spreadsheets and screenshots.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/40 p-6">
                <h3 className="text-lg font-bold text-white">Listings bullets</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    Track cards for sale
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    Add external listing links
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    Share your available inventory
                  </li>
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="/login"
                  className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
                >
                  Manage Listings
                </a>
                <a
                  href="/pro"
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  View Plans
                </a>
              </div>
            </div>

            <div>
              <ListingsFeaturePreview />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
