import MarketingNav from "@/components/MarketingNav";
import CardCatLogo from "@/components/CardCatLogo";
import PlanTierCaps from "@/components/PlanTierCaps";

const homepageFeatures = [
  {
    title: "Catalog",
    description:
      "Add and organize your cards with clean fields, images, values, and quick comp links.",
    href: "/features/catalog",
    cta: "Learn about Catalog",
  },
  {
    title: "PC",
    description:
      "Save your favorites in a dedicated space, separate from sale inventory.",
    href: "/features/pc",
    cta: "Learn about PC",
  },
  {
    title: "Listings",
    description:
      "Move cards into Listings so you can manage what you’re selling, add links, and share your inventory.",
    href: "/features/listings",
    cta: "Learn about Listings",
  },
  {
    title: "CardCat Market",
    description:
      "List cards in a private member marketplace where collectors message and make offers.",
    href: "/features/market",
    cta: "Learn about the Market",
  },
  {
    title: "Sold Dashboard",
    description:
      "Track what sold, where it sold, shipping costs, net profit, and ROI.",
    href: "/features/sold",
    cta: "Learn about Sold",
  },
  {
    title: "CSV Import / Export",
    description:
      "Bring your spreadsheet in with CSV, then export your collection or sales data anytime.",
    href: "/features/import",
    cta: "Learn about Import",
  },
];

const pricingTeaserPlans = [
  { label: "Collector" },
  { label: "Pro" },
  { label: "Seller" },
];

const flowSteps = [
  "Add cards to your Catalog",
  "Move favorites to PC",
  "List cards for sale",
  "Publish to the CardCat Market",
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
          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-5 hidden md:block">
                <CardCatLogo variant="vertical" size="lg" priority />
              </div>
              <div className="mb-5 md:hidden">
                <CardCatLogo variant="vertical" size="md" priority />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Catalog, PC, Market, and receipts
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Catalog your cards. List in the Market. Track your profits.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                CardCat gives collectors one place to organize their collection, build their PC,
                list cards for sale, make deals, and keep track of what sold.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">
                Starting at <span className="font-semibold">$5/month</span> — less than a large coffee.
              </p>

              <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-400">
                No CardCat seller fees. No CardCat buyer fees. Third-party services (payment, shipping,
                or external marketplaces) may charge their own fees.
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

            {/* Lightweight value list */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <img
                src="/home-cardcat-signin.png"
                alt="CardCat mobile preview"
                draggable={false}
                className="w-full rounded-2xl border border-white/10 object-cover"
              />

              <div className="mt-3 text-xs leading-6 text-slate-300">
                Sign in, catalog your cards, list to the Market, then track sold (profits + ROI) in one place.
              </div>

              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">What you do in CardCat</div>
              <div className="mt-3 space-y-3">
                {[
                  "Catalog cards",
                  "Add favorites to your PC",
                  "List cards in the CardCat Market",
                  "Track sales, profits, and sold data",
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                  >
                    <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                    <div className="text-sm font-semibold text-slate-100">{line}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
                <div className="text-sm font-semibold text-white">For collectors who want the whole story</div>
                <div className="mt-2 text-sm leading-6 text-slate-200">
                  Cleaner inventory, faster listing updates, and receipts you can keep.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white">What CardCat Helps You Do</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Simple workflows for cataloging, selling, and tracking your results.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {homepageFeatures.map((f) => (
              <a
                key={f.title}
                href={f.href}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:bg-white/[0.06]"
              >
                <div className="text-lg font-semibold text-white">{f.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{f.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-200 group-hover:underline">
                    {f.cta}
                  </span>
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
              Plans start at <span className="font-semibold">$5/month</span>, so you can manage your collection,
              listings, and sales records for less than a large coffee.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {pricingTeaserPlans.map((p) => (
                <span key={p.label} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
                  {p.label}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <PlanTierCaps className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/pro"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                View Plans
              </a>
              <a href="/login" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                Start Your Collection
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Ready to organize your collection?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Start cataloging, listing, and tracking your cards in CardCat.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start Your Collection
              </a>
              <a href="/features" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                Explore Features
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
