// app/catalog/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

type YesNo = "yes" | "no";

type Card = {
  id?: string;

  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;

  card_number: string;
  team: string;
  sport: string;

  rookie: YesNo;
  is_autograph: YesNo;
  has_memorabilia: YesNo;

  serial_number_text: string;
  quantity: number;

  image_url?: string;
  back_image_url?: string;

  status?: string;
  notes?: string;
  date_added?: string;
};

function storageKey() {
  return "cards_v1";
}

function normalizeParallelLabel(p: string | undefined | null) {
  const raw = String(p ?? "").trim();
  if (!raw || raw.toLowerCase() === "n/a") return "n/a";
  const v = raw.replace(/\s+/g, " ");
  const lower = v.toLowerCase();
  if (lower === "parallel") return "Parallel";
  if (lower === "insert") return "Insert";
  if (lower.includes("parallel") && lower.includes("insert")) return "Parallel/Insert";
  return v;
}

function normalizeCards(cards: Card[]) {
  let changed = false;
  const fixed = cards.map((c) => {
    const parallel = normalizeParallelLabel(c.parallel);
    const id = c.id ?? crypto.randomUUID();

    if (!c.id || parallel !== c.parallel) {
      changed = true;
      return { ...c, id, parallel };
    }

    return c;
  });
  return { fixed, changed };
}

function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Card[];
    const { fixed, changed } = normalizeCards(parsed);
    if (changed) localStorage.setItem(storageKey(), JSON.stringify(fixed));
    return fixed;
  } catch {
    return [];
  }
}

function saveCards(cards: Card[]) {
  localStorage.setItem(storageKey(), JSON.stringify(cards));
}

function driveToImageSrc(url?: string) {
  const u = (url || "").trim();
  const m = u.match(/\/d\/([^/]+)\/view/);
  if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return u;
}

