import MarketingNav from "@/components/MarketingNav";
import ListingsFeaturePreview from "@/components/ListingsFeaturePreview";

const steps = [
  {
    title: "Mark a card as Listed",
    body: "In your Catalog, set a card’s status to Listed and add its Asking price + Listed date + sale link (eBay/Whatnot/local/etc.).",
    icon: "📌",
  },
  {
    title: "It moves into your Listings shelf",
    body: "Once saved, the card shows up in your Active Listings page automatically.",
    icon: "🗂️",
  },
  {
    title: "View + edit quickly",
    body: "Open a card to update the asking price, listed date, and sale link, and share your post when you’re ready.",
    icon: "✍️",
  },
];

export default function ListingsFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="relative mt-2 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 top-0 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                <span>🧾</span>
                Active Listings
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                One place to view and update every item you’re selling
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Post your card once, then keep everything you need attached to the card record: asking price, listed date, and the exact sale link.
                Your Active Listings shelf stays in sync.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["💸 Update asking price", "📅 Keep listed date", "🔗 Sale link stays attached", "↗ Open + share fast"].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="/listed"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  View Active Listings
                </a>
                <a
                  href="/catalog"
                  className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25"
                >
                  Update a Card in Catalog
                </a>
              </div>
            </div>

            <ListingsFeaturePreview />
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(59,130,246,0.08))] p-6 shadow-[0_30px_90px_rgba(6,95,70,0.18)] sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">How it works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">3 quick steps</h2>
            <p className="mt-3 text-sm leading-7 text-slate-100/85">
              No extra spreadsheet for selling. Listings is just your Catalog, filtered into a clean shelf.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((s, idx) => (
              <div
                key={s.title}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.20)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-lg font-black text-white">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      <span className="mr-2">{s.icon}</span>
                      {s.title}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(59,130,246,0.07))] p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Tip</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Keep your listing link with the card</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              In Listings, you’ll be able to quickly open and share the card, and update the sale link you’re currently using (eBay, Whatnot, local, etc.).
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                "Open listing ↗",
                "Price stays attached 💰",
                "Share when ready 🚀",
              ].map((chip) => (
                <div key={chip} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-semibold text-slate-100">
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
