import MarketingNav from "@/components/MarketingNav";

export default function CatalogFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              📚 Catalog
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Catalog your cards without the spreadsheet mess.
            </h1>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">What</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Catalog is where your collection lives. Add cards with images, values, notes, and quick comp fields.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">How</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Add cards manually or import a CSV. Use structured fields so your collection stays organized and searchable.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-bold text-white">Why</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                A clean catalog helps you know what you own, what it’s worth, and what you may want to keep, list, or sell.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/40 p-6">
            <h3 className="text-lg font-bold text-white">3 things you get with Catalog</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Track your full collection
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Add images and values
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Jump quickly to eBay sold comps
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
            >
              Start Cataloging
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
