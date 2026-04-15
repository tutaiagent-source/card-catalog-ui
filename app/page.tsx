const featureCards = [
  {
    title: "Catalog that feels fast",
    body: "Search, sort, and move inventory without getting buried in rows.",
  },
  {
    title: "Cleaner imports",
    body: "Bring in CSV files, review matches, and fix naming before duplicates pile up.",
  },
  {
    title: "Sales visibility",
    body: "Track sold cards, revenue, platform mix, and momentum in one place.",
  },
];

const quickStats = [
  { label: "Best for", value: "Collectors, flippers, breakers" },
  { label: "Core flow", value: "Add, import, list, sell" },
  { label: "Focus", value: "Inventory clarity + sales tracking" },
];

const workflow = [
  "Add individual cards with photos and pricing",
  "Import larger collections from CSV or spreadsheets",
  "Track listed vs collection inventory cleanly",
  "Review sold history with visual performance snapshots",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              CardCat.io
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              A cleaner command center for card inventory and sales.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              CardCat keeps your catalog, imports, and sold history in one place, with a cleaner layout that feels more like a modern product and less like a spreadsheet.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <a
                href="/catalog"
                className="rounded-xl bg-[#d50000] px-5 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.22)] hover:bg-[#b80000]"
              >
                Open catalog
              </a>
              <a
                href="/sold"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 font-semibold text-slate-100 hover:bg-white/[0.08]"
              >
                View sales dashboard
              </a>
              <a
                href="/import"
                className="rounded-xl border border-white/10 bg-slate-900 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800"
              >
                Import collection
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-100">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">CardCat overview</div>
                  <div className="mt-1 text-sm text-slate-400">The shape of the product at a glance.</div>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Live concept
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Catalog</div>
                  <div className="mt-2 text-lg font-semibold text-white">Cleaner inventory views</div>
                  <div className="mt-1 text-sm text-slate-300">Mobile-friendly cards, grouped families, and quicker status moves.</div>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Sales</div>
                  <div className="mt-2 text-lg font-semibold text-white">Visual revenue insights</div>
                  <div className="mt-1 text-sm text-slate-300">Trend bars, platform mix, and recent wins that feel client-ready.</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-slate-200">What CardCat does well</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {workflow.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-amber-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <div className="text-lg font-semibold text-white">{feature.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{feature.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 text-sm text-slate-400">
          Sign in with email to save collections, manage inventory, and access the improved sales dashboard.
        </div>
      </div>
    </main>
  );
}
