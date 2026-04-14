// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          CardCat.io
        </div>
        <h1 className="mt-4 text-3xl font-bold">CardCat</h1>
        <p className="mt-2 text-slate-300">
          A cleaner home for your card inventory, pricing, and sold tracking.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/login"
            className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
          >
            Sign in
          </a>
          <a
            href="/catalog"
            className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
          >
            View catalog
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Email sign-in is used for saved collections. The brand is shifting toward CardCat.io.
        </p>
      </div>
    </main>
  );
}