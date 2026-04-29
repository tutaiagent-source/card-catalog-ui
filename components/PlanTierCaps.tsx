type PlanTierCapsProps = {
  className?: string;
};

export default function PlanTierCaps({ className = "" }: PlanTierCapsProps) {
  return (
    <div
      className={
        className ||
        "rounded-[32px] border border-white/10 bg-slate-950/40 p-6"
      }
    >
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Plan limits</div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        <div>
          <span className="font-semibold text-slate-100">Collector</span>: up to <span className="font-semibold text-white">250 cards</span> and <span className="font-semibold text-white">10</span> active Market listings.
        </div>
        <div>
          <span className="font-semibold text-slate-100">Pro</span>: up to <span className="font-semibold text-white">1,000 cards</span> and <span className="font-semibold text-white">50</span> active Market listings (profit/ROI analytics for serious selling).
        </div>
        <div>
          <span className="font-semibold text-slate-100">Seller</span>: up to <span className="font-semibold text-white">10,000 cards</span> and <span className="font-semibold text-white">250</span> active Market listings (same analytics as Pro, scaled for high-volume selling).
        </div>
      </div>
    </div>
  );
}
