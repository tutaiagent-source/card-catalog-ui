import MarketingNav from "@/components/MarketingNav";

export default function MarketFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              💬 Market
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">How The Market Works</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              List cards in the CardCat Market so other members can search, message, and make offers about specific cards. Market messaging is listing-initiated so conversations stay grounded. No CardCat buyer fees. No CardCat seller fees.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              CardCat does not process payments, hold funds, provide escrow, provide insurance, verify delivery, mediate disputes, or guarantee transaction outcomes. Payment and shipping decisions are handled directly between buyer and seller.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <h2 className="text-2xl font-bold text-white">1) View Market Listings</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Go to <span className="font-semibold text-slate-100">/market</span> to browse active member listings. Each card shows the key details, and you can tap a card to open the listing preview.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold text-white">Market Feed</div>
                <div className="mt-1 text-sm text-slate-300">Only cards owners marked for Market appear here.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold text-white">Open Listing Links</div>
                <div className="mt-1 text-sm text-slate-300">Optional marketplace URLs can be opened directly from the preview.</div>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-bold text-white">2) Check Comps</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              In the card preview, use <span className="font-semibold text-slate-100">Comp Check</span> to launch an eBay search using the card’s identity fields.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.07] p-6 shadow-[0_30px_90px_rgba(6,95,70,0.18)]">
            <h2 className="text-2xl font-bold text-white">3) Message The Seller</h2>
            <p className="mt-3 text-sm leading-7 text-emerald-100/90">
              Tap <span className="font-semibold">Message Seller</span> from the card preview. This creates a listing-initiated thread and pre-fills a message like “Is it still available?”
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4">
                <div className="text-sm font-semibold text-emerald-100">Inbox Management</div>
                <div className="mt-1 text-sm text-emerald-100/90">Use Messages folders (Inbox, Unread, Read, Deleted) to stay organized.</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4">
                <div className="text-sm font-semibold text-emerald-100">Soft Delete And Restore</div>
                <div className="mt-1 text-sm text-emerald-100/90">You can delete or restore messages without permanently losing the thread history.</div>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-bold text-white">Trade Or Sale</h2>
            <p className="mt-3 text-sm leading-7 text-emerald-100/90">
              Once you agree, finish the deal however you want, then move the card to Sold on your side (so profit math and history stay consistent). For CardCat Market deals, you can download a sale receipt.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Listers: How Your Cards Appear Here</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            On the <span className="font-semibold text-slate-100">Listed</span> page, use Marketplace visibility to post selected cards (or your whole listing collection) into the Member Market feed at <span className="font-semibold text-slate-100">/market</span>.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            You can also generate <span className="font-semibold text-slate-100">view-only</span> Share links for specific buyers from the same Listed page.
          </p>
        </section>
      </div>
    </main>
  );
}
