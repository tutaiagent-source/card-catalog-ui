export default function ListingsFeaturePreview() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[#0f172a] p-5 shadow-[0_25px_80px_rgba(2,6,23,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white">
          <span>🗂️</span>
          <span>Active Listings</span>
        </div>
        <div className="text-xs font-semibold text-slate-400">3 cards</div>
      </div>

      <div className="mt-4 rounded-[28px] bg-[#020617] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">Listed shelf</div>
            <div className="mt-1 text-xs text-slate-400">Tap to edit asking price + sale link</div>
          </div>
          <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
            Ready to post
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-3">
          {[
            { label: "PSA 10", bg: "from-blue-500/20 via-slate-700/10 to-slate-950/60", accent: "border-blue-400/30" },
            { label: "Prizm", bg: "from-emerald-500/20 via-slate-700/10 to-slate-950/60", accent: "border-emerald-400/30" },
            { label: "Serial", bg: "from-amber-500/20 via-slate-700/10 to-slate-950/60", accent: "border-amber-400/30" },
            { label: "Auto", bg: "from-fuchsia-500/20 via-slate-700/10 to-slate-950/60", accent: "border-fuchsia-400/30" },
            { label: "+1", bg: "from-slate-200/10 via-slate-700/10 to-slate-950/60", accent: "border-white/15" },
          ].map((c, i) => (
            <div
              key={i}
              className={`relative aspect-[2/3] overflow-hidden rounded-xl border ${c.accent} bg-slate-950/40`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.bg}`} />
              <div className="absolute inset-0 flex items-end justify-center pb-3">
                <div className="rounded-full bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold text-slate-100 ring-1 ring-white/10">
                  {c.label}
                </div>
              </div>
              {i === 1 ? (
                <div className="absolute right-2 top-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                  Edit
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Listing details</div>
              <div className="mt-1 text-xs font-semibold text-slate-400">Square card + your sale link</div>
            </div>
            <div className="rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-semibold text-blue-200">
              Link attached
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-400">Asking</div>
              <div className="text-sm font-bold text-white">$140.00</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-400">Listed</div>
              <div className="text-sm font-bold text-white">Apr 19</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-slate-200">
              https://whatnot.com/…
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_rgba(255,255,255,0.10)] hover:bg-slate-100">
              Open listing ↗
            </button>
            <button className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]">
              Share post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
