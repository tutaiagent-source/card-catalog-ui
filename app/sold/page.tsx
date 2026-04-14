"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

type CardStatus = "Collection" | "Listed" | "Sold";

type SoldCard = {
  id?: string;
  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;
  card_number: string;
  team: string;
  sport: string;
  quantity: number;
  graded?: "yes" | "no";
  grade?: number | null;
  sold_price?: number | null;
  sold_at?: string;
  sale_platform?: string | null;
  status?: CardStatus | string;
};

function normalizeStatusValue(status?: string | null): CardStatus {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw || raw === "incoming" || raw === "collection") return "Collection";
  if (raw === "listed") return "Listed";
  if (raw === "sold") return "Sold";
  return "Collection";
}

export default function SoldPage() {
  const { user, loading } = useSupabaseUser();
  const [cards, setCards] = useState<SoldCard[]>([]);

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "Sold");

      if (error) {
        console.error("Failed to fetch sold cards:", error);
        return;
      }

      setCards(((data ?? []) as SoldCard[]).map((card) => ({ ...card, status: normalizeStatusValue(card.status) })));
    })();
  }, [user?.id]);

  const totalSoldCards = useMemo(() => cards.reduce((sum, c) => sum + Number(c.quantity || 0), 0), [cards]);
  const grossSales = useMemo(() => cards.reduce((sum, c) => sum + Number(c.sold_price || 0) * Number(c.quantity || 0), 0), [cards]);
  const avgSale = useMemo(() => (totalSoldCards ? grossSales / totalSoldCards : 0), [grossSales, totalSoldCards]);
  const biggestSale = useMemo(() => Math.max(0, ...cards.map((c) => Number(c.sold_price || 0))), [cards]);
  const topPlatform = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      const key = String(card.sale_platform || "Unknown").trim() || "Unknown";
      counts.set(key, (counts.get(key) || 0) + Number(card.quantity || 0));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  }, [cards]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 text-slate-300">Loading sold history...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign in required</h1>
          <p className="mt-3 text-slate-300">Please sign in to view your sold history.</p>
          <a href="/login" className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]">Go to sign in</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sold</h1>
            <div className="mt-1 text-sm text-slate-400">Your sold cards, revenue, and sales history.</div>
          </div>
          <div className="flex gap-3">
            <a href="/catalog" className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700">Catalog</a>
            <a href="/account" className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700">My Account</a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Cards sold</div>
            <div className="mt-2 text-2xl font-bold">{totalSoldCards}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Gross sales</div>
            <div className="mt-2 text-2xl font-bold">${grossSales.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Avg sale per card</div>
            <div className="mt-2 text-2xl font-bold">${avgSale.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Highest sale</div>
            <div className="mt-2 text-2xl font-bold">${biggestSale.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Top platform</div>
            <div className="mt-2 text-2xl font-bold">{topPlatform}</div>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
            No sold cards yet. When a card is marked Sold, it will show up here with sales metrics.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded border border-slate-800 bg-slate-900">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950 text-left text-slate-400">
                <tr>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Card</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Sold for</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards
                  .slice()
                  .sort((a, b) => String(b.sold_at || "").localeCompare(String(a.sold_at || "")))
                  .map((card, i) => (
                    <tr key={`${card.player_name}-${card.card_number}-${card.id || i}`} className="border-t border-slate-800 align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold">{card.player_name}</div>
                        <div className="text-xs text-slate-400">{card.year} · {card.team}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{card.brand} · {card.set_name}</div>
                        <div className="text-xs text-slate-400">{card.parallel} · #{card.card_number}</div>
                      </td>
                      <td className="px-3 py-2">{card.quantity}</td>
                      <td className="px-3 py-2">${(Number(card.sold_price || 0) * Number(card.quantity || 0)).toFixed(2)}</td>
                      <td className="px-3 py-2">{card.sold_at || "-"}</td>
                      <td className="px-3 py-2">{card.sale_platform || "-"}</td>
                      <td className="px-3 py-2">{card.graded === "yes" && card.grade != null ? card.grade : "-"}</td>
                      <td className="px-3 py-2">
                        <a
                          href={card.id ? `/add-card?edit=${encodeURIComponent(card.id)}` : "/add-card"}
                          className="rounded bg-[#b80000] px-2 py-1 text-xs font-semibold hover:bg-[#d50000]"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
