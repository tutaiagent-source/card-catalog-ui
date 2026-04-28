import React from "react";

type Variant = "catalog" | "pc" | "listings" | "market" | "sold" | "import";

export default function PhoneFeatureMockup({ variant }: { variant: Variant }) {
  const accent =
    variant === "catalog"
      ? "from-amber-500/25 to-slate-950"
      : variant === "pc"
        ? "from-blue-500/25 to-slate-950"
        : variant === "listings"
          ? "from-emerald-500/25 to-slate-950"
          : variant === "market"
            ? "from-emerald-500/20 to-slate-950"
            : variant === "sold"
              ? "from-emerald-500/20 to-slate-950"
              : "from-blue-500/25 to-slate-950";

  return (
    <div className="relative w-[260px] max-w-full">
      <div className="absolute -inset-1 rounded-[38px] bg-gradient-to-b opacity-60 blur-xl" style={{ backgroundImage: `linear-gradient(180deg, rgba(245,158,11,0.35), rgba(2,6,23,0.0))` }} />

      <div className="relative rounded-[38px] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(2,6,23,0.6)]">
        <div className="h-6 flex items-center justify-center">
          <div className="h-1.5 w-24 rounded-full bg-white/10" />
        </div>

        <div className="px-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {variant === "catalog"
                ? "Catalog"
                : variant === "pc"
                  ? "PC"
                  : variant === "listings"
                    ? "Listings"
                    : variant === "market"
                      ? "Market"
                      : variant === "sold"
                        ? "Sold"
                        : "Import"}
            </div>
            <div className="h-7 w-7 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-xs">
              {variant === "catalog" ? "⌕" : variant === "pc" ? "★" : variant === "listings" ? "🔗" : variant === "market" ? "💬" : variant === "sold" ? "💰" : "⬆️"}
            </div>
          </div>

	          <div className="mt-3 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] overflow-hidden">
            <div className={`p-4 bg-gradient-to-b ${accent}`}>
              {variant === "catalog" ? (
                <>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300">
                    Search + quick actions
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Tom Brady</div>
                      <div className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-200">Catalog</div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">2020 Prizm · #17</div>
                  </div>
                </>
              ) : variant === "pc" ? (
                <>
                  <div className="rounded-full bg-blue-500/15 border border-blue-500/20 px-3 py-1 text-[11px] font-semibold text-blue-200">
                    Your favorites
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Tom Brady</div>
                      <div className="rounded-full bg-blue-500/15 px-2 py-1 text-[11px] font-semibold text-blue-200">PC</div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">Estimated value: $1,240</div>
                  </div>
                </>
              ) : variant === "listings" ? (
                <>
                  <div className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    Active sale
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Tom Brady</div>
                      <div className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-slate-200">Listed</div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">Asking: $140</div>
                    <div className="mt-1 text-[11px] text-slate-400 truncate">Sale link: whatnot.com/…</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-200 text-center">Edit</div>
                    <div className="flex-1 rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-3 py-2 text-[11px] font-semibold text-emerald-200 text-center">Share</div>
                  </div>
                </>
              ) : variant === "market" ? (
                <>
                  <div className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    Message + offers
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Tom Brady</div>
                      <div className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-slate-200">Offer ready</div>
                    </div>
                    <div className="mt-2 rounded-xl bg-slate-950/60 border border-white/10 px-3 py-2 text-[11px] text-slate-200">
                      Buyer: “Is this still available?”
                    </div>
                    <div className="mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[11px] text-emerald-200">
                      Offer: $120
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-[11px] font-semibold text-slate-200 text-center">
                    Finish the deal in Messages
                  </div>
                </>
              ) : variant === "sold" ? (
                <>
                  <div className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    Sold details
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Tom Brady</div>
                      <div className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-slate-200">Completed</div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">Sold: $140 × Qty 1</div>
                    <div className="mt-1 text-[11px] text-slate-400">Shipping: $18</div>
                    <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[11px] font-semibold text-emerald-200">
                      Net profit + ROI tracked
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-slate-950 text-center">
                    Download receipt
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-blue-500/15 border border-blue-500/20 px-3 py-1 text-[11px] font-semibold text-blue-200">
                    CSV review
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="text-sm font-semibold text-white">Map columns</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[["Player", "#93c5fd"], ["Set", "#fde68a"], ["Year", "#a7f3d0"], ["Price", "#fca5a5"]].map(([t, c]) => (
                        <div
                          key={t}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-200"
                          style={{ boxShadow: `0 0 0 2px rgba(255,255,255,0.0), 0 0 18px ${c}33` }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400">Review duplicates before import</div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-[11px] font-semibold text-slate-200 text-center">
                    Import when ready
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 flex items-center justify-between border-t border-white/10">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                CardCat
              </div>
              <div className="text-[10px] text-slate-400">Preview</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
