import CardCatLogo from "@/components/CardCatLogo";

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 mb-6 backdrop-blur">
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.28)] sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="inline-flex">
            <CardCatLogo markClassName="h-10 w-10" />
          </a>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-300 sm:justify-end">
            <a href="/" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white">
              Home
            </a>
            <a href="/features" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white">
              Features
            </a>
            <a href="/#pricing" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white">
              Pricing
            </a>
            <a href="/contact" className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white">
              Contact Us
            </a>
            <a href="/login" className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-slate-100 transition-colors hover:bg-white/[0.08]">
              Sign In
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
