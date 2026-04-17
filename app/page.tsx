import MarketingNav from "@/components/MarketingNav";
import { CatalogShowcase, ImportShowcase, SoldShowcase } from "@/components/MarketingScreens";

const featureCards = [
  {
    title: "Cleaner Catalog Control",
    body: "Search, filter, and move through your collection without getting buried in spreadsheet clutter.",
  },
  {
    title: "Built For Real Collections",
    body: "Keep Personal Collection cards, listed inventory, and sold history connected in one clear system.",
  },
  {
    title: "Guided Import Workflow",
    body: "Bring in CSV files, review duplicates, and fix messy rows before they become bigger problems.",
  },
  {
    title: "Seller Tools When You Need Them",
    body: "Track listed and sold cards cleanly, then open recent sold listings on eBay with a click when you need quicker context.",
  },
];

const audienceCards = [
  {
    eyebrow: "For Casual Collectors",
    title: "Simple Enough To Start Fast",
    body: "Add the cards you care about, keep your PC organized, and stop losing track of what you own.",
    bullets: ["Easy Card Entry", "Personal Collection View", "Cleaner Mobile Experience"],
  },
  {
    eyebrow: "For Serious Collectors",
    title: "Strong Enough To Scale With You",
    body: "Import larger inventories, manage listed and sold cards, and keep your collection data portable.",
    bullets: ["CSV Import And Export", "Bulk Inventory Actions", "One-Click eBay Sold Search"],
  },
];

const workflow = [
  {
    step: "01",
    title: "Add Cards Your Way",
    body: "Start one by one or import a bigger collection from a spreadsheet.",
  },
  {
    step: "02",
    title: "Organize What Matters",
    body: "Keep the full catalog clean while still separating out the cards in your PC.",
  },
  {
    step: "03",
    title: "Track What Moves",
    body: "Mark cards as listed or sold and keep the history attached to the card record.",
  },
  {
    step: "04",
    title: "Stay In Control",
    body: "Export backups, review sold history, and keep everything easy to find later.",
  },
];

const pricingTiers = [
  {
    name: "Collector",
    price: "$10 / Month",
    caption: "A Strong Starting Point For Personal Collections And Lighter Tracking.",
    features: ["Up To 100 Cards", "Manual Card Entry", "Personal Collection View", "Basic Sold Tracking"],
    accent: "border-white/10 bg-white/[0.04]",
  },
  {
    name: "Pro",
    price: "$20 / Month",
    caption: "For Bigger Inventories, Cleaner Workflows, And Deeper Tracking Tools.",
    features: ["CSV Import And Export", "Bulk Inventory Tools", "Advanced Sold Insights", "More Room To Grow"],
    accent: "border-amber-500/25 bg-amber-500/[0.08]",
    highlight: true,
  },
];

