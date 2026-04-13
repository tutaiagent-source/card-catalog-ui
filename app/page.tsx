// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Card Catalog</h1>
        <p className="mt-2 text-slate-300">
          MVP prototype: add cards with a wizard, then browse your catalog + “valuable candidates”.
        </p>

        <div className="mt-8 flex gap-3">
          <a
            href="/add-card"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500"
          >
            Add Card
          </a>
          <a
            href="/catalog"
            className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
          >
            Catalog
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Data is saved in your browser (localStorage) until we wire Supabase.
        </p>
      </div>
    </main>
  );
}