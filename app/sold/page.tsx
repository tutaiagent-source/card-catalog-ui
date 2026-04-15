"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import CardCatMobileNav from "@/components/CardCatMobileNav";

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

function parseSafeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function shortDate(value?: string | null) {
  const date = parseSafeDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function compactMonth(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
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

  const sortedCards = useMemo(
    () =>
      cards
        .slice()
        .sort((a, b) => String(b.sold_at || "").localeCompare(String(a.sold_at || ""))),
    [cards]
  );

  const totalSoldCards = useMemo(() => cards.reduce((sum, c) => sum + Number(c.quantity || 0), 0), [cards]);
  const grossSales = useMemo(() => cards.reduce((sum, c) => sum + Number(c.sold_price || 0) * Number(c.quantity || 0), 0), [cards]);
  const avgSale = useMemo(() => (totalSoldCards ? grossSales / totalSoldCards : 0), [grossSales, totalSoldCards]);
  const biggestSale = useMemo(() => Math.max(0, ...cards.map((c) => Number(c.sold_price || 0) * Number(c.quantity || 0))), [cards]);

  const topPlatform = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      const key = String(card.sale_platform || "Unknown").trim() || "Unknown";
      counts.set(key, (counts.get(key) || 0) + Number(card.quantity || 0));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  }, [cards]);

  const last30DaysSales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return cards.reduce((sum, card) => {
      const soldDate = parseSafeDate(card.sold_at);
      if (!soldDate || soldDate < cutoff) return sum;
      return sum + Number(card.sold_price || 0) * Number(card.quantity || 0);
    }, 0);
  }, [cards]);

  const lastSaleDate = useMemo(() => sortedCards[0]?.sold_at || null, [sortedCards]);

  const monthlyTrend = useMemo(() => {
    const monthCount = 6;
    const now = new Date();
    const buckets = Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return {
        key,
        label: compactMonth(date),
        revenue: 0,
        quantity: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    cards.forEach((card) => {
      const soldDate = parseSafeDate(card.sold_at);
      if (!soldDate) return;
      const key = `${soldDate.getFullYear()}-${soldDate.getMonth()}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;
      bucket.revenue += Number(card.sold_price || 0) * Number(card.quantity || 0);
      bucket.quantity += Number(card.quantity || 0);
    });

    return buckets;
  }, [cards]);

  const maxTrendRevenue = useMemo(() => Math.max(1, ...monthlyTrend.map((bucket) => bucket.revenue)), [monthlyTrend]);

  const platformBreakdown = useMemo(() => {
    const byPlatform = new Map<string, { revenue: number; quantity: number }>();

    cards.forEach((card) => {
      const key = String(card.sale_platform || "Unknown").trim() || "Unknown";
      const current = byPlatform.get(key) || { revenue: 0, quantity: 0 };
      current.revenue += Number(card.sold_price || 0) * Number(card.quantity || 0);
      current.quantity += Number(card.quantity || 0);
      byPlatform.set(key, current);
    });

    return [...byPlatform.entries()]
      .map(([platform, values]) => ({ platform, ...values }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [cards]);

  const platformMaxRevenue = useMemo(() => Math.max(1, ...platformBreakdown.map((item) => item.revenue)), [platformBreakdown]);

  const recentHighlights = useMemo(() => sortedCards.slice(0, 5), [sortedCards]);

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
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              CardCat.io
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Sales dashboard</h1>
            <div className="mt-2 max-w-2xl text-sm text-slate-400">
              Your sold cards, revenue performance, and recent sales momentum in one cleaner view.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/catalog" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-semibold text-slate-100 hover:bg-white/[0.08]">Catalog</a>
            <a href="/import" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 font-semibold text-slate-200 hover:bg-slate-800">Import</a>
            <a href="/account" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 font-semibold text-slate-200 hover:bg-slate-800">My Account</a>
          </div>
        </div>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[24px] border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.15))] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Revenue pulse</div>
              <div className="mt-3 text-4xl font-bold text-white">{money(grossSales)}</div>
              <div className="mt-2 text-sm text-emerald-100/80">Gross sales across {totalSoldCards} sold card{totalSoldCards === 1 ? "" : "s"}.</div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Last 30 days</div>
                  <div className="mt-2 text-xl font-semibold text-white">{money(last30DaysSales)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Average sale</div>
                  <div className="mt-2 text-xl font-semibold text-white">{money(avgSale)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Latest sale</div>
                  <div className="mt-2 text-xl font-semibold text-white">{lastSaleDate ? shortDate(lastSaleDate) : "-"}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="text-sm text-slate-400">Highest sale</div>
                <div className="mt-2 text-3xl font-bold text-white">{money(biggestSale)}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="text-sm text-slate-400">Top platform</div>
                <div className="mt-2 text-3xl font-bold text-white">{topPlatform}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Cards sold</div>
            <div className="mt-2 text-3xl font-bold text-white">{totalSoldCards}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Average sale per card</div>
            <div className="mt-2 text-3xl font-bold text-white">{money(avgSale)}</div>
          </div>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
            <div className="text-sm text-slate-300">Highest sale</div>
            <div className="mt-2 text-3xl font-bold text-white">{money(biggestSale)}</div>
          </div>
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.08] p-5 shadow-[0_18px_40px_rgba(59,130,246,0.08)]">
            <div className="text-sm text-slate-300">Top platform</div>
            <div className="mt-2 text-3xl font-bold text-white">{topPlatform}</div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Revenue trend</h2>
                <p className="mt-1 text-sm text-slate-400">Last 6 months of sold revenue.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-300">
                {money(grossSales)} total
              </div>
            </div>

            <div className="mt-6 grid h-64 grid-cols-6 items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              {monthlyTrend.map((bucket) => {
                const height = cards.length === 0 ? "12%" : `${Math.max(12, (bucket.revenue / maxTrendRevenue) * 100)}%`;
                return (
                  <div key={bucket.key} className="flex h-full flex-col justify-end">
                    <div className="text-center text-[11px] text-slate-500">{bucket.revenue > 0 ? money(bucket.revenue) : "$0"}</div>
                    <div className="mt-2 flex flex-1 items-end">
                      <div
                        className={`w-full rounded-t-2xl ${cards.length === 0 ? "bg-white/10" : "bg-[linear-gradient(180deg,rgba(251,191,36,0.95),rgba(217,119,6,0.58))] shadow-[0_10px_30px_rgba(245,158,11,0.22)]"}`}
                        style={{ height }}
                      />
                    </div>
                    <div className="mt-3 text-center text-xs font-semibold text-slate-300">{bucket.label}</div>
                    <div className="mt-1 text-center text-[11px] text-slate-500">{bucket.quantity} sold</div>
                  </div>
                );
              })}
            </div>

            {cards.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                No sales recorded yet. The graph is visible now, and it will populate automatically once cards are moved to Sold.
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h2 className="text-lg font-semibold text-white">Platform mix</h2>
              <p className="mt-1 text-sm text-slate-400">Where your sold revenue is coming from.</p>

              <div className="mt-5 space-y-4">
                {platformBreakdown.length > 0 ? platformBreakdown.map((item) => (
                  <div key={item.platform}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="font-semibold text-slate-200">{item.platform}</div>
                      <div className="text-slate-400">{money(item.revenue)}</div>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(59,130,246,0.95),rgba(16,185,129,0.9))]"
                        style={{ width: `${Math.max(8, (item.revenue / platformMaxRevenue) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{item.quantity} card{item.quantity === 1 ? "" : "s"} sold</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    Platform performance will show up here once sales start coming in.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h2 className="text-lg font-semibold text-white">Recent wins</h2>
              <p className="mt-1 text-sm text-slate-400">Latest completed sales.</p>

              <div className="mt-4 space-y-3">
                {recentHighlights.length > 0 ? recentHighlights.map((card, index) => (
                  <div key={`${card.id || index}-${card.card_number}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{card.player_name}</div>
                        <div className="mt-1 text-sm text-slate-300">{card.year} · {card.brand} · #{card.card_number}</div>
                        <div className="text-sm text-slate-400">{card.set_name}{card.parallel ? ` · ${card.parallel}` : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-emerald-300">{money(Number(card.sold_price || 0) * Number(card.quantity || 0))}</div>
                        <div className="mt-1 text-xs text-slate-500">{shortDate(card.sold_at)}</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    Your latest sold cards will show here once sales are recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Sales history</h2>
              <p className="mt-1 text-sm text-slate-400">Every sold card, newest first.</p>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
              <div className="text-lg font-semibold">No sold cards yet</div>
              <div className="mt-2 text-sm text-slate-400">Once cards are moved to Sold, this section will fill in with your complete sales history.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/catalog" className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700">Back to catalog</a>
                <a href="/add-card" className="rounded-lg bg-[#d50000] px-3 py-2 text-sm font-semibold hover:bg-[#b80000]">Add card</a>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {sortedCards.map((card, i) => (
                  <div key={`${card.player_name}-${card.card_number}-${card.id || i}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="font-semibold text-white">{card.player_name}</div>
                    <div className="mt-1 text-sm text-slate-300">{card.year} · {card.brand} · #{card.card_number}</div>
                    <div className="text-sm text-slate-400">{card.set_name}{card.parallel ? ` · ${card.parallel}` : ""}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Sold for</div>
                        <div className="font-semibold text-emerald-300">{money(Number(card.sold_price || 0) * Number(card.quantity || 0))}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Date</div>
                        <div className="font-semibold text-white">{shortDate(card.sold_at)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Platform</div>
                        <div className="font-semibold text-white">{card.sale_platform || "-"}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Grade</div>
                        <div className="font-semibold text-white">{card.graded === "yes" && card.grade != null ? card.grade : "-"}</div>
                      </div>
                    </div>
                    <a
                      href={card.id ? `/add-card?edit=${encodeURIComponent(card.id)}` : "/add-card"}
                      className="mt-3 inline-flex rounded-lg bg-[#b80000] px-3 py-2 text-sm font-semibold hover:bg-[#d50000]"
                    >
                      Edit sale details
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04] md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-950/90 text-left text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Card</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Sold for</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCards.map((card, i) => (
                      <tr key={`${card.player_name}-${card.card_number}-${card.id || i}`} className="border-t border-white/10 align-top hover:bg-white/[0.025]">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{card.player_name}</div>
                          <div className="text-xs text-slate-400">{card.year} · {card.team}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-200">{card.brand} · {card.set_name}</div>
                          <div className="text-xs text-slate-400">{card.parallel} · #{card.card_number}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{card.quantity}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-300">{money(Number(card.sold_price || 0) * Number(card.quantity || 0))}</td>
                        <td className="px-4 py-3 text-slate-200">{shortDate(card.sold_at)}</td>
                        <td className="px-4 py-3 text-slate-200">{card.sale_platform || "-"}</td>
                        <td className="px-4 py-3 text-slate-200">{card.graded === "yes" && card.grade != null ? card.grade : "-"}</td>
                        <td className="px-4 py-3">
                          <a href={card.id ? `/add-card?edit=${encodeURIComponent(card.id)}` : "/add-card"} className="rounded-lg bg-[#b80000] px-3 py-2 text-xs font-semibold hover:bg-[#d50000]">
                            Edit
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
      <CardCatMobileNav />
    </main>
  );
}
