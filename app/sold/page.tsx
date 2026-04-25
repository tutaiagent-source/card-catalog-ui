"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { buildSellerNotes, computeSaleMetrics, parseSellerMeta } from "@/lib/cardSellerMeta";
import { usePlanPreview } from "@/lib/planPreview";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import UsernamePromptBanner from "@/components/UsernamePromptBanner";

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
  competition?: string | null;
  quantity: number;
  graded?: "yes" | "no";
  grade?: number | null;
  sold_price?: number | null;
  sold_at?: string;
  sale_platform?: string | null;
  notes?: string | null;
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

function toDateInputValue(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function compactMonth(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function normalizePlatformLabel(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "Unknown";

  const collapsed = raw.replace(/\s+/g, " ").toLowerCase();
  const known: Record<string, string> = {
    ebay: "eBay",
    "e-bay": "eBay",
    whatnot: "Whatnot",
    paypal: "PayPal",
    venmo: "Venmo",
    myslabs: "MySlabs",
    comc: "COMC",
    instagram: "Instagram",
    facebook: "Facebook",
    "facebook marketplace": "Facebook Marketplace",
  };

  if (known[collapsed]) return known[collapsed];

  return collapsed.replace(/\b\w/g, (char) => char.toUpperCase());
}

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export default function SoldPage() {
  const { user, loading } = useSupabaseUser();
  const needsEmailVerification = !!user && !(user as any)?.email_confirmed_at;
  const { isCollectorPreview } = usePlanPreview();
  const [cards, setCards] = useState<SoldCard[]>([]);
  const [graphsRaised, setGraphsRaised] = useState(false);

  const [saleEditOpen, setSaleEditOpen] = useState(false);
  const [saleEditCard, setSaleEditCard] = useState<SoldCard | null>(null);
  const [saleDraftSoldPrice, setSaleDraftSoldPrice] = useState<string>("");
  const [saleDraftSoldAt, setSaleDraftSoldAt] = useState<string>("");
  const [saleDraftSalePlatform, setSaleDraftSalePlatform] = useState<string>("");
  const [saleDraftQuantity, setSaleDraftQuantity] = useState<number>(1);
  const [saleDraftCostBasis, setSaleDraftCostBasis] = useState<string>("");
  const [saleDraftPlatformFee, setSaleDraftPlatformFee] = useState<string>("");
  const [saleDraftShippingCost, setSaleDraftShippingCost] = useState<string>("");
  const [saleEditSaving, setSaleEditSaving] = useState(false);
  const [saleEditError, setSaleEditError] = useState<string>("");

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

  useEffect(() => {
    if (loading) return;
    setGraphsRaised(true);
  }, [loading, cards.length]);

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

  const salesWithMetrics = useMemo(
    () =>
      sortedCards.map((card) => {
        const seller = parseSellerMeta(card.notes);
        return {
          ...card,
          sellerMeta: seller.meta,
          publicNotes: seller.publicNotes,
          metrics: computeSaleMetrics({
            grossSale: Number(card.sold_price || 0) * Number(card.quantity || 0),
            costBasis: seller.meta.costBasis,
            shippingCost: seller.meta.shippingCost,
            platformFee: seller.meta.platformFee,
          }),
        };
      }),
    [sortedCards]
  );

  const totalNetProfit = useMemo(
    () => salesWithMetrics.reduce((sum, card) => sum + card.metrics.netProfit, 0),
    [salesWithMetrics]
  );

  const totalCostBasis = useMemo(
    () => salesWithMetrics.reduce((sum, card) => sum + card.metrics.costBasis, 0),
    [salesWithMetrics]
  );

  const totalFees = useMemo(
    () => salesWithMetrics.reduce((sum, card) => sum + card.metrics.platformFee, 0),
    [salesWithMetrics]
  );

  const totalShipping = useMemo(
    () => salesWithMetrics.reduce((sum, card) => sum + card.metrics.shippingCost, 0),
    [salesWithMetrics]
  );

  const overallRoi = useMemo(
    () => (totalCostBasis > 0 ? (totalNetProfit / totalCostBasis) * 100 : null),
    [totalCostBasis, totalNetProfit]
  );

  const topPlatform = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      const key = normalizePlatformLabel(card.sale_platform);
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

  const openSaleEdit = (card: SoldCard) => {
    setSaleEditCard(card);
    setSaleDraftSoldPrice(card.sold_price == null ? "" : String(card.sold_price));
    setSaleDraftSoldAt(toDateInputValue(card.sold_at));
    setSaleDraftSalePlatform(card.sale_platform == null ? "" : String(card.sale_platform));
    setSaleDraftQuantity(Number(card.quantity || 1));

    const seller = parseSellerMeta(card.notes);
    setSaleDraftCostBasis(seller.meta.costBasis == null ? "" : String(seller.meta.costBasis));
    setSaleDraftShippingCost(seller.meta.shippingCost == null ? "" : String(seller.meta.shippingCost));
    setSaleDraftPlatformFee(seller.meta.platformFee == null ? "" : String(seller.meta.platformFee));

    setSaleEditError("");
    setSaleEditOpen(true);
  };

  const onSaveSaleEdit = async () => {
    if (!saleEditCard?.id) return;
    if (!user?.id) return;
    if (!supabaseConfigured || !supabase) return;

    setSaleEditSaving(true);
    setSaleEditError("");

    const soldPriceRaw = saleDraftSoldPrice.trim();
    let soldPrice: number | null = null;
    if (soldPriceRaw !== "") {
      const parsed = Number(soldPriceRaw);
      if (!Number.isFinite(parsed)) {
        setSaleEditError("Enter a valid sold price.");
        setSaleEditSaving(false);
        return;
      }
      soldPrice = parsed;
    }

    const soldAtRaw = saleDraftSoldAt.trim();
    const soldAt = soldAtRaw !== "" ? soldAtRaw : null;

    const platformRaw = saleDraftSalePlatform.trim();
    const salePlatform = platformRaw !== "" ? platformRaw : null;

    const quantity = Math.max(1, Number(saleDraftQuantity || 1));

    const costBasisRaw = saleDraftCostBasis.trim();
    const costBasis = costBasisRaw !== "" ? Number(costBasisRaw) : null;
    const shippingCostRaw = saleDraftShippingCost.trim();
    const shippingCost = shippingCostRaw !== "" ? Number(shippingCostRaw) : null;
    const platformFeeRaw = saleDraftPlatformFee.trim();
    const platformFee = platformFeeRaw !== "" ? Number(platformFeeRaw) : null;

    if (costBasisRaw !== "" && !Number.isFinite(Number(costBasis))) {
      setSaleEditError("Enter a valid card cost.");
      setSaleEditSaving(false);
      return;
    }
    if (shippingCostRaw !== "" && !Number.isFinite(Number(shippingCost))) {
      setSaleEditError("Enter a valid shipping cost.");
      setSaleEditSaving(false);
      return;
    }
    if (platformFeeRaw !== "" && !Number.isFinite(Number(platformFee))) {
      setSaleEditError("Enter a valid platform fee.");
      setSaleEditSaving(false);
      return;
    }

    // Rebuild the seller meta block stored in `cards.notes`
    const nextNotes = buildSellerNotes(saleEditCard.notes, {
      costBasis,
      shippingCost,
      platformFee,
    });

    try {
      const { error } = await supabase
        .from("cards")
        .update({
          sold_price: soldPrice,
          sold_at: soldAt,
          sale_platform: salePlatform,
          quantity,
          status: "Sold",
          notes: nextNotes,
        })
        .eq("id", saleEditCard.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCards((prev) =>
        prev.map((c) =>
          c.id === saleEditCard.id
            ? {
                ...c,
                sold_price: soldPrice,
                sold_at: soldAt ?? undefined,
                sale_platform: salePlatform ?? undefined,
                quantity,
                status: "Sold",
                notes: nextNotes,
              }
            : c
        )
      );

      setSaleEditOpen(false);
      setSaleEditCard(null);
    } catch (err: any) {
      setSaleEditError(err?.message || "Could not save.");
    } finally {
      setSaleEditSaving(false);
    }
  };

  const saleEditPreviewMetrics = useMemo(() => {
    const grossSale = Number(saleDraftSoldPrice || 0) * Number(saleDraftQuantity || 1);
    const costBasis = saleDraftCostBasis.trim() === "" ? null : Number(saleDraftCostBasis);
    const shippingCost = saleDraftShippingCost.trim() === "" ? null : Number(saleDraftShippingCost);
    const platformFee = saleDraftPlatformFee.trim() === "" ? null : Number(saleDraftPlatformFee);

    if (Number.isNaN(grossSale)) return computeSaleMetrics({ grossSale: 0, costBasis, shippingCost, platformFee });
    if ((costBasis != null && Number.isNaN(costBasis)) || (shippingCost != null && Number.isNaN(shippingCost)) || (platformFee != null && Number.isNaN(platformFee))) {
      return computeSaleMetrics({ grossSale, costBasis: null, shippingCost: null, platformFee: null });
    }

    return computeSaleMetrics({ grossSale, costBasis, shippingCost, platformFee });
  }, [saleDraftSoldPrice, saleDraftQuantity, saleDraftCostBasis, saleDraftShippingCost, saleDraftPlatformFee]);

  const monthlyNetProfitTrend = useMemo(() => {
    const monthCount = 6;
    const now = new Date();
    const buckets = Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return {
        key,
        label: compactMonth(date),
        netProfit: 0,
        quantity: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    salesWithMetrics.forEach((card) => {
      const soldDate = parseSafeDate(card.sold_at);
      if (!soldDate) return;
      const key = `${soldDate.getFullYear()}-${soldDate.getMonth()}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;

      bucket.netProfit += card.metrics.netProfit;
      bucket.quantity += Number(card.quantity || 0);
    });

    return buckets;
  }, [salesWithMetrics]);

  const maxTrendNetProfitAbs = useMemo(
    () => Math.max(1, ...monthlyNetProfitTrend.map((bucket) => Math.abs(bucket.netProfit))),
    [monthlyNetProfitTrend]
  );

  const platformBreakdown = useMemo(() => {
    const byPlatform = new Map<string, { revenue: number; quantity: number }>();

    cards.forEach((card) => {
      const key = normalizePlatformLabel(card.sale_platform);
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

  const platformProfitBreakdown = useMemo(() => {
    const byPlatform = new Map<string, { netProfit: number; quantity: number }>();

    salesWithMetrics.forEach((card) => {
      const key = normalizePlatformLabel(card.sale_platform);
      const current = byPlatform.get(key) || { netProfit: 0, quantity: 0 };
      current.netProfit += card.metrics.netProfit;
      current.quantity += Number(card.quantity || 0);
      byPlatform.set(key, current);
    });

    return [...byPlatform.entries()]
      .map(([platform, values]) => ({ platform, ...values }))
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [salesWithMetrics]);

  const platformProfitMaxAbs = useMemo(
    () => Math.max(1, ...platformProfitBreakdown.map((item) => Math.abs(item.netProfit))),
    [platformProfitBreakdown]
  );

  const recentHighlights = useMemo(() => salesWithMetrics.slice(0, 5), [salesWithMetrics]);

  const exportSalesCsv = () => {
    if (salesWithMetrics.length === 0) return;

    const headers = [
      "Player Name",
      "Year",
      "Brand",
      "Set Name",
      "Parallel",
      "Card Number",
      "Team",
      "Sport",
      "Competition",
      "Quantity",
      "Sold Price Per Card",
      "Gross Sale",
      "Sold Date",
      "Platform",
      "Card Cost",
      "Shipping Cost",
      "Platform Fee",
      "Net Profit",
      "ROI %",
      "Graded",
      "Grade",
      "Notes",
    ];

    const rows = salesWithMetrics.map((card) => {
      const soldPricePerCard = card.sold_price != null && String(card.sold_price).trim() !== "" ? Number(card.sold_price) : null;
      const costBasis = card.sellerMeta.costBasis ?? null;
      const shippingCost = card.sellerMeta.shippingCost ?? null;
      const platformFee = card.sellerMeta.platformFee ?? null;
      const roi = card.metrics.roi != null ? Number(card.metrics.roi.toFixed(2)) : null;

      return [
        card.player_name,
        card.year,
        card.brand,
        card.set_name,
        card.parallel,
        card.card_number,
        card.team,
        card.sport,
        card.competition || "",
        Number(card.quantity || 0),
        soldPricePerCard == null ? "" : money(soldPricePerCard),
        card.metrics.grossSale == null ? "" : money(Number(card.metrics.grossSale)),
        toDateInputValue(card.sold_at) || "",
        normalizePlatformLabel(card.sale_platform),
        costBasis == null ? "" : money(Number(costBasis)),
        shippingCost == null ? "" : money(Number(shippingCost)),
        platformFee == null ? "" : money(Number(platformFee)),
        card.metrics.netProfit == null ? "" : money(Number(card.metrics.netProfit)),
        roi == null ? "" : `${roi.toFixed(2)}%`,
        card.graded || "",
        card.grade ?? "",
        card.publicNotes || "",
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardcat-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

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
          <h1 className="text-3xl font-bold">Sign In Required</h1>
          <p className="mt-3 text-slate-300">Please sign in to view your sold history.</p>
          <a href="/login" className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]">Go to sign in</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-24">
        <EmailVerificationNotice needsVerification={needsEmailVerification} email={(user as any)?.email} />
        <UsernamePromptBanner userId={user?.id} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardCatLogo />
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Sales Dashboard</h1>
            <div className="mt-2 max-w-2xl text-sm text-slate-400">
              Your sold cards, revenue performance, and recent sales momentum in one cleaner view.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/catalog" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-semibold text-slate-100 hover:bg-white/[0.08]">Catalog</a>
            <a href="/messages" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-semibold text-slate-100 hover:bg-white/[0.08]">Messages</a>
            {isCollectorPreview ? (
              <a href="/account" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 font-semibold text-amber-200 hover:bg-amber-500/15">
                Export sales CSV (Pro)
              </a>
            ) : (
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={exportSalesCsv}
                disabled={salesWithMetrics.length === 0}
              >
                Export sales CSV
              </button>
            )}
            <a href="/import" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 font-semibold text-slate-200 hover:bg-slate-800">Import</a>
            <a href="/account" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 font-semibold text-slate-200 hover:bg-slate-800">My Account</a>
          </div>
        </div>

        {isCollectorPreview ? (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4 text-sm text-amber-100">
            Collector preview is active. Basic sold tracking stays visible here, while export and deeper analytics are shown as Pro-only.
            <a href="/account" className="ml-2 font-semibold underline underline-offset-2">Change preview</a>
          </div>
        ) : null}

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
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">{isCollectorPreview ? "Cards sold" : "Net profit"}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{isCollectorPreview ? totalSoldCards : money(totalNetProfit)}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="text-sm text-slate-400">Highest sale</div>
                <div className="mt-2 text-3xl font-bold text-white">{money(biggestSale)}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="text-sm text-slate-400">{isCollectorPreview ? "Cards sold" : "Top platform"}</div>
                <div className="mt-2 text-3xl font-bold text-white">{isCollectorPreview ? totalSoldCards : topPlatform}</div>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-6 grid gap-4 ${isCollectorPreview ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-6"}`}>
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
          {!isCollectorPreview ? (
            <>
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.08] p-5 shadow-[0_18px_40px_rgba(16,185,129,0.08)]">
              <div className="text-sm text-slate-300">Net profit</div>
              <div className="mt-2 text-3xl font-bold text-white">{money(totalNetProfit)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-sm text-slate-400">ROI</div>
              <div className="mt-2 text-3xl font-bold text-white">{overallRoi != null ? `${overallRoi.toFixed(1)}%` : "-"}</div>
            </div>
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
              <div className="text-sm text-slate-300">Highest sale</div>
              <div className="mt-2 text-3xl font-bold text-white">{money(biggestSale)}</div>
            </div>
            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.08] p-5 shadow-[0_18px_40px_rgba(59,130,246,0.08)]">
              <div className="text-sm text-slate-300">Top platform</div>
              <div className="mt-2 text-3xl font-bold text-white">{topPlatform}</div>
            </div>
            </>
          ) : null}
        </section>

        {isCollectorPreview ? (
          <section className="mt-6 rounded-3xl border border-amber-500/20 bg-amber-500/[0.08] p-6 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Pro analytics preview</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Advanced Profit Analytics Live in Pro</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">Collector keeps the basics: sold history, sale values, and simple dashboard stats. Pro unlocks profit breakdowns, ROI, platform mix, export, and richer trends.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Card cost, fees, and shipping rollups",
                "Net profit and ROI detail",
                "Revenue Trend and platform mix",
                "Sales CSV export",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </section>
        ) : (
        <>
        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Card cost tracked</div>
            <div className="mt-2 text-2xl font-bold text-white">{money(totalCostBasis)}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Platform fees</div>
            <div className="mt-2 text-2xl font-bold text-white">{money(totalFees)}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Shipping costs</div>
            <div className="mt-2 text-2xl font-bold text-white">{money(totalShipping)}</div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">Revenue Trend</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">Last 6 months of sold revenue.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-300">
                {money(grossSales)} total
              </div>
            </div>

            <div className="mt-5 grid h-44 sm:h-56 lg:h-64 grid-cols-6 items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              {monthlyTrend.map((bucket, i) => {
                const height = cards.length === 0 ? "12%" : `${Math.max(12, (bucket.revenue / maxTrendRevenue) * 100)}%`;
                return (
                  <div key={bucket.key} className="flex h-full flex-col justify-end">
                    <div className="text-center text-[11px] text-slate-500">{bucket.revenue > 0 ? money(bucket.revenue) : "$0"}</div>
                    <div className="mt-2 flex flex-1 items-end">
                      <div
                        className={`w-full rounded-t-2xl ${cards.length === 0 ? "bg-white/10" : "bg-[linear-gradient(180deg,rgba(251,191,36,0.95),rgba(217,119,6,0.58))] shadow-[0_10px_30px_rgba(245,158,11,0.22)]"}`}
                        style={{
                          height,
                          transform: graphsRaised ? "scaleY(1)" : "scaleY(0)",
                          transformOrigin: "bottom",
                          transition: "transform 700ms ease",
                          transitionDelay: `${i * 70}ms`,
                          willChange: "transform",
                        }}
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

            {!isCollectorPreview ? (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">Net Profit Trend</h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400">Last 6 months of net profit.</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-300">
                    {money(totalNetProfit)} total
                  </div>
                </div>

                {cards.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    No profit data yet. The chart will populate automatically once cards have cost/fee/shipping data.
                  </div>
                ) : (
                  <div className="mt-5 grid h-44 sm:h-56 lg:h-64 grid-cols-6 items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    {monthlyNetProfitTrend.map((bucket, i) => {
                      const abs = Math.abs(bucket.netProfit);
                      const height = cards.length === 0 ? "12%" : `${Math.max(12, (abs / maxTrendNetProfitAbs) * 100)}%`;
                      const isPositive = bucket.netProfit >= 0;

                      return (
                        <div key={bucket.key} className="flex h-full flex-col justify-end">
                          <div className="text-center text-[11px] text-slate-500">{money(bucket.netProfit)}</div>
                          <div className="mt-2 flex flex-1 items-end">
                            <div
                              className={`w-full rounded-t-2xl ${
                                isPositive
                                  ? "bg-[linear-gradient(180deg,rgba(16,185,129,0.95),rgba(6,95,70,0.45))] shadow-[0_10px_30px_rgba(16,185,129,0.22)]"
                                  : "bg-[linear-gradient(180deg,rgba(239,68,68,0.95),rgba(127,29,29,0.45))] shadow-[0_10px_30px_rgba(239,68,68,0.22)]"
                              }`}
                              style={{
                                height,
                                transform: graphsRaised ? "scaleY(1)" : "scaleY(0)",
                                transformOrigin: "bottom",
                                transition: "transform 700ms ease",
                                transitionDelay: `${i * 70}ms`,
                                willChange: "transform",
                              }}
                            />
                          </div>
                          <div className="mt-3 text-center text-xs font-semibold text-slate-300">{bucket.label}</div>
                          <div className="mt-1 text-center text-[11px] text-slate-500">{bucket.quantity} sold</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h2 className="text-base sm:text-lg font-semibold text-white">Platform Mix</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">Where your sold revenue is coming from.</p>

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

              {!isCollectorPreview ? (
                <div className="mt-6">
                  <h2 className="text-base font-semibold text-white">Net Profit by Platform</h2>
                  <p className="mt-1 text-xs text-slate-400">After card cost, fees, and shipping.</p>

                  <div className="mt-4 space-y-4">
                    {platformProfitBreakdown.length > 0 ? platformProfitBreakdown.map((item) => {
                      const isPositive = item.netProfit >= 0;
                      const width = Math.max(8, (Math.abs(item.netProfit) / platformProfitMaxAbs) * 100);
                      return (
                        <div key={item.platform}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <div className="font-semibold text-slate-200">{item.platform}</div>
                            <div className={isPositive ? "text-emerald-300" : "text-red-300"}>{money(item.netProfit)}</div>
                          </div>
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900">
                            <div
                              className={
                                "h-full rounded-full " +
                                (isPositive
                                  ? "bg-[linear-gradient(90deg,rgba(16,185,129,0.95),rgba(6,95,70,0.9))]"
                                  : "bg-[linear-gradient(90deg,rgba(239,68,68,0.95),rgba(127,29,29,0.9))]")
                              }
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{item.quantity} card{item.quantity === 1 ? "" : "s"} sold</div>
                        </div>
                      );
                    }) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                        Profit-per-platform will show up here once you have cost/fee/shipping data.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <h2 className="text-base sm:text-lg font-semibold text-white">Recent Wins</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">Latest completed sales.</p>

              <div className="mt-4 space-y-3">
                    {recentHighlights.length > 0 ? recentHighlights.map((card, index) => (
                      <div key={`${card.id || index}-${card.card_number}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white">{card.player_name}</div>
                            <div className="mt-1 text-sm text-slate-300">{card.year} · {card.brand} · #{card.card_number}</div>
                            <div className="text-sm text-slate-400">{card.set_name}{card.parallel ? ` · ${card.parallel}` : ""}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              Net {money(card.metrics.netProfit)}{card.metrics.roi != null ? ` · ROI ${card.metrics.roi.toFixed(1)}%` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-emerald-300">{money(card.metrics.grossSale)}</div>
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
        </>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Sales History</h2>
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
                {salesWithMetrics.map((card, i) => (
                  <div key={`${card.player_name}-${card.card_number}-${card.id || i}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="font-semibold text-white">{card.player_name}</div>
                    <div className="mt-1 text-sm text-slate-300">{card.year} · {card.brand} · #{card.card_number}</div>
                    <div className="text-sm text-slate-400">{card.set_name}{card.parallel ? ` · ${card.parallel}` : ""}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Sold for</div>
                        <div className="font-semibold text-emerald-300">{money(card.metrics.grossSale)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Date</div>
                        <div className="font-semibold text-white">{shortDate(card.sold_at)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Platform</div>
                        <div className="font-semibold text-white">{normalizePlatformLabel(card.sale_platform)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-3 py-2">
                        <div className="text-slate-400">Grade</div>
                        <div className="font-semibold text-white">{card.graded === "yes" && card.grade != null ? card.grade : "-"}</div>
                      </div>
                      {!isCollectorPreview ? (
                        <div className="rounded-2xl bg-slate-950/70 px-3 py-2 col-span-2">
                          <div className="text-slate-400">Net profit / ROI</div>
                          <div className="font-semibold text-white">{money(card.metrics.netProfit)}{card.metrics.roi != null ? ` · ${card.metrics.roi.toFixed(1)}%` : ""}</div>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => openSaleEdit(card)}
                      className="mt-3 inline-flex rounded-lg bg-[#b80000] px-3 py-2 text-sm font-semibold hover:bg-[#d50000]"
                    >
                      Edit sale details
                    </button>
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
                    {salesWithMetrics.map((card, i) => (
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
                        <td className="px-4 py-3 font-semibold text-emerald-300">{money(card.metrics.grossSale)}</td>
                        <td className="px-4 py-3 text-slate-200">{shortDate(card.sold_at)}</td>
                        <td className="px-4 py-3 text-slate-200">{normalizePlatformLabel(card.sale_platform)}</td>
                        <td className="px-4 py-3 text-slate-200">
                          <div>{card.graded === "yes" && card.grade != null ? card.grade : "-"}</div>
                          {!isCollectorPreview ? <div className="mt-1 text-xs text-slate-500">Net {money(card.metrics.netProfit)}</div> : null}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openSaleEdit(card)}
                            className="rounded-lg bg-[#b80000] px-3 py-2 text-xs font-semibold hover:bg-[#d50000]"
                          >
                            Edit
                          </button>
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

      {saleEditOpen && saleEditCard ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
          onClick={() => {
            setSaleEditOpen(false);
            setSaleEditCard(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Edit sale details"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Edit Sold</div>
                <div className="mt-2 text-lg font-bold text-white">{saleEditCard.player_name}</div>
                <div className="mt-1 text-sm text-slate-300">
                  {saleEditCard.year} · {saleEditCard.brand} · {saleEditCard.set_name}
                  {saleEditCard.parallel ? ` · ${saleEditCard.parallel}` : ""}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSaleEditOpen(false);
                  setSaleEditCard(null);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {saleEditError ? (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2 text-sm text-red-100">
                  {saleEditError}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm text-slate-300">Sold for</div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                    value={saleDraftSoldPrice}
                    onChange={(e) => setSaleDraftSoldPrice(e.target.value)}
                    placeholder="e.g. 28.00"
                    inputMode="decimal"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-sm text-slate-300">Sold date</div>
                  <input
                    type="date"
                    className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                    value={saleDraftSoldAt}
                    onChange={(e) => setSaleDraftSoldAt(e.target.value)}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <div className="mb-1 text-sm text-slate-300">Platform</div>
                  <input
                    className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                    value={saleDraftSalePlatform}
                    onChange={(e) => setSaleDraftSalePlatform(e.target.value)}
                    placeholder="eBay, local, show..."
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-sm text-slate-300">Quantity</div>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                    value={saleDraftQuantity}
                    onChange={(e) => setSaleDraftQuantity(Math.max(1, Number(e.target.value || 1)))}
                  />
                </label>

                {!isCollectorPreview ? (
                  <>
                    <label className="block">
                      <div className="mb-1 text-sm text-slate-300">Card cost</div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                        value={saleDraftCostBasis}
                        onChange={(e) => setSaleDraftCostBasis(e.target.value)}
                        placeholder="Total cost"
                        inputMode="decimal"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-sm text-slate-300">Platform fees</div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                        value={saleDraftPlatformFee}
                        onChange={(e) => setSaleDraftPlatformFee(e.target.value)}
                        placeholder="Fees paid"
                        inputMode="decimal"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <div className="mb-1 text-sm text-slate-300">Shipping cost</div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10"
                        value={saleDraftShippingCost}
                        onChange={(e) => setSaleDraftShippingCost(e.target.value)}
                        placeholder="Shipping paid"
                        inputMode="decimal"
                      />
                    </label>

                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-400 sm:col-span-2">
                      Profit math uses your sold price and quantity (gross sale) and these fields (card cost, shipping, platform fees).
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-400 sm:col-span-2">
                    Collector preview edits only sold fields (price, date, platform, quantity). Fees and cost math are Pro-only.
                  </div>
                )}

                {saleEditCard && !isCollectorPreview ? (
                  <div className="rounded-xl border border-white/10 bg-emerald-500/[0.06] p-3 sm:col-span-2">
                    <div className="text-xs text-emerald-200">Preview</div>
                    <div className="mt-1 flex flex-wrap gap-3">
                      <div>
                        <div className="text-[11px] text-slate-300">Net Profit</div>
                        <div className="text-sm font-semibold text-white">{money(saleEditPreviewMetrics.netProfit)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-300">ROI</div>
                        <div className="text-sm font-semibold text-white">{saleEditPreviewMetrics.roi != null ? `${saleEditPreviewMetrics.roi.toFixed(1)}%` : "—"}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSaleEditOpen(false);
                    setSaleEditCard(null);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                  disabled={saleEditSaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void onSaveSaleEdit();
                  }}
                  disabled={saleEditSaving}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {saleEditSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CardCatMobileNav />
    </main>
  );
}
