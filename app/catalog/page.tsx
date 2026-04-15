// app/catalog/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { normalizeCatalogTaxonomy } from "@/lib/cardTaxonomy";
import CardCatMobileNav from "@/components/CardCatMobileNav";

type YesNo = "yes" | "no";
type CardStatus = "Collection" | "Listed" | "Sold";

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

  graded?: YesNo;
  grade?: number | null;

  serial_number_text: string;
  quantity: number;

  estimated_price?: number | null;

  image_url?: string;
  back_image_url?: string;

  status?: CardStatus | string;
  asking_price?: number | null;
  listed_at?: string;
  sold_price?: number | null;
  sold_at?: string;
  sale_platform?: string;
  notes?: string;
  date_added?: string;
};

function storageKey() {
  return "cards_v1";
}

function normalizeStatusValue(status?: string | null): CardStatus {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw || raw === "incoming" || raw === "collection") return "Collection";
  if (raw === "listed") return "Listed";
  if (raw === "sold") return "Sold";
  return "Collection";
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

function statusBadgeClass(status: CardStatus) {
  if (status === "Sold") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "Listed") return "border-blue-500/30 bg-blue-500/10 text-blue-200";
  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
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

function buildEbaySearchUrl(card: Card) {
  const parts: string[] = [
    card.player_name,
    card.brand,
    card.set_name,
    card.card_number,
    card.serial_number_text,
  ]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);

  const query = parts.join(" ");
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
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
  const { user, loading: authLoading } = useSupabaseUser();
  const [cards, setCards] = useState<Card[]>([]);
  const [q, setQ] = useState("");
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [imageModal, setImageModal] = useState<{ src: string; alt: string; backSrc?: string; backAlt?: string } | null>(null);
  const [statusToast, setStatusToast] = useState<{ message: string; href?: string; hrefLabel?: string } | null>(null);
  const [statusModal, setStatusModal] = useState<{
    card: Card;
    nextStatus: "Listed" | "Sold";
    price: string;
    date: string;
    platform: string;
  } | null>(null);
  const [showValuable, setShowValuable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cardsView, setCardsView] = useState<"grid" | "inventory">("inventory");
  const [filterSport, setFilterSport] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGraded, setFilterGraded] = useState<"all" | "yes" | "no">("all");
  const [sortBy, setSortBy] = useState<"newest" | "player" | "year_desc" | "value_desc">("newest");

  const fetchCards = async () => {
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to fetch cards:", error);
      return;
    }

    setCards(
      ((data ?? []) as any[]).map((card) =>
        normalizeCatalogTaxonomy({ ...card, status: normalizeStatusValue(card?.status) })
      ) as any
    );
  };

  useEffect(() => {
    fetchCards();
  }, [user?.id]);

  const sync = () => fetchCards();

  const activeCards = useMemo(() => cards.filter((c) => normalizeStatusValue(c.status) !== "Sold"), [cards]);

  const sportOptions = useMemo(
    () => Array.from(new Set(activeCards.map((c) => String(c.sport || "").trim()).filter(Boolean))).sort(),
    [activeCards]
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(activeCards.map((c) => String(c.year || "").trim()).filter(Boolean))).sort((a, b) => Number(b) - Number(a) || b.localeCompare(a)),
    [activeCards]
  );
  const brandOptions = useMemo(
    () => Array.from(new Set(activeCards.map((c) => String(c.brand || "").trim()).filter(Boolean))).sort(),
    [activeCards]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(activeCards.map((c) => normalizeStatusValue(c.status)))).sort(),
    [activeCards]
  );

  const filtered = useMemo(() => {
    const raw = q.trim().toLowerCase();

    const wantsRookie = /\b(rc|rookie)\b/.test(raw);
    const wantsAuto = /\b(auto|autograph|autographs)\b/.test(raw);
    const wantsMem = /\b(mem|memorabilia)\b/.test(raw);

    // Remove special keywords so normal text search still works.
    const s = raw
      .replace(/\b(rc|rookie|auto|autograph|autographs|mem|memorabilia)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return activeCards.filter((c) => {
      const matchesQ =
        !s ||
        `${c.player_name} ${c.team} ${c.year} ${c.brand} ${c.set_name} ${c.parallel} ${c.card_number} ${c.serial_number_text}`
          .toLowerCase()
          .includes(s);

      const matchesRookie = !wantsRookie || c.rookie === "yes";
      const matchesAuto = !wantsAuto || c.is_autograph === "yes";
      const matchesMem = !wantsMem || c.has_memorabilia === "yes";
      const matchesSport = filterSport === "all" || String(c.sport || "") === filterSport;
      const matchesYear = filterYear === "all" || String(c.year || "") === filterYear;
      const matchesBrand = filterBrand === "all" || String(c.brand || "") === filterBrand;
      const matchesStatus = filterStatus === "all" || normalizeStatusValue(c.status) === filterStatus;
      const matchesGraded = filterGraded === "all" || (c.graded || "no") === filterGraded;

      return matchesQ && matchesRookie && matchesAuto && matchesMem && matchesSport && matchesYear && matchesBrand && matchesStatus && matchesGraded;
    });
  }, [activeCards, q, filterSport, filterYear, filterBrand, filterStatus, filterGraded]);

  const sortedCards = useMemo(() => {
    const next = [...filtered];

    next.sort((a, b) => {
      if (sortBy === "player") return a.player_name.localeCompare(b.player_name);
      if (sortBy === "year_desc") return Number(b.year || 0) - Number(a.year || 0);
      if (sortBy === "value_desc") {
        const aValue = Number(a.estimated_price || 0) * Number(a.quantity || 0);
        const bValue = Number(b.estimated_price || 0) * Number(b.quantity || 0);
        return bValue - aValue;
      }

      return String(b.date_added || "").localeCompare(String(a.date_added || ""));
    });

    return next;
  }, [filtered, sortBy]);

  const valuable = useMemo(() => {
    return [...activeCards].sort((a, b) => score(b) - score(a)).slice(0, 5);
  }, [activeCards]);

  const estimatedTotal = useMemo(() => {
    return activeCards.reduce((sum, c) => {
      const qty = Number(c.quantity || 0);
      const price = Number(c.estimated_price || 0);
      return sum + qty * price;
    }, 0);
  }, [activeCards]);

  useEffect(() => {
    if (valuable.length === 0) {
      setPreviewCard(null);
      return;
    }

    setPreviewCard((prev) => {
      if (prev?.id && valuable.some((v) => v.id === prev.id)) return prev;
      return valuable[0];
    });
  }, [valuable]);

  useEffect(() => {
    if (!statusToast) return;
    const timer = window.setTimeout(() => setStatusToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [statusToast]);

  const onDelete = async (id?: string) => {
    if (!id) return;
    const ok = confirm("Are you sure you want to delete this card?");
    if (!ok) return;

    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }

    sync();

    setPreviewCard((prev) => (prev?.id === id ? null : prev));
  };

  const updateCardStatus = async (card: Card, nextStatus: CardStatus, details?: { price?: string; date?: string; platform?: string }) => {
    if (!card.id) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const today = new Date().toISOString().slice(0, 10);
    const payload: Record<string, any> = { status: nextStatus };

    if (nextStatus === "Listed") {
      payload.asking_price = details?.price ? Number(details.price) : card.asking_price ?? null;
      payload.listed_at = details?.date || card.listed_at || today;
      payload.sale_platform = details?.platform?.trim() || card.sale_platform || null;
    }

    if (nextStatus === "Sold") {
      payload.sold_price = details?.price ? Number(details.price) : card.sold_price ?? null;
      payload.sold_at = details?.date || card.sold_at || today;
      payload.sale_platform = details?.platform?.trim() || card.sale_platform || null;
    }

    if (nextStatus === "Collection") {
      payload.sold_at = null;
      payload.sold_price = null;
    }

    const { error } = await supabase
      .from("cards")
      .update(payload)
      .eq("id", card.id)
      .eq("user_id", user.id);

    if (error) {
      alert(`Status update failed: ${error.message}`);
      return;
    }

    setStatusToast(
      nextStatus === "Sold"
        ? { message: `${card.player_name} moved to Sold.`, href: "/sold", hrefLabel: "View sold cards" }
        : nextStatus === "Listed"
          ? { message: `${card.player_name} moved to Listed.` }
          : { message: `${card.player_name} moved back to Collection.` }
    );

    sync();
  };

  const openStatusModal = (card: Card, nextStatus: "Listed" | "Sold") => {
    const today = new Date().toISOString().slice(0, 10);
    setStatusModal({
      card,
      nextStatus,
      price: String(nextStatus === "Listed" ? card.asking_price ?? "" : card.sold_price ?? ""),
      date: String(nextStatus === "Listed" ? card.listed_at || today : card.sold_at || today),
      platform: String(card.sale_platform || ""),
    });
  };

  const saveStatusModal = async () => {
    if (!statusModal) return;
    if (!statusModal.price.trim()) {
      alert(`Enter the amount ${statusModal.nextStatus === "Listed" ? "listed for" : "sold for"}.`);
      return;
    }

    await updateCardStatus(statusModal.card, statusModal.nextStatus, {
      price: statusModal.price,
      date: statusModal.date,
      platform: statusModal.platform,
    });
    setStatusModal(null);
  };

  const qLower = q.trim().toLowerCase();
  const rcOn = /\b(rc|rookie)\b/.test(qLower);
  const autoOn = /\b(auto|autograph|autographs)\b/.test(qLower);
  const memOn = /\b(mem|memorabilia)\b/.test(qLower);

  const toggleToken = (token: "rc" | "auto" | "mem") => {
    const raw = q.trim();
    const synonymsByToken: Record<"rc" | "auto" | "mem", string[]> = {
      rc: ["rc", "rookie"],
      auto: ["auto", "autograph", "autographs"],
      mem: ["mem", "memorabilia"],
    };

    const synonyms = synonymsByToken[token];
    const onRe = new RegExp(`\\b(${synonyms.join("|")})\\b`, "i");
    const removeRe = new RegExp(`\\b(${synonyms.join("|")})\\b`, "gi");

    if (!raw) {
      setQ(token);
      return;
    }

    if (onRe.test(raw)) {
      setQ(raw.replace(removeRe, " ").replace(/\s+/g, " ").trim());
      return;
    }

    setQ(`${raw} ${token}`);
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16 text-slate-300">Loading your collection...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign in required</h1>
          <p className="mt-3 text-slate-300">Please sign in to view and save your card collection.</p>
          <a
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
          >
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              CardCat.io
            </div>
            <h1 className="mt-3 text-2xl font-bold">CardCat Catalog</h1>
            <div className="mt-1 text-sm text-slate-400">Signed in as {user.email}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/add-card"
              className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
            >
              Add Card
            </a>
            <a
              href="/import"
              className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            >
              Import CSV
            </a>
            <a
              href="/sold"
              className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            >
              Sold
            </a>
            <a
              href="/account"
              className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            >
              My Account
            </a>
            <button
              className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
              onClick={async () => {
                if (!supabaseConfigured || !supabase) return;
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {statusToast && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
            <span>{statusToast.message}</span>
            {statusToast.href && statusToast.hrefLabel ? (
              <a href={statusToast.href} className="font-semibold text-emerald-100 underline">
                {statusToast.hrefLabel}
              </a>
            ) : null}
            <button
              type="button"
              className="ml-auto rounded bg-emerald-900/50 px-2 py-1 text-xs font-semibold hover:bg-emerald-900"
              onClick={() => setStatusToast(null)}
            >
              Close
            </button>
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="rounded-xl bg-slate-900 px-3 py-2"
              placeholder="Search player, team, set, serial... (try: rc, auto, mem)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              className="rounded-xl bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
              onClick={sync}
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="uppercase tracking-[0.18em]">View</span>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-semibold hover:bg-slate-800 ${cardsView === "inventory" ? "bg-slate-800 text-white" : "bg-slate-900"}`}
                onClick={() => setCardsView("inventory")}
              >
                Inventory
              </button>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-semibold hover:bg-slate-800 ${cardsView === "grid" ? "bg-slate-800 text-white" : "bg-slate-900"}`}
                onClick={() => setCardsView("grid")}
              >
                Grid
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700 sm:hidden"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? "Hide filters" : "Show filters"}
              </button>
              <div className="text-sm text-slate-400">Showing {sortedCards.length} of {activeCards.length} active card rows</div>
            </div>
          </div>

          <div className={`${showFilters ? "mt-3" : "mt-3 hidden"} sm:block`}>
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded px-3 py-1 text-xs font-semibold ${
              rcOn ? "bg-[#b80000] hover:bg-[#d50000]" : "bg-slate-800 hover:bg-slate-700"
            }`}
            onClick={() => toggleToken("rc")}
          >
            RC
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1 text-xs font-semibold ${
              autoOn ? "bg-[#b80000] hover:bg-[#d50000]" : "bg-slate-800 hover:bg-slate-700"
            }`}
            onClick={() => toggleToken("auto")}
          >
            Auto
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1 text-xs font-semibold ${
              memOn ? "bg-[#b80000] hover:bg-[#d50000]" : "bg-slate-800 hover:bg-slate-700"
            }`}
            onClick={() => toggleToken("mem")}
          >
            Mem
          </button>
          <button
            type="button"
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => {
              setQ("");
              setFilterSport("all");
              setFilterYear("all");
              setFilterBrand("all");
              setFilterStatus("all");
              setFilterGraded("all");
              setSortBy("newest");
            }}
          >
            Clear
          </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select className="rounded bg-slate-900 px-3 py-2 text-sm" value={filterSport} onChange={(e) => setFilterSport(e.target.value)}>
            <option value="all">All sports</option>
            {sportOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select className="rounded bg-slate-900 px-3 py-2 text-sm" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="all">All years</option>
            {yearOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select className="rounded bg-slate-900 px-3 py-2 text-sm" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
            <option value="all">All brands</option>
            {brandOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select className="rounded bg-slate-900 px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select className="rounded bg-slate-900 px-3 py-2 text-sm" value={filterGraded} onChange={(e) => setFilterGraded(e.target.value as "all" | "yes" | "no")}>
            <option value="all">All grading</option>
            <option value="yes">Graded only</option>
            <option value="no">Ungraded only</option>
          </select>
          <select className="rounded bg-slate-900 px-3 py-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "player" | "year_desc" | "value_desc")}>
            <option value="newest">Sort: newest</option>
            <option value="player">Sort: player A-Z</option>
            <option value="year_desc">Sort: year desc</option>
            <option value="value_desc">Sort: value high-low</option>
          </select>
          </div>
          </div>
        </section>

        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Active Inventory</div>
            <div className="mt-1 text-2xl font-bold">{activeCards.length}</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
            <div className="text-sm text-slate-400">Estimated value</div>
            <div className="mt-1 text-2xl font-bold">${estimatedTotal.toFixed(2)}</div>
          </div>
        </div>
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Valuable Candidates</h2>
              <p className="mt-1 text-sm text-slate-400">Optional shortlist of interesting cards.</p>
            </div>
            <button
              type="button"
              className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
              onClick={() => setShowValuable((prev) => !prev)}
            >
              {showValuable ? "Hide" : `Show ${valuable.length}`}
            </button>
          </div>

          {showValuable && (valuable.length === 0 ? (
            <div className="mt-4 rounded border border-slate-800 bg-slate-900 p-4 text-slate-400">
              No cards yet. Click "Add Card".
            </div>
          ) : (
            <>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {valuable.map((c, i) => (
                  <button
                    key={`${c.player_name}-${c.card_number}-${i}`}
                    type="button"
                    className="min-w-[240px] rounded border border-slate-800 bg-slate-900 p-3 text-left hover:border-slate-700"
                    onClick={() => setPreviewCard(c)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{c.player_name}</div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {c.year} · {c.brand} · {c.set_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-300">
                          {c.parallel} · #{c.card_number}
                        </div>
                      </div>
                      <div className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100">View</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded border border-slate-800 bg-slate-900 p-4">
                {previewCard ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="w-full sm:w-80">
                        {previewCard.image_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setImageModal({
                                src: driveToImageSrc(previewCard.image_url),
                                alt: "front",
                                backSrc: previewCard.back_image_url
                                  ? driveToImageSrc(previewCard.back_image_url)
                                  : undefined,
                                backAlt: "back",
                              })
                            }
                          >
                            <img
                              alt="front"
                              src={driveToImageSrc(previewCard.image_url)}
                              className="h-80 w-full rounded border border-slate-800 bg-slate-900 object-contain"
                            />
                          </button>
                        ) : previewCard.back_image_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setImageModal({
                                src: driveToImageSrc(previewCard.back_image_url),
                                alt: "back",
                              })
                            }
                          >
                            <img
                              alt="back"
                              src={driveToImageSrc(previewCard.back_image_url)}
                              className="h-80 w-full rounded border border-slate-800 bg-slate-900 object-contain"
                            />
                          </button>
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-lg font-semibold">{previewCard.player_name}</div>
                            <div className="mt-1 text-sm text-slate-300">
                              {previewCard.year} · {previewCard.brand} · {previewCard.set_name}
                            </div>
                            <div className="mt-1 text-sm text-slate-300">
                              {previewCard.parallel} · #{previewCard.card_number} · {previewCard.serial_number_text || "(no serial)"}
                            </div>
                            <div className="mt-1 text-sm text-slate-300">
                              {previewCard.team} · {previewCard.sport}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatusValue(previewCard.status))}`}>
                                {normalizeStatusValue(previewCard.status)}
                              </span>
                              {normalizeStatusValue(previewCard.status) === "Listed" && previewCard.asking_price != null ? `Asking $${Number(previewCard.asking_price).toFixed(2)}` : ""}
                            </div>
                            <div className="mt-1 text-sm text-slate-300">
                              Est. value: ${Number(previewCard.estimated_price || 0).toFixed(2)}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {previewCard.is_autograph === "yes" && (
                                <span className="rounded bg-[#d50000] px-2 py-1">Auto</span>
                              )}
                              {previewCard.has_memorabilia === "yes" && (
                                <span className="rounded bg-[#d50000] px-2 py-1">Mem</span>
                              )}
                              {previewCard.rookie === "yes" && (
                                <span className="rounded bg-amber-500 px-2 py-1 text-black">RC</span>
                              )}
                              {previewCard.graded === "yes" && previewCard.grade != null && (
                                <span className="rounded bg-blue-800 px-2 py-1 text-xs">Grade {previewCard.grade}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <a
                              href={previewCard.id ? `/add-card?edit=${encodeURIComponent(previewCard.id)}` : "/add-card"}
                              className="rounded bg-[#b80000] px-3 py-1 text-xs font-semibold hover:bg-[#d50000] text-center"
                            >
                              Edit
                            </a>
                            <a
                              href={buildEbaySearchUrl(previewCard)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700 text-center"
                            >
                              eBay
                            </a>
                            <button
                              className="rounded bg-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-600"
                              onClick={() => onDelete(previewCard.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">Tap "View" to preview a candidate.</div>
                )}
              </div>
            </>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">All Cards</h2>

          {sortedCards.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
              <div className="text-lg font-semibold">No matching cards</div>
              <div className="mt-2 text-sm text-slate-400">Try clearing a filter or add a new card to CardCat.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                  onClick={() => {
                    setQ("");
                    setFilterSport("all");
                    setFilterYear("all");
                    setFilterBrand("all");
                    setFilterStatus("all");
                    setFilterGraded("all");
                    setSortBy("newest");
                  }}
                >
                  Clear filters
                </button>
                <a href="/add-card" className="rounded-lg bg-[#d50000] px-3 py-2 text-sm font-semibold hover:bg-[#b80000]">
                  Add card
                </a>
              </div>
            </div>
          ) : cardsView === "inventory" ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {sortedCards.map((c, i) => (
                  <div key={`${c.player_name}-${c.year}-${c.card_number}-${c.id || i}`} className="rounded border border-slate-800 bg-slate-900 p-4">
                    <div className="flex gap-3">
                      {c.image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setImageModal({
                              src: driveToImageSrc(c.image_url as string),
                              alt: "front",
                              backSrc: c.back_image_url ? driveToImageSrc(c.back_image_url as string) : undefined,
                              backAlt: "back",
                            })
                          }
                        >
                          <img
                            alt="front"
                            src={driveToImageSrc(c.image_url as string)}
                            className="h-20 w-14 rounded border border-slate-800 object-contain bg-slate-950"
                          />
                        </button>
                      ) : (
                        <div className="h-20 w-14 rounded border border-slate-800 bg-slate-950" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{c.player_name}</div>
                        <div className="text-sm text-slate-300">{c.year} · {c.brand} · #{c.card_number || "n/a"}</div>
                        <div className="text-sm text-slate-400">{c.set_name}{c.parallel && c.parallel !== "n/a" ? ` · ${c.parallel}` : ""}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatusValue(c.status))}`}>
                            {normalizeStatusValue(c.status)}
                          </span>
                          {normalizeStatusValue(c.status) === "Listed" && c.asking_price != null ? (
                            <span className="text-sm text-slate-300">Asking ${Number(c.asking_price).toFixed(2)}</span>
                          ) : null}
                        </div>
                        <div className="text-sm text-slate-300">Qty {c.quantity} · Est. ${(Number(c.estimated_price || 0) * Number(c.quantity || 0)).toFixed(2)}</div>
                        {c.graded === "yes" && c.grade != null && <div className="text-xs text-amber-300">Graded {c.grade}</div>}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {normalizeStatusValue(c.status) !== "Listed" ? (
                        <button className="rounded bg-blue-900 px-2 py-2 text-xs font-semibold hover:bg-blue-800" onClick={() => openStatusModal(c, "Listed")}>
                          List
                        </button>
                      ) : (
                        <button className="rounded bg-slate-800 px-2 py-2 text-xs font-semibold hover:bg-slate-700" onClick={() => updateCardStatus(c, "Collection")}>
                          Collection
                        </button>
                      )}
                      <button className="rounded bg-emerald-900 px-2 py-2 text-xs font-semibold hover:bg-emerald-800" onClick={() => openStatusModal(c, "Sold")}>
                        Sold
                      </button>
                      <a href={c.id ? `/add-card?edit=${encodeURIComponent(c.id)}` : "/add-card"} className="inline-flex items-center justify-center rounded bg-[#b80000] px-2 py-2 text-xs font-semibold hover:bg-[#d50000]">
                        Edit
                      </a>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <a href={buildEbaySearchUrl(c)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded bg-slate-800 px-2 py-2 text-xs font-semibold hover:bg-slate-700">
                        eBay
                      </a>
                      <button className="rounded bg-red-700 px-2 py-2 text-xs font-semibold hover:bg-red-600" onClick={() => onDelete(c.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded border border-slate-800 bg-slate-900 md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-950 text-left text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Img</th>
                      <th className="px-3 py-2">Player</th>
                      <th className="px-3 py-2">Card</th>
                      <th className="px-3 py-2">Team</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Est.</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCards.map((c, i) => (
                      <tr key={`${c.player_name}-${c.year}-${c.card_number}-${c.id || i}`} className="border-t border-slate-800 align-top">
                        <td className="px-3 py-2">
                          {c.image_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setImageModal({
                                  src: driveToImageSrc(c.image_url as string),
                                  alt: "front",
                                  backSrc: c.back_image_url ? driveToImageSrc(c.back_image_url as string) : undefined,
                                  backAlt: "back",
                                })
                              }
                            >
                              <img alt="front" src={driveToImageSrc(c.image_url as string)} className="h-14 w-10 rounded border border-slate-800 object-contain bg-slate-950" />
                            </button>
                          ) : (
                            <div className="h-14 w-10 rounded border border-slate-800 bg-slate-950" />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold">{c.player_name}</div>
                          <div className="text-xs text-slate-400">{c.year} · {c.sport}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div>{c.brand} · {c.set_name}</div>
                          <div className="text-xs text-slate-400">{c.parallel} · #{c.card_number}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div>{c.team}</div>
                          <div className="text-xs text-slate-400">{c.serial_number_text || "(no serial)"}</div>
                        </td>
                        <td className="px-3 py-2">{c.quantity}</td>
                        <td className="px-3 py-2">${(Number(c.estimated_price || 0) * Number(c.quantity || 0)).toFixed(2)}</td>
                        <td className="px-3 py-2">{c.graded === "yes" && c.grade != null ? c.grade : "-"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatusValue(c.status))}`}>
                            {normalizeStatusValue(c.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={buildEbaySearchUrl(c)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            >
                              eBay
                            </a>
                            <a
                              href={c.id ? `/add-card?edit=${encodeURIComponent(c.id)}` : "/add-card"}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            >
                              Edit
                            </a>
                            <details className="relative">
                              <summary className="list-none cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                                Move
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-white/10 bg-slate-950 p-1 shadow-2xl">
                                {normalizeStatusValue(c.status) !== "Listed" ? (
                                  <button
                                    className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                    onClick={() => openStatusModal(c, "Listed")}
                                  >
                                    Move to Listed
                                  </button>
                                ) : (
                                  <button
                                    className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                    onClick={() => updateCardStatus(c, "Collection")}
                                  >
                                    Move to Collection
                                  </button>
                                )}
                                <button
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                  onClick={() => openStatusModal(c, "Sold")}
                                >
                                  Move to Sold
                                </button>
                                <button
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"
                                  onClick={() => onDelete(c.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </details>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCards.map((c, i) => (
                <div
                  key={`${c.player_name}-${c.year}-${c.card_number}-${c.id || i}`}
                  className="rounded border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-full aspect-square overflow-hidden rounded bg-slate-950 flex items-center justify-center">
                      {c.image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setImageModal({
                              src: driveToImageSrc(c.image_url as string),
                              alt: "front",
                              backSrc: c.back_image_url ? driveToImageSrc(c.back_image_url as string) : undefined,
                              backAlt: "back",
                            })
                          }
                          className="block h-full w-full"
                        >
                          <img
                            alt="front"
                            src={driveToImageSrc(c.image_url as string)}
                            className="h-full w-full rounded border border-slate-800 object-contain bg-slate-900 cursor-zoom-in"
                          />
                        </button>
                      ) : c.back_image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setImageModal({
                              src: driveToImageSrc(c.back_image_url as string),
                              alt: "back",
                            })
                          }
                          className="block h-full w-full"
                        >
                          <img
                            alt="back"
                            src={driveToImageSrc(c.back_image_url as string)}
                            className="h-full w-full rounded border border-slate-800 object-contain bg-slate-900 cursor-zoom-in"
                          />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col gap-3 text-center">
                        <div className="space-y-1">
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
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatusValue(c.status))}`}>
                              {normalizeStatusValue(c.status)}
                            </span>
                            {normalizeStatusValue(c.status) === "Listed" && c.asking_price != null ? `Asking $${Number(c.asking_price).toFixed(2)}` : ""}
                          </div>
                          <div className="text-sm text-slate-300">
                            Qty: {c.quantity} · Est. value: ${Number(c.estimated_price || 0).toFixed(2)}
                          </div>
                          {c.graded === "yes" && c.grade != null && (
                            <div className="text-xs text-slate-400">Graded: {c.grade}</div>
                          )}
                        </div>

                        <div className="flex w-full gap-2">
                          <a href={c.id ? `/add-card?edit=${encodeURIComponent(c.id)}` : "/add-card"} className="inline-flex flex-1 items-center justify-center leading-none rounded bg-[#b80000] px-2 py-1.5 text-xs font-semibold hover:bg-[#d50000]">
                            Edit
                          </a>
                          <a href={buildEbaySearchUrl(c)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center leading-none rounded bg-slate-800 px-2 py-1.5 text-xs font-semibold hover:bg-slate-700">
                            eBay
                          </a>
                          <button className="rounded bg-red-700 flex-1 px-3 py-1 text-xs font-semibold hover:bg-red-600" onClick={() => onDelete(c.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    <CardCatMobileNav />
    {statusModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setStatusModal(null)}
      >
        <div
          className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-lg font-bold">Move to {statusModal.nextStatus}</div>
          <div className="mt-1 text-sm text-slate-300">{statusModal.card.player_name} · {statusModal.card.year} · {statusModal.card.brand}</div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">
                {statusModal.nextStatus === "Listed" ? "Listed for" : "Sold for"}
              </div>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded bg-slate-950 px-3 py-2"
                value={statusModal.price}
                onChange={(e) => setStatusModal((prev) => (prev ? { ...prev, price: e.target.value } : prev))}
                placeholder={statusModal.nextStatus === "Listed" ? "e.g. 35.00" : "e.g. 28.00"}
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-300">
                {statusModal.nextStatus === "Listed" ? "Date listed" : "Date sold"}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded bg-slate-950 px-3 py-2"
                  value={statusModal.date}
                  onChange={(e) => setStatusModal((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                  placeholder="YYYY-MM-DD"
                />
                <button
                  type="button"
                  className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                  onClick={() => setStatusModal((prev) => (prev ? { ...prev, date: new Date().toISOString().slice(0, 10) } : prev))}
                >
                  Today
                </button>
              </div>
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-300">App / site</div>
              <input
                className="w-full rounded bg-slate-950 px-3 py-2"
                value={statusModal.platform}
                onChange={(e) => setStatusModal((prev) => (prev ? { ...prev, platform: e.target.value } : prev))}
                placeholder="eBay, Whatnot, local..."
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
              onClick={() => setStatusModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-[#d50000] px-4 py-2 text-sm font-semibold hover:bg-[#b80000]"
              onClick={saveStatusModal}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
    {imageModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setImageModal(null)}
      >
        <div
          className="relative w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="absolute right-2 top-2 rounded bg-slate-800 px-2 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => setImageModal(null)}
          >
            Close
          </button>
          <div className="max-h-[75vh] overflow-y-auto space-y-3">
            <img
              src={imageModal.src}
              alt={imageModal.alt}
              className="max-h-[70vh] w-full rounded border border-slate-800 bg-slate-950 object-contain"
            />
            {imageModal.backSrc ? (
              <img
                src={imageModal.backSrc}
                alt={imageModal.backAlt || "back"}
                className="max-h-[70vh] w-full rounded border border-slate-800 bg-slate-950 object-contain"
              />
            ) : null}
          </div>
        </div>
      </div>
    )}
    </main>
  );
}
