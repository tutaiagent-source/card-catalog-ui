export default function ShareSheetFeaturePreview() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[#0f172a] p-5 shadow-[0_25px_80px_rgba(2,6,23,0.45)]">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Front", "from-amber-200/30 via-slate-700/20 to-slate-950/60"],
          ["Back", "from-slate-200/20 via-slate-700/20 to-slate-950/60"],
        ].map(([label, gradient]) => (
          <div key={label} className="rounded-[24px] bg-[#111827] p-3">
            <div className="mb-3 inline-flex rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white">
              {label}
            </div>
            <div className={`aspect-[4/5] overflow-hidden rounded-[20px] bg-gradient-to-br ${gradient}`}>
              <div className="flex h-full items-center justify-center">
                <div className="h-[72%] w-[56%] rounded-[18px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_18px_40px_rgba(0,0,0,0.35)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[28px] bg-[#020617] px-6 py-7 text-center">
        <div className="text-3xl font-black tracking-tight text-white sm:text-4xl">2025 TYLER SHOUGH</div>
        <div className="mt-5 text-lg text-slate-200">Prizm Football</div>
        <div className="mt-1 text-lg text-slate-300">Hyper • Serial: 171/200</div>
        <div className="mt-6 flex items-center justify-end gap-2 text-sm font-semibold text-slate-400">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#d50000] text-[10px] text-white">🐾</span>
          <span>CardCat</span>
        </div>
      </div>
    </div>
  );
}
