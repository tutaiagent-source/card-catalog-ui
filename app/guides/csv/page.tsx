import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "CSV Import Guide | CardCat",
  description: "Export your spreadsheet to CSV, match CardCat fields, and review duplicates before saving.",
  openGraph: {
    title: "CSV Import Guide | CardCat",
    description: "Export your spreadsheet to CSV, match CardCat fields, and review duplicates before saving.",
    type: "website",
  },
};

const required = ["player_name", "year", "brand", "set_name", "card_number", "team", "sport"];
const optional = ["competition", "quantity", "estimated_price", "notes", "image_url", "back_image_url", "status"];

export default function CsvGuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <a href="/guides" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
              <span aria-hidden>←</span> Back to Guides
            </a>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              CSV Import
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Turn a spreadsheet into a CardCat import</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              CardCat’s import workflow is designed to be forgiving: you can upload a CSV, review duplicates, and fix messy rows before saving.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Quick steps</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-amber-300">1</span>
                <span>Export your spreadsheet as CSV (Google Sheets / Excel: Export / Save As → CSV).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-amber-300">2</span>
                <span>Upload it in CardCat → preview rows → fix duplicates and “needs attention” items.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-amber-300">3</span>
                <span>Save when the review looks clean.</span>
              </li>
            </ol>
            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Tip</div>
              <div className="mt-2 text-sm leading-6 text-slate-100">
                If columns don’t match, use the LLM reformat guide (it’s optimized to output a clean CardCat-ready CSV).
              </div>
              <a href="/guides/csv/llm" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
                Go to LLM reformat <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold text-white">Field expectations</h2>

            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Required fields (best matching)</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {required.map((f) => (
                  <span key={f} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
                    {f}
                  </span>
                ))}
              </div>
            </details>

            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">Optional fields (helpful)</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {optional.map((f) => (
                  <span key={f} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
                    {f}
                  </span>
                ))}
              </div>
            </details>

            <div className="mt-6 text-sm leading-6 text-slate-300">
              If a row is missing a required field, leave the cell blank rather than inventing data.
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Want the fastest path?</h2>
          <div className="mt-2 text-sm text-slate-300">
            Most users do: <a className="font-semibold text-amber-200 hover:text-amber-100" href="/guides/csv/llm">LLM reformat</a> →
            <a className="ml-2 font-semibold text-amber-200 hover:text-amber-100" href="/guides/images"> image upload setup</a> →
            import review in CardCat.
          </div>
        </section>
      </div>
    </main>
  );
}
