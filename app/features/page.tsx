import MarketingNav from "@/components/MarketingNav";

const serviceCards = [
  {
    title: "Catalog",
    sentence: "Add cards, images, values, notes, and quick comp links in one organized place.",
    href: "/features/catalog",
    cta: "Learn about Catalog",
  },
  {
    title: "PC",
    sentence: "Keep your favorite cards separate from what you may want to sell.",
    href: "/features/pc",
    cta: "Learn about PC",
  },
  {
    title: "Listings",
    sentence: "Manage the cards you have for sale, add external links, and share available inventory.",
    href: "/features/listings",
    cta: "Learn about Listings",
  },
  {
    title: "Market",
    sentence: "List cards in a member marketplace where collectors can message and make offers.",
    href: "/features/market",
    cta: "Learn about the Market",
  },
  {
    title: "Sold",
    sentence: "Track sale price, platform, shipping cost, net profit, and ROI.",
    href: "/features/sold",
    cta: "Learn about Sold",
  },
  {
    title: "Import",
    sentence: "Bring in your existing spreadsheet and export your data anytime.",
    href: "/features/import",
    cta: "Learn about Import",
  },
];

export default function FeaturesHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              CardCat Features
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              What CardCat helps you do
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Six core tools for collectors, from cataloging to sold profit tracking.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:bg-white/[0.06]"
            >
              <div className="text-lg font-semibold text-white">{c.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{c.sentence}</div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-200 group-hover:underline">{c.cta}</span>
                <span aria-hidden="true" className="text-slate-400">
                  →
                </span>
              </div>
            </a>
          ))}
        </section>

        {/* Secondary tool */}
        <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Also included</div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-white">Card Posts for sharing individual cards.</div>
              <div className="mt-2 text-sm leading-7 text-slate-300">Share a single card image from your saved inventory.</div>
            </div>

            <a
              href="/features/share-sheets"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 border border-white/10 transition-colors hover:bg-white/[0.08] lg:mt-0"
            >
              See Card Posts
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
