import MarketingNav from "@/components/MarketingNav";
import CardCatLogo from "@/components/CardCatLogo";

import BinderBackground from "@/components/BinderBackground";
import SportsCardTile from "@/components/SportsCardTile";
import StatusChip from "@/components/StatusChip";

const serviceCards: Array<{
  title: string;
  sentence: string;
  href: string;
  cta: string;
  status: "catalog" | "pc" | "listings" | "market" | "sold" | "receipt";
  preview: { kicker?: string; lines: string[] };
}> = [
  {
    title: "Catalog",
    sentence: "Add cards, images, values, notes, and quick comp links in one organized place.",
    href: "/features/catalog",
    cta: "Learn about Catalog",
    status: "catalog",
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
    status: "pc",
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
    status: "listings",
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
    status: "market",
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
    status: "sold",
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
    status: "receipt",
    preview: {
      kicker: "CSV prep",
      lines: ["Review rows", "Flag duplicates", "Import when ready"],
    },
  },
];

const flowPanels: Array<{ status: "catalog" | "pc" | "market" | "sold"; title: string; line: string }> = [
  { status: "catalog", title: "Catalog", line: "Add cards + quick comps" },
  { status: "pc", title: "PC", line: "Star favorites (★)" },
  { status: "market", title: "Market", line: "List + message offers" },
  { status: "sold", title: "Sold", line: "Receipt + profit tracking" },
];

const iconByFlowStatus: Record<(typeof flowPanels)[number]["status"], string> = {
  catalog: "📚",
  pc: "★",
  market: "💬",
  sold: "💰",
};

const accentCardByFlowStatus: Record<(typeof flowPanels)[number]["status"], string> = {
  catalog: "border-amber-500/25 bg-amber-500/5",
  pc: "border-blue-500/25 bg-blue-500/5",
  market: "border-emerald-500/25 bg-emerald-500/5",
  sold: "border-emerald-400/25 bg-emerald-400/5",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(213,0,0,0.08),transparent_36%,transparent_64%,rgba(59,130,246,0.08))]" />
          <BinderBackground>
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
              <div className="mx-auto max-w-[420px]">
                <div className="hidden sm:block relative h-[360px]">
                  {flowPanels.map((p, idx) => {
                    const top = idx * 78;
                    const z = 30 - idx * 3;
                    const rotate = idx % 2 === 0 ? -1.2 : 1.2;
                    const translate = idx % 2 === 0 ? -3 : 3;

                    return (
                      <div
                        key={p.title}
                        className={`absolute left-1/2 w-[92%] -translate-x-1/2 rounded-2xl border ${accentCardByFlowStatus[p.status]} bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)]`}
                        style={{ top, zIndex: z, transform: `translateX(-50%) translateY(0px) rotate(${rotate}deg) translateX(${translate}px)` }}
                      >
                        <StatusChip status={p.status} icon={iconByFlowStatus[p.status]} />
                        <div className="mt-2 text-sm font-semibold text-white">{p.title}</div>
                        <div className="mt-1 text-xs text-slate-400">{p.line}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="sm:hidden space-y-3">
                  {flowPanels.map((p) => (
                    <div
                      key={p.title}
                      className={`rounded-2xl border ${accentCardByFlowStatus[p.status]} bg-slate-950/30 p-4`}
                    >
                      <StatusChip status={p.status} icon={iconByFlowStatus[p.status]} />
                      <div className="mt-2 text-sm font-semibold text-white">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{p.line}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
                Catalog → PC → Market → Sold
              </div>
            </div>
          </div>
          </BinderBackground>
        </section>

        {/* Service cards */}
        <section className="mt-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white">What CardCat helps you do</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </section>

        {/* Flow */}
        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Simple flow</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">From collection to sale, all in one place.</h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {flowPanels.map((p) => (
              <div key={p.title} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                <StatusChip status={p.status} />
                <div className="mt-3 text-sm font-semibold text-slate-100">{p.title}</div>
                <div className="mt-1 text-sm text-slate-400">{p.line}</div>
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