function parseDen(serial: string): number | null {
  const s = (serial || "").trim();
  if (!s || s.toLowerCase() === "n/a") return null;
  const m = s.match(/\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function isNumbered(serial: string) {
  const s = (serial || "").trim().toLowerCase();
  return s && s.includes("/") && s !== "n/a" && !s.endsWith("/");
}

function score(card: Card) {
  let sc = 0;

  if (card.is_autograph === "yes") sc += 50;
  if (card.has_memorabilia === "yes") sc += 30;
  if (card.rookie === "yes") sc += 20;

  if (isNumbered(card.serial_number_text)) {
    sc += 10;
    const den = parseDen(card.serial_number_text);

    if (den != null) {
      if (den <= 25) sc += 25;
      else if (den <= 50) sc += 20;
      else if (den <= 100) sc += 12;
      else if (den <= 150) sc += 8;
      else if (den <= 250) sc += 5;
      else sc += 2;
    }
  }

  const p = (card.parallel || "").toLowerCase();
  const pairs: Array<[string, number]> = [
    ["gold", 14],
    ["black", 12],
    ["hyper", 10],
    ["red", 8],
    ["blue", 6],
    ["silver", 5],
    ["orange", 5],
    ["prizm", 4],
  ];
  for (const [kw, add] of pairs) if (p.includes(kw)) sc += add;

  if ((card.card_number || "").trim() && card.card_number.toLowerCase() !== "n/a") sc += 4;
  return sc;
}

export default function CatalogPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [testerKey, setTesterKey] = useState<string>("");
  const [q, setQ] = useState("");
  const [filterRookie, setFilterRookie] = useState<"all" | "yes" | "no">("all");

  const fetchCards = async () => {
    if (!supabaseConfigured || !supabase) return;
    if (!testerKey) return;

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("tester_key", testerKey);

    if (error) {
      console.error("Failed to fetch cards:", error);
      return;
    }

    setCards((data ?? []) as any);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tk = params.get("tester_key");

    if (tk) {
      setTesterKey(tk);
      return;
    }

    const existing = localStorage.getItem("tester_key");
    if (existing) {
      setTesterKey(existing);
    } else {
      const newKey = crypto.randomUUID();
      localStorage.setItem("tester_key", newKey);
      setTesterKey(newKey);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [testerKey]);

  const sync = () => fetchCards();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return cards.filter((c) => {
      const matchesQ =
        !s ||
        `${c.player_name} ${c.team} ${c.year} ${c.brand} ${c.set_name} ${c.parallel} ${c.card_number} ${c.serial_number_text}`
          .toLowerCase()
          .includes(s);

      const matchesRookie = filterRookie === "all" ? true : c.rookie === filterRookie;
      return matchesQ && matchesRookie;
    });
  }, [cards, q, filterRookie]);

  const valuable = useMemo(() => {
    return [...cards].sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [cards]);

  const onDelete = async (id?: string) => {
    if (!id) return;
    const ok = confirm("Delete this card?");
    if (!ok) return;

    if (!supabaseConfigured || !supabase) return;
    if (!testerKey) return;

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", id)
      .eq("tester_key", testerKey);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }

    sync();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Catalog</h1>
          <div className="flex gap-3">
            <a
              href={`/add-card?tester_key=${encodeURIComponent(testerKey)}`}
              className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
            >
              Add Card
            </a>
            <button
              className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
              onClick={async () => {
                if (!supabaseConfigured || !supabase) return;
                if (!testerKey) return;
                const { error } = await supabase
                  .from("cards")
                  .delete()
                  .eq("tester_key", testerKey);
                if (error) {
                  alert(`Clear failed: ${error.message}`);
                  return;
                }
                sync();
              }}
            >
              Clear Demo Data
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded bg-slate-900 px-3 py-2"
            placeholder="Search player, team, set, serial..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded bg-slate-900 px-3 py-2"
            value={filterRookie}
            onChange={(e) => setFilterRookie(e.target.value as any)}
          >
            <option value="all">Rookie: all</option>
            <option value="yes">Rookie: yes</option>
            <option value="no">Rookie: no</option>
          </select>
          <button
            className="rounded bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            onClick={sync}
          >
            Refresh
          </button>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Valuable Candidates</h2>
          <p className="mt-1 text-sm text-slate-400">
            Heuristic ranking from your entered fields.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {valuable.length === 0 ? (
              <div className="rounded border border-slate-800 bg-slate-900 p-4 text-slate-400">
                No cards yet. Click “Add Card”.
              </div>
            ) : (
              valuable.map((c, i) => (
                <div key={`${c.player_name}-${c.card_number}-${i}`} className="rounded border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{c.player_name}</div>
                      <div className="text-sm text-slate-300">
                        {c.year} · {c.brand} · {c.set_name}
                      </div>
                      <div className="text-sm text-slate-300">
                        {c.parallel} · #{c.card_number} · {c.serial_number_text || "(no serial)"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={c.id ? `/add-card?tester_key=${encodeURIComponent(testerKey)}&edit=${encodeURIComponent(c.id)}` : `/add-card?tester_key=${encodeURIComponent(testerKey)}`}
                        className="rounded bg-[#b80000] px-3 py-1 text-xs font-semibold hover:bg-[#d50000]"
                      >
                        Edit
                      </a>
                      <button
                        className="rounded bg-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-600"
                        onClick={() => onDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {c.is_autograph === "yes" && <span className="rounded bg-[#d50000] px-2 py-1">Auto</span>}
                    {c.has_memorabilia === "yes" && <span className="rounded bg-[#d50000] px-2 py-1">Mem</span>}
                    {c.rookie === "yes" && <span className="rounded bg-amber-500 px-2 py-1 text-black">RC</span>}
                    {!c.image_url && <span className="rounded bg-slate-800 px-2 py-1">No front URL</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">All Cards</h2>

          <div className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded border border-slate-800 bg-slate-900 p-4 text-slate-400">No matches.</div>
            ) : (
              filtered.map((c, i) => (
                <div
                  key={`${c.player_name}-${c.year}-${c.card_number}-${c.id || i}`}
                  className="rounded border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-semibold">{c.player_name}</div>
                      <div className="text-sm text-slate-300">
                        {c.year} · {c.brand} · {c.set_name}
                      </div>
                      <div className="text-sm text-slate-300">
                        {c.parallel} · #{c.card_number} · {c.serial_number_text || "(no serial)"}
                      </div>
                      <div className="text-sm text-slate-300">
                        {c.team} · {c.sport}
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-0 flex flex-col gap-2">
                      <div className="text-xs text-slate-400">Qty: {c.quantity}</div>
                      <div className="flex gap-2">
                        <a
                          href={c.id ? `/add-card?tester_key=${encodeURIComponent(testerKey)}&edit=${encodeURIComponent(c.id)}` : `/add-card?tester_key=${encodeURIComponent(testerKey)}`}
                          className="rounded bg-[#b80000] px-3 py-1 text-xs font-semibold hover:bg-[#d50000]"
                        >
                          Edit
                        </a>
                        <button
                          className="rounded bg-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-600"
                          onClick={() => onDelete(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {c.image_url && (
                    <div className="mt-3">
                      <img
                        alt="front"
                        src={driveToImageSrc(c.image_url)}
                        className="h-24 w-auto rounded border border-slate-800 object-contain bg-slate-950"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
