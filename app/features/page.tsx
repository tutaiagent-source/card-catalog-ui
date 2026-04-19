import MarketingNav from "@/components/MarketingNav";
import ShareSheetFeaturePreview from "@/components/ShareSheetFeaturePreview";

const featureCards = [
  {
    title: "Catalog",
    body: "Keep cards organized with cleaner search, filters, images, and status tracking.",
    href: "/catalog",
    label: "Open Catalog",
  },
  {
    title: "Card Posts",
    body: "Turn saved cards into clean post images with optional pricing.",
    href: "/features/share-sheets",
    label: "See Card Posts",
  },
  {
    title: "CSV Import",
    body: "Bring in larger collections faster and clean up messy spreadsheets before saving.",
    href: "/guides/csv",
    label: "CSV Guide",
  },
  {
    title: "PC + Sold",
    body: "Keep favorites separate, track sold history, and keep the inventory story intact.",
    href: "/guides/pc",
    label: "PC Guide",
  },
];

const quickLinks = [
  { title: "Card Posts", body: "How the card post image works, what it includes, and how to use it on mobile or desktop.", href: "/features/share-sheets" },
  { title: "CSV Import", body: "How to structure a file, map fields, and avoid common cleanup issues.", href: "/guides/csv" },
  { title: "Image Uploads", body: "How front and back images work and how they improve previews and card posts.", href: "/guides/images" },
  { title: "Sold Tracking", body: "How listed and sold records stay connected to the original card record.", href: "/guides/sold" },
];

export default function FeaturesPage() {
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
              The Key Features, Without the Wall of Text.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              CardCat helps collectors organize inventory, track sold cards, and create clean card posts without turning the workflow into spreadsheet chaos.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-lg font-semibold text-white">{card.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
              <a href={card.href} className="mt-5 inline-flex rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                {card.label}
              </a>
            </div>
          ))}
        </section>

        <section id="card-posts" className="mt-12 rounded-[32px] border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(59,130,246,0.08))] p-6 shadow-[0_30px_90px_rgba(6,95,70,0.18)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Featured seller tool</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Card Posts</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Turn a saved card into a square image that is easier to post into Facebook groups, Discord channels, Reddit sales threads, or text messages. Optional price, front/back support, and less retyping.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/features/share-sheets" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                  Full Card Post Details
                </a>
                <a href="/catalog" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                  Open Catalog
                </a>
              </div>
            </div>

            <ShareSheetFeaturePreview />
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Need details?</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Use the Focused Pages for the Deeper Stuff</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              Keep the main features page short, then jump into the specific workflow you actually care about.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {quickLinks.map((item) => (
              <a key={item.title} href={item.href} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition-colors hover:bg-slate-950/80">
                <div className="text-lg font-semibold text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{item.body}</div>
                <div className="mt-4 text-sm font-semibold text-amber-200">Open page →</div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
