import MarketingNav from "@/components/MarketingNav";
import CardCatLogo from "@/components/CardCatLogo";

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

const flowSteps = [
  "Add cards to your Catalog",
  "Save favorites to PC",
  "Move cards into Listings",
  "Publish to the Market",
  "Message and accept offers",
  "Track the sale in Sold",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(213,0,0,0.08),transparent_36%,transparent_64%,rgba(59,130,246,0.08))]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <div className="mb-5 hidden md:block">
                <CardCatLogo variant="vertical" size="lg" priority />
              </div>
              <div className="mb-5 md:hidden">
                <CardCatLogo variant="vertical" size="md" priority />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Catalog · PC · Market · Sold
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Catalog your cards. List in the Market. Track your profits.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                CardCat gives collectors one place to organize their collection, build their PC, list cards for sale, message offers, and track what sold.
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Starting at $5/month — less than a large coffee.
              </p>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">
                No CardCat buyer fees. No CardCat seller fees. Third-party services may still charge their own fees.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
                >
                  Start Your Collection
                </a>
                <a
                  href="/features"
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  Explore Features
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <img
                src="/home-cardcat-signin.png"
                alt="CardCat mobile preview"
                draggable={false}
                className="w-full rounded-2xl border border-white/10 object-cover"
              />
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Catalog, list, make deals, then track sold cards and profit in one workflow.
              </div>
            </div>
          </div>
        </section>

        {/* Service cards */}
        <section className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white">What CardCat helps you do</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <span aria-hidden="true" className="text-slate-400">→</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Flow */}
        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Simple flow</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">From collection to sale, all in one place.</h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {flowSteps.map((s, idx) => (
              <div key={s} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                    {idx + 1}
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="mt-10 rounded-[32px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(59,130,246,0.08))] p-6 shadow-[0_30px_90px_rgba(245,158,11,0.10)] sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Pricing</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Built for collectors, priced like it.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Plans start at $5/month, so you can manage your cards, listings, and sales records for less than a large coffee.
            </p>

            <div className="mt-6">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                View Plans
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
