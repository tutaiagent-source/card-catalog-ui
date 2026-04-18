import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "LLM CSV Reformat Guide | CardCat",
  description: "Use an LLM to convert your CSV into CardCat format. Output ONLY the CSV in a downloadable code block.",
  openGraph: {
    title: "LLM CSV Reformat Guide | CardCat",
    description: "Use an LLM to convert your CSV into CardCat format. Output ONLY the CSV in a downloadable code block.",
    type: "website",
  },
};

const samplePrompt = `You are helping me prepare a CSV so I can import it into CardCat.

My input: a CSV exported from my existing spreadsheet.

Task:
1) Convert my CSV into the CardCat import format.
2) Output ONLY a CSV (no explanations). Wrap it in a single \`\`\`csv\`\`\` code block so it’s copy/download-friendly (I can save it as a .csv file).
3) Preserve the original values as much as possible.
4) Normalize column meanings to these fields:
   - Required (best matching): player_name, year, brand, set_name, card_number, team, sport
   - Optional: competition, quantity, estimated_price, notes, image_url, back_image_url, status
5) Keep card_number as text (it may include letters).
6) Ensure headers are exactly the field names CardCat expects.

If a row is missing a required field, leave it blank instead of inventing data.

Here is my CSV:`;

export default function CsvLlmGuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              LLM Reformat
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">Convert any spreadsheet into a CardCat-ready CSV</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Copy the prompt below into your LLM. Paste your CSV after “Here is my CSV:”. Ask it to return ONLY the CSV in a code block.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <h2 className="text-2xl font-bold text-white">Copy/paste prompt</h2>
              <pre className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-5 text-slate-200">
                {samplePrompt}
              </pre>
              <p className="mt-3 text-sm text-slate-400">
                Tip: the prompt explicitly tells the LLM to output a single downloadable code block (so you can copy into a .csv file fast).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">How to use it</h2>
              <ol className="mt-4 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">1</span>
                  <span>Paste your CSV after the final line: <span className="font-semibold">Here is my CSV:</span>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">2</span>
                  <span>Make sure the LLM returns ONLY the CSV, wrapped in a single <span className="font-semibold">```csv```</span> block.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">3</span>
                  <span>Upload the result in CardCat → review duplicates → save.</span>
                </li>
              </ol>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Pro tip</div>
                <div className="mt-2 text-sm leading-6 text-slate-100">
                  Tell the LLM to keep <span className="font-semibold">card_number</span> as text so values like “A12/99” don’t get mangled.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Next: images</h2>
          <p className="mt-2 text-sm leading-7 text-amber-100/90">
            Once your CSV imports cleanly, use image uploads to get better previews. See the image guide for supported formats and sizing.
          </p>
          <a href="/guides/images" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
            Go to Image Uploads <span aria-hidden>→</span>
          </a>
        </section>
      </div>
    </main>
  );
}