const faq = [
  {
    q: "Is CardCat Only For Sellers?",
    a: "No. CardCat is built for collectors first. Selling tools are there when you need them, but the app should still feel useful even if you mainly care about your collection.",
  },
  {
    q: "Can I Keep A Personal Collection?",
    a: "Yes. CardCat includes a dedicated PC view so you can separate personal favorites from the rest of your inventory.",
  },
  {
    q: "Can I Import A Spreadsheet?",
    a: "Yes. CSV import is part of the workflow, with duplicate review and row-level fixes so you can clean things up before saving.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(213,0,0,0.08),transparent_36%,transparent_64%,rgba(59,130,246,0.08))]" />
          <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Card Inventory For Collectors
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                A Premium Home For Your Collection, Your PC, And The Cards You Move.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                CardCat gives collectors a cleaner way to manage inventory without getting buried in rows, tabs, and messy spreadsheets. Use it for the cards you keep, the ones you list, and the ones you sell.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
                >
                  Create Account
                </a>
                <a
                  href="/features"
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  Explore Features
                </a>
                <a
                  href="/catalog"
                  className="rounded-xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                >
                  Open App
                </a>
              </div>

              <div className="mt-5 max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Quick Comp Check</div>
                <div className="mt-2 text-sm font-semibold text-white">Open Recent Sold Listings On eBay In One Click.</div>
                <div className="mt-1 text-sm leading-6 text-slate-200">
                  Jump straight from a card record to recent sold listings on eBay when you want a faster read on the market.
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Personal Collection", "Keep favorite cards separate without losing the full picture"],
                  ["Sold Tracking", "Track what moved, when it sold, and what stays in the collection"],
                  ["Portable Data", "Import and export cleanly so your collection stays yours"],
                ].map(([label, body]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-200">{body}</div>
                  </div>
                ))}
              </div>
            </div>

            <CatalogShowcase />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {featureCards.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-lg font-semibold text-white">{feature.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          {audienceCards.map((card) => (
            <div key={card.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{card.eyebrow}</div>
              <h2 className="mt-3 text-2xl font-bold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.body}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 text-amber-300">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Product Screens</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">See How CardCat Looks Across The Core Workflow</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              The product is designed to stay clean and readable from catalog browsing to import review to sold history.
            </p>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <ImportShowcase />
            <SoldShowcase />
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">On Your Phone</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A cleaner PC + sold workflow on iPhone</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Star cards, tap into details, and review comps from your phone without losing the “inventory story.”
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-md">
              <img
                src="/iphone-pc-mockup-1.png"
                alt="CardCat on iPhone mockup"
                className="w-full h-auto rounded-[26px] border border-white/10 bg-slate-950/20"
              />
              <img
                src="/iphone-pc-mockup-2.png"
                alt="CardCat on iPhone mockup variant"
                className="w-full h-auto rounded-[26px] border border-white/10 bg-slate-950/20"
              />
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">How CardCat Works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A Cleaner Workflow From First Card To Sold History</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              CardCat is built around the real flow collectors use. Add, organize, track, and back up your collection without turning it into a mess.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {workflow.map((item) => (
              <div key={item.step} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step {item.step}</div>
                <div className="mt-3 text-xl font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Why It Feels Different</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Made To Feel Like A Product, Not Just A Spreadsheet With A Logo On It</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CardCat is opinionated about clarity. The goal is not to throw every possible feature at the screen. The goal is to help collectors stay organized and keep the important stuff easy to see.
            </p>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              {[
                "Mobile-Friendly Views That Feel Tighter And Easier To Use",
                "Collector-Friendly Language That Does Not Assume Everyone Is Running A Business",
                "Seller Depth Available When You Need More Than Basic Tracking",
                "Imports, Exports, And Backups That Keep Your Collection Portable",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="pricing" className="grid gap-4 md:grid-cols-2">
            {pricingTiers.map((tier) => (
              <div key={tier.name} className={`rounded-[28px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${tier.accent}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Plan</div>
                    <div className="mt-2 text-2xl font-bold text-white">{tier.name}</div>
                  </div>
                  {tier.highlight ? (
                    <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Growth Tier
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 text-3xl font-black tracking-[-0.04em] text-white">{tier.price}</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{tier.caption}</p>

                <ul className="mt-5 space-y-3 text-sm text-slate-200">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 text-amber-300">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {tier.name === "Collector" ? (
                    <a
                      href="/collector"
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                    >
                      Collector details
                    </a>
                  ) : (
                    <a
                      href="/pro"
                      className="inline-flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/[0.12]"
                    >
                      Pro details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">FAQ</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A Few Things Collectors Usually Ask First</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {faq.map((item) => (
              <div key={item.q} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="text-lg font-semibold text-white">{item.q}</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(213,0,0,0.10))] p-6 shadow-[0_30px_90px_rgba(120,53,15,0.2)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Ready When You Are</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Start Building A Cleaner Home For Your Collection</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Whether you are tracking a growing PC or a bigger inventory, CardCat is built to help you stay organized without losing the feel of the hobby.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                Create Account
              </a>
              <a href="/features" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                View Features
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
