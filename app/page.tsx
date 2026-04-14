// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Card Catalog</h1>
        <p className="mt-2 text-slate-300">
          Track your cards, save your collection, and jump straight into pricing and catalog tools.
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
          Email sign-in is now used for saved collections.
        </p>
      </div>
    </main>
  );
}