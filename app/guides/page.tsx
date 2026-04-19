import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Guides | CardCat",
  description: "Practical guides for CSV import, LLM reformatting, image uploads, PC organization, sold tracking, and exports.",
  openGraph: {
    title: "Guides | CardCat",
    description: "Practical guides for CSV import, LLM reformatting, image uploads, PC organization, sold tracking, and exports.",
    type: "website",
  },
};

const guides = [
  {
    title: "CSV Import",
    href: "/guides/csv",
    desc: "Export from spreadsheets, understand required fields, and get clean imports.",
    emoji: "📄",
    tag: "CSV",
  },
  {
    title: "LLM Reformat (Downloadable CSV)",
    href: "/guides/csv/llm",
    desc: "A copy/paste prompt that returns a CardCat-ready CSV in a code block.",
    emoji: "🤖",
    tag: "LLM",
  },
  {
    title: "Image Uploads (Front/Back)",
    href: "/guides/images",
    desc: "Formats and limits, and what CardCat does if your images are too large.",
    emoji: "🖼️",
    tag: "Images",
  },
  {
    title: "Personal Collection (PC ★)",
    href: "/guides/pc",
    desc: "How PC works, how to reorder, and how estimates fit in.",
    emoji: "★",
    tag: "PC",
  },
  {
    title: "Sold Tracking",
    href: "/guides/sold",
    desc: "Attach sold data to the same card record for a clean history.",
    emoji: "💰",
    tag: "Sold",
  },
  {
    title: "Exports & Backups",
    href: "/guides/export-backup",
    desc: "Backup your inventory and sold history anytime.",
    emoji: "📦",
    tag: "Exports",
  },
];

export default function GuidesHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_32%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Step-by-step Guides
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Everything You Need to Import, Organize & Track</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Quick answers first, deeper details when you want them. Start with CSV import, then add images, then organize in PC.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {["1) CSV", "2) Images", "3) PC + Sold"].map((chip) => (
                <div
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 shadow-[0_10px_25px_rgba(2,6,23,0.35)] motion-safe:hover:translate-y-[-1px] motion-safe:transition-transform"
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {guides.map((g) => (
            <a
              key={g.href}
              href={g.href}
              className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] motion-safe:transition-all duration-200 hover:-translate-y-1 hover:border-white/15 motion-safe:hover:shadow-[0_20px_70px_rgba(2,6,23,0.55)]"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                <span className="text-base" aria-hidden>
                  {g.emoji}
                </span>
                {g.tag}
              </div>
              <div className="mt-2 text-2xl font-bold text-white group-hover:text-white">{g.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{g.desc}</div>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                Read more <span aria-hidden>→</span>
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
