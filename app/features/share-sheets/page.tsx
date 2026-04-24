import MarketingNav from "@/components/MarketingNav";
import ShareSheetFeaturePreview from "@/components/ShareSheetFeaturePreview";

const keyPoints = [
  "Square card post image built from the saved card record",
  "Optional price on the image",
  "Front + back layout when both images exist",
  "Mobile Share / Save Image flow",
  "Desktop JPG download + caption copy",
];

const workflow = [
  {
    title: "Open Share",
    body: "Start from a card inside Catalog or PC preview and open the Share action.",
    icon: "📤",
  },
  {
    title: "Choose price or leave it off",
    body: "Use pricing only when the image should act like a true sale post.",
    icon: "🏷️",
  },
  {
    title: "Share or save the image",
    body: "Use your phone share sheet or download the JPG on desktop and post it where you sell.",
    icon: "📲",
  },
];

const usage = [
  {
    title: "Mobile",
    bullets: [
      "Tap Share / Save Image to open the native phone share sheet.",
      "Choose Save Image or share directly into another app when supported.",
      "Use Copy Caption when you want a cleaner text post alongside the image.",
    ],
  },
  {
    title: "Desktop",
    bullets: [
      "Download the JPG and upload it wherever you are posting the card.",
      "Copy the caption if you want faster post writing.",
      "Good for Facebook groups, Reddit, Discord, and marketplace-style communities.",
    ],
  },
];

const benefits = [
  "Less retyping, because the card details come from the catalog entry.",
  "Cleaner and more consistent sale posts.",
  "Better use of saved front/back images.",
  "A practical reason to keep card data organized in CardCat.",
];

export default function ShareSheetsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Card Posts
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                A Faster Way to Turn Saved Cards into Clean Card Posts.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                CardCat can generate a square card post image using the card details and images already stored in your catalog. It is built for the moment when you want to post a card quickly without rebuilding the listing by hand.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200 sm:text-base">
                {keyPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 text-emerald-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ShareSheetFeaturePreview />
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">How It Works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Three Quick Steps</h2>
          <div className="mt-6 space-y-4">
            {workflow.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_60px_rgba(2,6,23,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold text-white">{index + 1}. {item.title}</div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-lg">
                    {item.icon}
                  </div>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{item.body}</div>
              </div>
            ))}
          </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Why It Helps</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Good For Casual Sellers & Regular Sellers</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              {benefits.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Using It</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Mobile & Desktop</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {usage.map((column) => (
              <div key={column.title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <div className="text-lg font-semibold text-white">{column.title}</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  {column.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span className="mt-1 text-amber-300">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
