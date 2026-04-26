import MarketingNav from "@/components/MarketingNav";
import { CatalogShowcase, ImportShowcase, SoldShowcase } from "@/components/MarketingScreens";
import ShareSheetFeaturePreview from "@/components/ShareSheetFeaturePreview";

const featureCards = [
  {
    title: "No CardCat seller fees",
    body: "Sell cards without CardCat taking a percentage. No CardCat seller fees.",
  },
  {
    title: "Built-in deal system",
    body: "Offers, counters, and messaging inside the deal flow, so every step stays organized.",
  },
  {
    title: "Automatic deal records",
    body: "Document each transaction with downloadable receipts you can print and keep.",
  },
];

const audienceCards = [
  {
    eyebrow: "For Casual Collectors",
    title: "Simple Enough To Start Fast",
    body: "Add the cards you care about, star your PC, and stop losing track of what you own. When you list, share with one clean link and post with Card Posts.",
    bullets: ["Easy Card Entry", "PC ★ Preview", "Active Listings Sharing"],
  },
  {
    eyebrow: "For Serious Collectors",
    title: "Strong Enough To Scale With You",
    body: "Import larger inventories, manage Active Listings and Sold history, and keep your collection data portable with exports and backups.",
    bullets: ["CSV Import And Export", "Bulk Inventory Actions", "One-Click eBay Sold Search"],
  },
];

const workflow = [
  {
    step: "01",
    title: "Message",
    body: "Start a conversation about the card and open the deal record.",
  },
  {
    step: "02",
    title: "Offer",
    body: "Make an offer (or counter) with clear amounts and notes.",
  },
  {
    step: "03",
    title: "Accept",
    body: "Both sides agree, then the deal moves forward.",
  },
  {
    step: "04",
    title: "Record Payment",
    body: "Add payment notes and seller confirmation so the deal is documented.",
  },
  {
    step: "05",
    title: "Add Shipping",
    body: "Add shipping carrier, tracking, and shipping cost.",
  },
  {
    step: "06",
    title: "Download Receipt",
    body: "Download a clean sale receipt for your records.",
  },
];

const pricingTiers = [
  {
    name: "Collector",
    price: "$5 / Month",
    caption: "A strong starting point for personal collections, with no CardCat buyer fees and no CardCat seller fees.",
    features: ["Up To 150 Cards", "Manual Card Entry", "Personal Collection View", "Basic Sold Tracking"],
    accent: "border-white/10 bg-white/[0.04]",
  },
  {
    name: "Pro",
    price: "$10 / Month",
    caption: "For bigger inventories and deeper tracking tools, with no CardCat buyer fees and no CardCat seller fees.",
    features: ["CSV Import And Export", "Bulk Inventory Tools", "Advanced Sold Insights", "More Room To Grow"],
    accent: "border-amber-500/25 bg-amber-500/[0.08]",
    highlight: true,
  },
  {
    name: "Seller",
    price: "$25 / Month",
    caption: "For active sellers who want deeper sold tracking and advanced seller analytics.",
    features: ["CSV Import And Export", "Deeper Sold Tracking", "Advanced Seller Analytics", "Bulk Inventory Tools"],
    accent: "border-amber-500/25 bg-amber-500/[0.10]",
  },
];

