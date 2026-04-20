import MarketingNav from "@/components/MarketingNav";

const steps = [
  {
    title: "Mark a card as Listed",
    body: "In your Catalog, set a card’s status to Listed and add its Asking price + Listed date + sale link (ebay/whatnot/etc).",
  },
  {
    title: "It moves into your Listings shelf",
    body: "Once saved, the card shows up in your Active Listings page automatically.",
  },
  {
    title: "View + edit quickly",
    body: "Open a card to update the asking price, listed date, and sale link, and share your post when you’re ready.",
  },
];

export default function ListingsFeaturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="mt-2 rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Active Listings
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">One place to view every item you’re selling</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              When you post your item for sale, update the card in your Catalog (status = Listed, with your asking price + sale link). It will automatically move into your Listings page.
            </p>

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
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">How it works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">3 quick steps</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.25)]">
                <div className="text-lg font-semibold text-white">{s.title}</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tip</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Keep your listing link with the card</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              In Listings, you’ll be able to quickly open and share the card, and update the sale link you’re currently using (eBay, Whatnot, local, etc.).
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
