import CardCatLogo from "@/components/CardCatLogo";

const featureCards = [
  {
    title: "Cleaner catalog control",
    body: "Search, filter, and move through your collection without getting buried in spreadsheet clutter.",
  },
  {
    title: "Built for real collections",
    body: "Keep personal collection cards, listed inventory, and sold history connected in one system.",
  },
  {
    title: "Imports that feel guided",
    body: "Bring in CSV files, review duplicates, and fix messy rows before they become bigger problems.",
  },
  {
    title: "Seller tools when you need them",
    body: "Track listed and sold cards cleanly, then go deeper with exports and sales insights when it matters.",
  },
];

const audienceCards = [
  {
    eyebrow: "For casual collectors",
    title: "Simple enough to start fast",
    body: "Add the cards you care about, keep your PC organized, and stop losing track of what you own.",
    bullets: ["Easy card entry", "Personal Collection view", "Cleaner mobile experience"],
  },
  {
    eyebrow: "For serious collectors",
    title: "Strong enough to scale with you",
    body: "Import larger inventories, manage listed and sold cards, and keep your collection data portable.",
    bullets: ["CSV import and export", "Bulk inventory actions", "Deeper sold tracking"],
  },
];

const workflow = [
  {
    step: "01",
    title: "Add cards your way",
    body: "Start one by one or import a bigger collection from a spreadsheet.",
  },
  {
    step: "02",
    title: "Organize what matters",
    body: "Keep the full catalog clean while still separating out the cards in your PC.",
  },
  {
    step: "03",
    title: "Track what moves",
    body: "Mark cards as listed or sold and keep the history attached to the card record.",
  },
  {
    step: "04",
    title: "Stay in control",
    body: "Export backups, review sold history, and keep everything easy to find later.",
  },
];

const pricingTiers = [
  {
    name: "Collector",
    price: "$0",
    caption: "A strong starting point for personal collections and lighter tracking.",
    features: ["Up to 100 cards", "Manual card entry", "Personal Collection view", "Basic sold tracking"],
    accent: "border-white/10 bg-white/[0.04]",
  },
  {
    name: "Pro",
    price: "Coming soon",
    caption: "For bigger inventories, cleaner workflows, and deeper tracking tools.",
    features: ["CSV import and export", "Bulk inventory tools", "Advanced sold insights", "More room to grow"],
    accent: "border-amber-500/25 bg-amber-500/[0.08]",
    highlight: true,
  },
];

const faq = [
  {
    q: "Is CardCat only for sellers?",
    a: "No. CardCat is built for collectors first. Selling tools are there when you need them, but the app should still feel useful even if you mainly care about your collection.",
  },
  {
    q: "Can I keep a Personal Collection?",
    a: "Yes. CardCat includes a dedicated PC view so you can separate personal favorites from the rest of your inventory.",
  },
  {
    q: "Can I import a spreadsheet?",
    a: "Yes. CSV import is part of the workflow, with duplicate review and row-level fixes so you can clean things up before saving.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-6 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(213,0,0,0.08),transparent_36%,transparent_64%,rgba(59,130,246,0.08))]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Card inventory for collectors
              </div>

              <div className="mt-5">
                <CardCatLogo markClassName="h-12 w-12 sm:h-14 sm:w-14" showTagline={false} />
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Keep your collection organized, your PC close, and your sold cards easy to track.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                CardCat gives collectors a cleaner way to manage inventory without getting buried in rows, tabs, and messy spreadsheets. Use it for the cards you keep, the ones you list, and the ones you sell.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/catalog"
                  className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
                >
                  Open catalog
                </a>
                <a
                  href="/login"
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  Sign in / create account
                </a>
                <a
                  href="/import"
                  className="rounded-xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                >
                  Import collection
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Personal Collection", "Keep favorite cards separate without losing the full picture"],
                  ["Sold tracking", "Track what moved, when it sold, and what stays in the collection"],
                  ["Portable data", "Import and export cleanly so your collection stays yours"],
                ].map(([label, body]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-200">{body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-sm sm:p-5">
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Product snapshot</div>
                    <div className="mt-1 text-xs text-slate-400">A cleaner view of how CardCat works.</div>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Live product
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Catalog</div>
                        <div className="mt-2 text-lg font-semibold text-white">Cleaner inventory control</div>
                        <div className="mt-1 text-sm text-slate-300">Search, filter, sort, and manage your cards without spreadsheet fatigue.</div>
                      </div>
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2 text-xs font-semibold text-amber-100">
                        Fast view
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Collection", "148 cards"],
                        ["Listed", "23 cards"],
                        ["Sold", "41 cards"],
                        ["Sports tracked", "5"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                          <div className="text-xs text-slate-400">{label}</div>
                          <div className="mt-1 text-lg font-semibold text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">PC</div>
                      <div className="mt-2 text-lg font-semibold text-white">Personal Collection view</div>
                      <div className="mt-1 text-sm text-slate-200">Keep the cards you care about most in a separate, cleaner space.</div>
                    </div>
                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Sold</div>
                      <div className="mt-2 text-lg font-semibold text-white">Clear sold history</div>
                      <div className="mt-1 text-sm text-slate-200">Track sold cards without losing the original inventory record.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">How CardCat works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A cleaner workflow from first card to sold history</h2>
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Why it feels different</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Made to feel like a product, not just a spreadsheet with a logo on it</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CardCat is opinionated about clarity. The goal is not to throw every possible feature at the screen. The goal is to help collectors stay organized and keep the important stuff easy to see.
            </p>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              {[
                "Mobile-friendly views that feel tighter and easier to use",
                "Collector-friendly language that does not assume everyone is running a business",
                "Seller depth available when you need more than basic tracking",
                "Imports, exports, and backups that keep your collection portable",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <span className="mt-1 text-emerald-300">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-[28px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${tier.accent}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Plan</div>
                    <div className="mt-2 text-2xl font-bold text-white">{tier.name}</div>
                  </div>
                  {tier.highlight ? (
                    <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Growth tier
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
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">FAQ</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A few things collectors usually ask first</h2>
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
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Ready when you are</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Start building a cleaner home for your collection</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Whether you are tracking a growing PC or a bigger inventory, CardCat is built to help you stay organized without losing the feel of the hobby.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                Create account
              </a>
              <a href="/catalog" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                Open app
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