const faq = [
  {
    q: "Does CardCat charge seller fees?",
    a: "No. CardCat does not take a percentage of your sale when you sell through the CardCat Market. If you choose to use PayPal Goods & Services, eBay, Stripe, or another payment platform, that provider may charge its own fees.",
  },
  {
    q: "Does CardCat process payments?",
    a: "No. Buyers and sellers handle payment directly using the method they choose. CardCat helps document the deal, but does not process payments or hold funds.",
  },
  {
    q: "Is CardCat an escrow service?",
    a: "No. CardCat is not an escrow service and does not hold funds. Deal Records are documentation tools only.",
  },
  {
    q: "What is a Deal Record?",
    a: "A Deal Record is a structured summary of a transaction. It can include the accepted price, buyer and seller, card details, payment notes, shipping info, tracking, and a downloadable receipt.",
  },
  {
    q: "Can I sell cards listed on eBay?",
    a: "Yes. Listings can be used to track cards you have for sale anywhere. You can add external links, including eBay listing links, while still managing everything inside CardCat.",
  },
  {
    q: "Can I share my listings with people who are not on CardCat?",
    a: "Yes. Generate a temporary share link to show people what you currently have available outside the CardCat ecosystem.",
  },
  {
    q: "Can I import my current spreadsheet?",
    a: "Yes. Import your CSV and map your columns to CardCat fields. CardCat can also provide a formatting prompt to convert your spreadsheet into a CardCat-compatible CSV.",
  },
  {
    q: "Is the Market public?",
    a: "No. The CardCat Market is available to CardCat members. Members can search listings, message sellers about specific cards, and send offers.",
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
                Private collector marketplace
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Track your cards. Make deals. Keep more of every sale.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                CardCat helps collectors catalog their cards, manage listings, buy and sell in a private member marketplace, and document every deal with clean sales records.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">
                No CardCat buyer fees. No CardCat seller fees. Just collectors making deals.
              </p>

              <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-400">
                CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes. Payment and shipping decisions are handled directly between buyer and seller.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
                >
                  Start your collection
                </a>
                <a
                  href="/features/market"
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  Explore the Marketplace
                </a>
              </div>

              <div className="mt-5 max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Membership-based marketplace</div>
                <div className="mt-2 text-sm font-semibold text-white">Structured deals keep everything organized.</div>
                <div className="mt-1 text-sm leading-6 text-slate-200">
                  Offers, acceptance, payment notes (including seller confirmation), shipping details, and a downloadable receipt that stays tied to the conversation.
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Collection tracker", "PC ★, Active Listings, and Sold history stay connected."],
                  ["Receipts & exports", "Downloadable receipts and backups keep your records portable."],
                  ["Guided import", "Import from CSV, review duplicates, and clean rows before you save."],
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

        <section className="mt-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Why collectors use CardCat</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A private marketplace with no CardCat fees</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              List cards in the CardCat Market and make direct collector-to-collector deals. No CardCat buyer fees. No CardCat seller fees. Keep every deal documented with receipts.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="text-lg font-semibold text-white">{feature.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(59,130,246,0.08))] p-6 shadow-[0_30px_90px_rgba(6,95,70,0.18)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Built To Help You Sell Faster</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Turn Any Card Into A Card Post In Seconds</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Use your saved Catalog details and front/back images to generate a clean Card Post with optional pricing. Built for the places you already sell: Facebook groups, Discord, Reddit, and quick one-off listings. You can also list OR skip the passive post and start a structured deal in Messages.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-100/85">
                <li>• Optional price on the image</li>
                <li>• Front + back layout when both images exist</li>
                <li>• Mobile Share / Save Image flow</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/features#card-posts" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                  See Card Posts
                </a>
                <a href="/catalog" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                  Open Catalog
                </a>
              </div>
            </div>

            <ShareSheetFeaturePreview />
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-blue-500/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(16,185,129,0.08))] p-6 shadow-[0_30px_90px_rgba(30,64,175,0.16)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">New Listing Sharing</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Share Your Active Listings With One Clean Link</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Generate a view-only share link for your Active Listings shelf. Ideal for card shows and community posts, so people can browse your active inventory without touching your Catalog.
                Choose whether to show pricing, pick an expiration, and disable the link whenever you want.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-100/85">
                <li>• Choose whether to show or hide pricing</li>
                <li>• Share for 24 hours, 7 days, 1 month, or permanently</li>
                <li>• Disable the link whenever you want</li>
                <li>• Let people browse images, front/back views, and card details in one place</li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/features/listings" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                  See Listing Sharing
                </a>
                <a href="/listed" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                  Open Listings
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Before A Card Show", "Share the cards you plan to bring so collectors can look before you even arrive."],
                ["In Community Posts", "Drop one shelf link into Discord, Reddit, or Facebook instead of posting a pile of screenshots."],
                ["For Local Deals", "Give buyers or traders a view-only page so they can browse what is available without touching your catalog."],
                ["For Repeat Buyers", "Send one clean link whenever your listed inventory changes."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{body}</div>
                </div>
              ))}
            </div>
          </div>
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
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">A Cleaner PC + Sold Workflow On iPhone</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                  Star cards, tap into full card details, and check comps from your phone without losing the inventory story.
                </p>
              </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-md">
              <img
                src="/iphone-pc-mockup-1.png"
                alt="CardCat on iPhone mockup"
                className="w-full h-auto rounded-[26px] border border-white/10"
              />
              <img
                src="/iphone-pc-mockup-2.png"
                alt="CardCat on iPhone mockup variant"
                className="w-full h-auto rounded-[26px] border border-white/10"
              />
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Deal Flow</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Message → Offer → Accept → Record Payment → Add Shipping → Download Receipt</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              Start a deal in Messages. When an offer is accepted, CardCat helps you record each step and download a receipt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
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
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Made for collectors, not marketplace fees</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CardCat is built around collector-to-collector deals, clean records, and receipts you can keep. Membership keeps the marketplace focused, with no CardCat buyer fees and no CardCat seller fees.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Catalog your cards, manage listings, and document each sale from message to receipt.
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
                      Collector Details
                    </a>
                  ) : (
                    <a
                      href="/pro"
                      className="inline-flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/[0.12]"
                    >
                      Pro Details
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

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Guides</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Learn The Workflow, Step By Step</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Prefer details over guesswork? Start with CSV import, then add images, then organize in PC.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { title: "CSV Import", href: "/guides/csv", body: "Export and match CardCat fields so imports are clean." },
              { title: "LLM Reformat", href: "/guides/csv/llm", body: "A copy/paste prompt that returns a downloadable CSV code block." },
              { title: "Image Uploads", href: "/guides/images", body: "Supported Formats + what happens when images are too large." },
              { title: "PC ★ & Sold", href: "/guides/pc", body: "Favorites in PC, then sold history on the same card record." },
            ].map((g) => (
              <a
                key={g.href}
                href={g.href}
                className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/15"
              >
                <div className="text-lg font-semibold text-white">{g.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{g.body}</p>
                <div className="mt-4 text-sm font-semibold text-amber-200 group-hover:text-amber-100">Read guide →</div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(213,0,0,0.10))] p-6 shadow-[0_30px_90px_rgba(120,53,15,0.2)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Ready When You Are</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Join a cleaner card marketplace built around collectors</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Catalog your cards, manage listings, make direct deals, and download receipts. No CardCat buyer fees. No CardCat seller fees.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/login" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
                Start Your Collection
              </a>
              <a href="/features/market" className="rounded-xl border border-white/20 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/25">
                Explore the Marketplace
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
