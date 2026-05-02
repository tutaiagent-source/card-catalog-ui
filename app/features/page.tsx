import MarketingNav from "@/components/MarketingNav";

import SportsCardTile from "@/components/SportsCardTile";
import StatusChip from "@/components/StatusChip";
import BinderBackground from "@/components/BinderBackground";

const serviceCards = [
  {
    title: "Catalog",
    sentence: "Add cards, images, values, notes, and quick comp links in one organized place.",
    href: "/features/catalog",
    cta: "Learn about Catalog",
    status: "catalog" as const,
    preview: {
      kicker: "Card + Comp",
      lines: ["Search + quick actions", "Add photos + notes", "Keep estimates handy"],
    },
  },
  {
    title: "PC",
    sentence: "Keep your favorite cards separate from what you may want to sell.",
    href: "/features/pc",
    cta: "Learn about PC",
    status: "pc" as const,
    preview: {
      kicker: "Star favorites",
      lines: ["★ PC view", "Card count + value", "Clean, collector-first"],
    },
  },
  {
    title: "Listings",
    sentence: "Manage the cards you have for sale, add external links, and share available inventory.",
    href: "/features/listings",
    cta: "Learn about Listings",
    status: "listings" as const,
    preview: {
      kicker: "Active for sale",
      lines: ["Asking price", "Edit + share", "Link out to your marketplace"],
    },
  },
  {
    title: "Market",
    sentence: "List cards in a member marketplace where collectors can message and make offers.",
    href: "/features/market",
    cta: "Learn about the Market",
    status: "market" as const,
    preview: {
      kicker: "Offers",
      lines: ["Offer ready", "Message + counter", "Move deals to Sold"],
    },
  },
  {
    title: "Sold",
    sentence: "Track sale price, platform, shipping cost, net profit, and ROI.",
    href: "/features/sold",
    cta: "Learn about Sold",
    status: "sold" as const,
    preview: {
      kicker: "Receipt-style",
      lines: ["Sold totals", "Net profit + ROI", "Download your receipt"],
    },
  },
  {
    title: "Import",
    sentence: "Bring in your existing spreadsheet and export your data anytime.",
    href: "/features/import",
    cta: "Learn about Import",
    status: "receipt" as const,
    preview: {
      kicker: "CSV prep",
      lines: ["Review rows", "Flag duplicates", "Import when ready"],
    },
  },
];

export default function FeaturesHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <BinderBackground>
          <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2">
                <StatusChip status="catalog" />
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workflow</div>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                What CardCat helps you do
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                From Catalog → PC → Listings → Market → Sold.
              </p>
            </div>
          </section>
        </BinderBackground>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCards.map((c) => (
            <SportsCardTile
              key={c.title}
              href={c.href}
              status={c.status}
              title={c.title}
              sentence={c.sentence}
              cta={c.cta}
              preview={c.preview}
            />
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
