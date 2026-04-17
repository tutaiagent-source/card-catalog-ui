import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "How to Prep a CSV for CardCat Import",
  description:
    "If you already have a spreadsheet, learn how to export to CSV and (optionally) use an LLM to reformat it to match CardCat’s import expectations for fast, clean catalog uploads.",
  openGraph: {
    title: "How to Prep a CSV for CardCat Import",
    description:
      "If you already have a spreadsheet, learn how to export to CSV and (optionally) use an LLM to reformat it to match CardCat’s import expectations for fast, clean catalog uploads.",
    type: "website",
  },
};

const samplePrompt = `You are helping me prepare a CSV so I can import it into CardCat.

My input: a CSV exported from my existing spreadsheet.

Task:
1) Convert my CSV into the CardCat import format.
2) Output ONLY a CSV (no explanations). Wrap it in a single code block so I can copy it into a .csv file.
3) Preserve the original values as much as possible.
4) Normalize column meanings to these fields:
   - Required (best matching): player_name, year, brand, set_name, card_number, team, sport
   - Optional: competition, quantity, estimated_price, notes, image_url, back_image_url, status
5) Keep card_number as text (it may include letters).
6) Ensure headers are exactly the field names CardCat expects.

If a row is missing a required field, leave it blank instead of inventing data.

Here is my CSV:`;

export default function ImportHowtoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              CSV Prep Guide
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Turn any spreadsheet into a clean CardCat import
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              If your collection already lives in a spreadsheet, exporting to CSV is step one. If the columns don’t line up, you can use an LLM to reformat your CSV into the fields CardCat expects.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/import"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Go to Import
              </a>
              <a
                href="/features"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
              >
                See Import Features
              </a>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "1) Export your spreadsheet as CSV",
              body: "In Google Sheets / Excel, use Export/Save As → CSV so CardCat can read it.",
            },
            {
              title: "2) (Optional) Reformat with an LLM",
              body: "Paste your CSV into ChatGPT (or another LLM) and ask it to output a CardCat-ready CSV.",
            },
            {
              title: "3) Upload + review in CardCat",
              body: "CardCat’s import workflow flags duplicates and issues so you can fix rows before they’re saved.",
            },
          ].map((step) => (
            <div key={step.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-sm font-semibold text-white">{step.title}</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">What CardCat expects</div>
              <h2 className="mt-3 text-2xl font-bold text-white">Use these fields for the best results</h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                {[
                  "Required for the best matching: player_name, year, brand, set_name, card_number, team, sport",
                  "Optional but helpful: competition, quantity, estimated_price",
                  "Optional for richer previews: image_url, back_image_url",
                  "Optional notes: notes, status",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1 text-amber-300">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Pro tip</div>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Tell the LLM to keep <span className="font-semibold">card_number</span> as text (it may include letters). If a required value is missing in a row, have it leave the cell blank.
                </p>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Copy/paste prompt</div>
              <h3 className="mt-3 text-xl font-bold text-white">LLM prompt you can reuse</h3>
              <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-5 text-slate-200">
                {samplePrompt}
              </pre>
              <p className="mt-3 text-xs leading-6 text-slate-400">
                Paste your CSV after “Here is my CSV:”. Ask the model to output ONLY the CSV.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Still unsure?</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Don’t stress the formatting</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              CardCat’s import review exists for a reason. Even if your CSV is messy, upload it, review what the importer flags, and fix the rows quickly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/import"
                className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000]"
              >
                Start import
              </a>
              <a href="/features" className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]">
                Read features
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
