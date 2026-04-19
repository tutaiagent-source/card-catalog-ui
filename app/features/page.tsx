import MarketingNav from "@/components/MarketingNav";
import { CatalogShowcase, ImportShowcase, PcShowcase, SoldShowcase } from "@/components/MarketingScreens";

const featureGroups = [
  {
    title: "Share-Ready Sell Sheets",
    body: "Turn any saved card into a clean square post image with the important details already filled in. It is built to make Facebook groups, Discord sales posts, Reddit listings, and other informal selling flows faster and more consistent.",
    bullets: ["Optional Price On The Image", "Front + Back Layout When Both Images Exist", "Share / Save Image On Mobile", "Desktop-Friendly JPG Download", "Caption Copy For Faster Posting"],
  },
  {
    title: "Collection Management",
    body: "Keep your cards organized in a cleaner system with search, filters, status tracking, and a layout that feels more like a product than a spreadsheet.",
    bullets: ["Catalog Search And Filters", "Collection, Listed, And Sold Statuses", "Cleaner Mobile-Friendly Views", "Front And Back Card Images"],
  },
  {
    title: "Personal Collection Tools",
    body: "Separate your PC from the rest of the inventory without losing the bigger picture.",
    bullets: ["Dedicated PC View", "Quick Add / Remove From PC", "Cleaner Showcase Layout", "Better Focus On Favorite Cards"],
  },
  {
    title: "Import And Cleanup",
    body: "If you already have a spreadsheet, export it as CSV and CardCat makes it easy to import your collection quickly. Review and fix issues before they become bad data.",
    bullets: ["CSV Import", "Duplicate Review", "Needs Attention Workflow", "Row-Level Fixes Before Save", "LLM-assisted CSV prep guide"],
  },
  {
    title: "Sold Tracking And Insights",
    body: "Track sold cards cleanly and keep the history attached to the original card record.",
    bullets: ["Sold Price And Date Tracking", "Sales History", "Open Recent Sold Listings On eBay", "Deeper Pro Analytics"],
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Feature Overview
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Everything CardCat Gives Collectors In One Clear System.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              CardCat is built to help collectors organize their collection, keep a Personal Collection view, manage listed and sold cards, and now create share-ready sell sheets without rebuilding every post from scratch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]">
                Create Account
              </a>
              <a href="/catalog" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                Open App
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">On iPhone</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Tap, flip, reorder, and edit fast</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                CardCat is built to feel clean on mobile. Star cards, review comps, and keep your PC workflow tight.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-md">
              <img
                src="/iphone-pc-mockup-1.png"
                alt="CardCat iPhone mockup"
                className="w-full h-auto rounded-[26px] border border-white/10"
              />
              <img
                src="/iphone-pc-mockup-2.png"
                alt="CardCat iPhone mockup variant"
                className="w-full h-auto rounded-[26px] border border-white/10"
              />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {featureGroups.map((group) => (
            <div key={group.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h2 className="text-2xl font-bold text-white">{group.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{group.body}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                {group.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 text-amber-300">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="share-sheets" className="mt-12 rounded-[32px] border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(59,130,246,0.08))] p-6 shadow-[0_30px_90px_rgba(6,95,70,0.18)] sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Share-ready sell sheets</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A cleaner way to post cards for sale without rebuilding the listing every time</h2>
            <p className="mt-4 text-sm leading-7 text-slate-100/85 sm:text-base">
              Instead of screenshotting a card, typing out the same details again, and manually formatting a post, CardCat can generate a clean square image using the card data already stored in your catalog. It is designed for the exact moment when a collector wants to move from “I have this card saved” to “I can post this card for sale right now.”
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              ["What the share image includes", "Card name, year, set, parallel, serial number, optional pricing, and front/back images when both are available."],
              ["Why it matters", "It saves time, keeps posts consistent, reduces manual errors, and gives the seller a cleaner presentation in fast-moving group chats and selling feeds."],
              ["Where it helps most", "Facebook groups, Discord sale channels, Reddit sales posts, text threads, and any place where a clean image plus a short caption works better than typing everything from scratch."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/55 p-5">
                <div className="text-lg font-semibold text-white">{title}</div>
                <div className="mt-3 text-sm leading-6 text-slate-300">{body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">How it works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">From saved card to shareable post</h2>
            <div className="mt-6 space-y-4">
              {[
                ["1. Save the card normally", "Add the card to CardCat with the details and images you already keep in the catalog."],
                ["2. Open Share", "From the catalog preview or PC preview, tap the Share button for that card."],
                ["3. Choose whether to show price", "Turn pricing on only when you want the share image to act like a for-sale post."],
                ["4. Share or save the image", "Use your phone share sheet or download the JPG on desktop, then post it wherever you sell."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">How to use it</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Mobile and desktop usage</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-sm font-semibold text-white">On mobile</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  <li>Use <strong>Share / Save Image</strong> to open the phone share sheet.</li>
                  <li>Choose <strong>Save Image</strong> or send it directly to another app when supported.</li>
                  <li>Copy the caption if you want a cleaner text post alongside the image.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-sm font-semibold text-white">On desktop</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  <li>Download the JPG and upload it directly into the selling platform.</li>
                  <li>Copy the caption to save time when building the post.</li>
                  <li>Use it as a cleaner listing asset instead of ad-hoc screenshots or manually typed image edits.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Why this is valuable</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">It helps sellers move faster with less friction</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                A lot of selling friction comes from the little repeat work, like uploading screenshots, retyping the title, checking serial details again, and deciding whether to include price. This feature removes a lot of that repetition.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-200">
              {[
                "It makes posts look more intentional and polished.",
                "It reduces mistakes because the card details come from the catalog entry.",
                "It works for collectors who only sell occasionally, not just full-time sellers.",
                "It creates a real reason to keep card images and card details organized inside CardCat.",
                "It turns the catalog into something actionable, not just something archival.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Important details</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A few blanks worth filling in</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300 sm:text-base">
              <p>
                The share feature works best when the card has a strong image, clean card data, and a good set of details already stored in CardCat. In other words, the better the catalog entry, the better the finished sale post.
              </p>
              <p>
                Not every platform allows a website to post directly into an account or group, so CardCat is designed around the workflow that is most reliable: generate the image, copy the caption, and share or upload it wherever you sell.
              </p>
              <p>
                Optional price matters because sometimes the image should act like a true sale listing, and sometimes it should just be a clean “show the card” image first. CardCat supports both use cases.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Catalog</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">See The Collection Clearly</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              The catalog is built to make the collection easier to browse, cleaner to search, and faster to manage.
            </p>
          </div>
          <CatalogShowcase />
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Personal Collection</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Give Favorite Cards Their Own Space</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Keep the cards you want close in a dedicated view without losing the context of the full collection.
            </p>
          </div>
          <PcShowcase />
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Import</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Bring In Bigger Collections With More Control</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Import is built to help you clean up rows before they hit the catalog, not after the damage is done.
            </p>
          </div>
          <ImportShowcase />
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Sold</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Track Sold History Without Losing The Collection Story</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Sold cards stay connected to the inventory record so the app keeps the full picture clear over time.
            </p>
            <div className="mt-4 max-w-2xl rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4 text-sm text-slate-100 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Quick Comp Check</div>
              <div className="mt-2 font-semibold text-white">Open Recent Sold Listings On eBay In One Click.</div>
              <div className="mt-1 leading-6 text-slate-200">It is a simple convenience feature, not an official eBay partnership, but it gives collectors a much faster way to check recent sold history when working through cards.</div>
            </div>
          </div>
          <SoldShowcase />
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Step-by-step guides</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">If you want details, go deeper</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Start with CSV import, then use the LLM prompt for a clean downloadable CSV, and finally set up images so previews flip correctly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/guides/csv" className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]">CSV Guide</a>
              <a href="/guides/csv/llm" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">LLM Prompt</a>
              <a href="/guides/images" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">Image Uploads</a>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(213,0,0,0.10))] p-6 shadow-[0_30px_90px_rgba(120,53,15,0.2)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Ready To Start</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Build A Cleaner, More Useful Home For Your Collection</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                CardCat is built to feel approachable on day one and strong enough to grow with the collection over time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                Create Account
              </a>
              <a href="/#pricing" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                View Pricing
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
