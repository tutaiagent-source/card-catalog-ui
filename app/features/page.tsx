import MarketingNav from "@/components/MarketingNav";
import { CatalogShowcase, ImportShowcase, PcShowcase, SoldShowcase } from "@/components/MarketingScreens";

const featureGroups = [
  {
    title: "Collection Management",
    body: "Keep your cards organized in a cleaner system with search, filters, status tracking, and a layout that feels more like a product than a spreadsheet.",
    bullets: ["Catalog Search And Filters", "Collection, Listed, And Sold Statuses", "Cleaner Mobile-Friendly Views", "Front And Back Card Images"],
  },
  {
    title: "Personal Collection Tools",
    body: "Separate your PC from the rest of the inventory without losing the bigger picture.",
    bullets: ["Dedicated PC View", "Quick Add / Remove From PC", "Cleaner Showcase Layout", "Better Focus On Favorite Cards"],
  },
  {
    title: "Import And Cleanup",
    body: "Bring in bigger inventories from CSV and clean up issues before they become bad data.",
    bullets: ["CSV Import", "Duplicate Review", "Needs Attention Workflow", "Row-Level Fixes Before Save"],
  },
  {
    title: "Sold Tracking And Insights",
    body: "Track sold cards cleanly and keep the history attached to the original card record.",
    bullets: ["Sold Price And Date Tracking", "Sales History", "Export Options", "Deeper Pro Analytics"],
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Feature Overview
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Everything CardCat Gives Collectors In One Clear System.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              CardCat is built to help collectors organize their collection, keep a Personal Collection view, manage listed and sold cards, and stay in control as the inventory grows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]">
                Create Account
              </a>
              <a href="/catalog" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                Open App
              </a>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {featureGroups.map((group) => (
            <div key={group.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h2 className="text-2xl font-bold text-white">{group.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{group.body}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                {group.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 text-amber-300">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Catalog</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">See The Collection Clearly</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              The catalog is built to make the collection easier to browse, cleaner to search, and faster to manage.
            </p>
          </div>
          <CatalogShowcase />
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Personal Collection</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Give Favorite Cards Their Own Space</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Keep the cards you want close in a dedicated view without losing the context of the full collection.
            </p>
          </div>
          <PcShowcase />
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Import</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Bring In Bigger Collections With More Control</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Import is built to help you clean up rows before they hit the catalog, not after the damage is done.
            </p>
          </div>
          <ImportShowcase />
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Sold</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Track Sold History Without Losing The Collection Story</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Sold cards stay connected to the inventory record so the app keeps the full picture clear over time.
            </p>
          </div>
          <SoldShowcase />
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(213,0,0,0.10))] p-6 shadow-[0_30px_90px_rgba(120,53,15,0.2)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Ready To Start</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Build A Cleaner, More Useful Home For Your Collection</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                CardCat is built to feel approachable on day one and strong enough to grow with the collection over time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                Create Account
              </a>
              <a href="/#pricing" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                View Pricing
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
