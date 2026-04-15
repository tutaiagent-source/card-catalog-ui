// app/catalog/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { normalizeCatalogTaxonomy } from "@/lib/cardTaxonomy";
import { buildSellerNotes, parseSellerMeta } from "@/lib/cardSellerMeta";
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

  // PC (personal collection) shelf ordering
  pc_position?: number | null;
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

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function driveToImageSrc(url?: string) {
  const u = (url || "").trim();
  const m = u.match(/\/d\/([^/]+)\/view/);
  if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return u;
}

function buildEbaySearchUrl(card: Card) {
  const serialRaw = String(card.serial_number_text ?? "").trim();
  const slashIdx = serialRaw.indexOf("/");
  // eBay serial patterns like "3/20" should become "/20" (drop the prefix).
  const serialForEbay = slashIdx >= 0 ? serialRaw.slice(slashIdx) : serialRaw;

  const parts: string[] = [
    card.player_name,
    card.brand,
    card.set_name,
    card.card_number,
    serialForEbay,
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
    costBasis: string;
    shippingCost: string;
    platformFee: string;
  } | null>(null);
  const [bulkEditModal, setBulkEditModal] = useState<{
    platform: string;
    askingPrice: string;
  } | null>(null);
  const [showValuable, setShowValuable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cardsView, setCardsView] = useState<"grid" | "inventory">("inventory");
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
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

  useEffect(() => {
    const closeMenus = (target: EventTarget | null) => {
      document.querySelectorAll<HTMLDetailsElement>('details[data-inventory-menu="true"]').forEach((menu) => {
        if (target instanceof Node && menu.contains(target)) return;
        menu.open = false;
      });
    };

    const onDocumentClick = (event: MouseEvent) => closeMenus(event.target);
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus(null);
    };

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const sync = () => fetchCards();

  const exportCards = () => {
    if (cards.length === 0) {
      alert("No cards to export yet.");
      return;
    }

    downloadCsv(
      `cardcat-export-${new Date().toISOString().slice(0, 10)}.csv`,
      cards.map((card) => ({
        player_name: card.player_name,
        year: card.year,
        brand: card.brand,
        set_name: card.set_name,
        parallel: card.parallel,
        card_number: card.card_number,
        team: card.team,
        sport: card.sport,
        rookie: card.rookie,
        is_autograph: card.is_autograph,
        has_memorabilia: card.has_memorabilia,
        graded: card.graded || "no",
        grade: card.grade ?? "",
        serial_number_text: card.serial_number_text,
        quantity: card.quantity,
        estimated_price: card.estimated_price ?? "",
        status: normalizeStatusValue(card.status),
        asking_price: card.asking_price ?? "",
        listed_at: card.listed_at || "",
        sold_price: card.sold_price ?? "",
        sold_at: card.sold_at || "",
        sale_platform: card.sale_platform || "",
        notes: card.notes || "",
        image_url: card.image_url || "",
        back_image_url: card.back_image_url || "",
        date_added: card.date_added || "",
      }))
    );
  };

  const toggleCardSelection = (id?: string) => {
    if (!id) return;
    setSelectedCardIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

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

  const familyRows = useMemo(() => {
    const familyKey = (c: Card) => {
      // Group cards by everything except `parallel`.
      const gradePart = c.graded === "yes" ? `|g:${c.grade ?? ""}` : "|g:no";
      return [
        c.player_name,
        c.year,
        c.sport,
        c.brand,
        c.set_name,
        c.team,
        c.card_number,
        c.serial_number_text,
        `|r:${c.rookie}`,
        `|a:${c.is_autograph}`,
        `|m:${c.has_memorabilia}`,
        gradePart,
      ]
        .map((p) => String(p ?? "").trim())
        .join("~");
    };

    const byKey = new Map<string, Card[]>();
    for (const c of sortedCards) {
      const k = familyKey(c);
      const arr = byKey.get(k) ?? [];
      arr.push(c);
      byKey.set(k, arr);
    }

    const seen = new Set<string>();
    const rows: {
      key: string;
      family: Card[];
      representative: Card;
      parallelOptions: string[];
    }[] = [];

    for (const c of sortedCards) {
      const k = familyKey(c);
      if (seen.has(k)) continue;
      seen.add(k);
      const family = byKey.get(k) ?? [c];
      const parallelOptions = Array.from(new Set(family.map((f) => normalizeParallelLabel(f.parallel)))).sort(
        (a, b) => a.localeCompare(b)
      );
      rows.push({ key: k, family, representative: c, parallelOptions });
    }

    return rows;
  }, [sortedCards]);

  const [selectedParallelByFamily, setSelectedParallelByFamily] = useState<Record<string, string>>({});

  const visibleCardIds = useMemo(
    () =>
      familyRows
        .map((row) => {
          const selectedParallel = selectedParallelByFamily[row.key] ?? normalizeParallelLabel(row.representative.parallel);
          const card = row.family.find((f) => normalizeParallelLabel(f.parallel) === selectedParallel) ?? row.representative;
          return card.id;
        })
        .filter(Boolean) as string[],
    [familyRows, selectedParallelByFamily]
  );

  useEffect(() => {
    // Initialize selected parallel per family to the representative.
    setSelectedParallelByFamily((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const row of familyRows) {
        if (!next[row.key]) {
          next[row.key] = normalizeParallelLabel(row.representative.parallel);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [familyRows]);

  useEffect(() => {
    setSelectedCardIds((prev) => prev.filter((id) => activeCards.some((card) => card.id === id)));
  }, [activeCards]);

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

  const inventoryUnits = useMemo(
    () => activeCards.reduce((sum, c) => sum + Number(c.quantity || 0), 0),
    [activeCards]
  );

  const listedUnits = useMemo(
    () =>
      activeCards.reduce(
        (sum, c) => sum + (normalizeStatusValue(c.status) === "Listed" ? Number(c.quantity || 0) : 0),
        0
      ),
    [activeCards]
  );

  const rookieRows = useMemo(
    () => activeCards.filter((c) => c.rookie === "yes").length,
    [activeCards]
  );

  const autographRows = useMemo(
    () => activeCards.filter((c) => c.is_autograph === "yes").length,
    [activeCards]
  );

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

  const updateCardStatus = async (
    card: Card,
    nextStatus: CardStatus,
    details?: { price?: string; date?: string; platform?: string; costBasis?: string; shippingCost?: string; platformFee?: string }
  ) => {
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
      payload.notes = buildSellerNotes(card.notes, {
        costBasis: details?.costBasis ? Number(details.costBasis) : parseSellerMeta(card.notes).meta.costBasis,
        shippingCost: details?.shippingCost ? Number(details.shippingCost) : parseSellerMeta(card.notes).meta.shippingCost,
        platformFee: details?.platformFee ? Number(details.platformFee) : parseSellerMeta(card.notes).meta.platformFee,
      });
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

  const togglePc = async (card: Card, shouldStar: boolean) => {
    if (!card.id) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const payload: Record<string, any> = {
      pc_position: shouldStar ? Date.now() : null,
    };

    const { error } = await supabase
      .from("cards")
      .update(payload)
      .eq("id", card.id)
      .eq("user_id", user.id);

    if (error) {
      alert(`PC update failed: ${error.message}`);
      return;
    }

    setStatusToast(shouldStar ? { message: `${card.player_name} added to PC.` } : { message: `${card.player_name} removed from PC.` });
    sync();
  };

  const bulkUpdateStatus = async (nextStatus: "Collection" | "Listed") => {
    if (selectedCardIds.length === 0) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const today = new Date().toISOString().slice(0, 10);
    const payload: Record<string, any> = { status: nextStatus };

    if (nextStatus === "Listed") payload.listed_at = today;
    if (nextStatus === "Collection") {
      payload.sold_at = null;
      payload.sold_price = null;
    }

    const count = selectedCardIds.length;
    const { error } = await supabase
      .from("cards")
      .update(payload)
      .in("id", selectedCardIds)
      .eq("user_id", user.id);

    if (error) {
      alert(`Bulk update failed: ${error.message}`);
      return;
    }

    setSelectedCardIds([]);
    setStatusToast({ message: `${count} card${count === 1 ? "" : "s"} moved to ${nextStatus}.` });
    sync();
  };

  const saveBulkEdit = async () => {
    if (!bulkEditModal) return;
    if (selectedCardIds.length === 0) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const payload: Record<string, any> = {};
    if (bulkEditModal.platform.trim()) payload.sale_platform = bulkEditModal.platform.trim();
    if (bulkEditModal.askingPrice.trim()) payload.asking_price = Number(bulkEditModal.askingPrice);

    if (Object.keys(payload).length === 0) {
      alert("Enter a platform or asking price to apply.");
      return;
    }

    const count = selectedCardIds.length;
    const { error } = await supabase
      .from("cards")
      .update(payload)
      .in("id", selectedCardIds)
      .eq("user_id", user.id);

    if (error) {
      alert(`Bulk edit failed: ${error.message}`);
      return;
    }

    setBulkEditModal(null);
    setStatusToast({ message: `Updated ${count} selected card${count === 1 ? "" : "s"}.` });
    sync();
  };

  const openStatusModal = (card: Card, nextStatus: "Listed" | "Sold") => {
    const today = new Date().toISOString().slice(0, 10);
    const seller = parseSellerMeta(card.notes);
    setStatusModal({
      card,
      nextStatus,
      price: String(nextStatus === "Listed" ? card.asking_price ?? "" : card.sold_price ?? ""),
      date: String(nextStatus === "Listed" ? card.listed_at || today : card.sold_at || today),
      platform: String(card.sale_platform || ""),
      costBasis: String(seller.meta.costBasis ?? ""),
      shippingCost: String(seller.meta.shippingCost ?? ""),
      platformFee: String(seller.meta.platformFee ?? ""),
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
      costBasis: statusModal.costBasis,
      shippingCost: statusModal.shippingCost,
      platformFee: statusModal.platformFee,
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
            <h1 className="mt-3 text-2xl font-bold">Catalog</h1>
            <div className="mt-1 text-sm text-slate-400">Search, sort, and move inventory without losing the plot.</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap gap-3 md:hidden">
              <a
                href="/add-card"
                className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
              >
                Add Card
              </a>

              <details className="relative" data-inventory-menu="true">
                <summary className="list-none cursor-pointer rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700">
                  Menu ▾
                </summary>
                <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl text-left">
                  <a
                    href="/import"
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                  >
                    Import CSV
                  </a>
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                    onClick={exportCards}
                  >
                    Export CSV
                  </button>
                  <a
                    href="/sold"
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                  >
                    Sold
                  </a>
                  <a
                    href="/pc"
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                  >
                    PC ★
                  </a>
                  <a
                    href="/account"
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                  >
                    My Account
                  </a>
                  <div className="my-1 h-px bg-white/8" />
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"
                    onClick={async () => {
                      if (!supabaseConfigured || !supabase) return;
                      await supabase.auth.signOut();
                      window.location.href = "/login";
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </details>
            </div>

            <div className="hidden md:flex flex-wrap gap-3">
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
              <button
                type="button"
                className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
                onClick={exportCards}
              >
                Export CSV
              </button>
              <a
                href="/sold"
                className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
              >
                Sold
              </a>
              <a
                href="/pc"
                className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
              >
                PC ★
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

        <section className="sticky top-0 z-30 mt-0 rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur md:p-4">
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
            <div className="text-sm text-slate-400">{familyRows.length} families, {activeCards.length} active rows</div>
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

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
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

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            {q ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Search: {q}</span> : null}
            {filterSport !== "all" ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Sport: {filterSport}</span> : null}
            {filterYear !== "all" ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Year: {filterYear}</span> : null}
            {filterBrand !== "all" ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Brand: {filterBrand}</span> : null}
            {filterStatus !== "all" ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Status: {filterStatus}</span> : null}
            {filterGraded !== "all" ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Graded: {filterGraded}</span> : null}
          </div>
          </div>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Inventory units</div>
            <div className="mt-1 text-2xl font-bold">{inventoryUnits}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">Active rows</div>
            <div className="mt-1 text-2xl font-bold">{activeCards.length}</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
            <div className="text-sm text-slate-400">Estimated value</div>
            <div className="mt-1 text-2xl font-bold">${estimatedTotal.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4 shadow-[0_18px_40px_rgba(59,130,246,0.08)]">
            <div className="text-sm text-slate-300">Listed live</div>
            <div className="mt-1 text-2xl font-bold">{listedUnits}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="text-sm text-slate-400">RC / Auto rows</div>
            <div className="mt-1 text-2xl font-bold">{rookieRows} / {autographRows}</div>
          </div>
        </div>

        {cardsView === "inventory" ? (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-100">Bulk seller tools</div>
                <div className="mt-1 text-sm text-slate-400">Select visible cards in Inventory view, then move them in batches for faster inventory management.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                  onClick={() => setSelectedCardIds(visibleCardIds)}
                  disabled={visibleCardIds.length === 0}
                >
                  Select visible
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                  onClick={() => setSelectedCardIds([])}
                  disabled={selectedCardIds.length === 0}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                  onClick={() => setBulkEditModal({ platform: "", askingPrice: "" })}
                  disabled={selectedCardIds.length === 0}
                >
                  Bulk edit
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                  onClick={() => bulkUpdateStatus("Collection")}
                  disabled={selectedCardIds.length === 0}
                >
                  Move to Collection
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#d50000] px-3 py-2 text-sm font-semibold hover:bg-[#b80000]"
                  onClick={() => bulkUpdateStatus("Listed")}
                  disabled={selectedCardIds.length === 0}
                >
                  Move to Listed
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">Selected cards: {selectedCardIds.length}</div>
          </section>
        ) : null}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
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
              No cards yet. Click &quot;Add Card&quot;.
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
                  <div className="text-sm text-slate-400">Tap &quot;View&quot; to preview a candidate.</div>
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
                {familyRows.map((row, i) => {
                  const selectedParallel = selectedParallelByFamily[row.key] ?? normalizeParallelLabel(row.representative.parallel);
                  const c = row.family.find((f) => normalizeParallelLabel(f.parallel) === selectedParallel) ?? row.representative;
                  return (
                    <div key={row.key} className="rounded border border-slate-800 bg-slate-900 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={c.id ? selectedCardIds.includes(c.id) : false}
                          onChange={() => toggleCardSelection(c.id)}
                        />
                        Select
                      </label>
                      <span className="text-xs text-slate-500">Inventory row</span>
                    </div>
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
                        <div className="text-sm text-slate-400 flex items-center gap-2">
                          <span>{c.set_name}</span>
                          <select
                            className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                            value={selectedParallelByFamily[row.key] ?? normalizeParallelLabel(row.representative.parallel)}
                            onChange={(e) => setSelectedParallelByFamily((prev) => ({ ...prev, [row.key]: e.target.value }))}
                          >
                            {row.parallelOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatusValue(c.status))}`}>
                            {normalizeStatusValue(c.status)}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePc(c, c.pc_position == null)}
                            className={
                              c.pc_position != null
                                ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/15"
                                : "rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            }
                            aria-label={c.pc_position != null ? "Remove from PC" : "Add to PC"}
                            title={c.pc_position != null ? "Remove from PC" : "Star in PC"}
                          >
                            {c.pc_position != null ? "★" : "☆"}
                          </button>
                          {normalizeStatusValue(c.status) === "Listed" && c.asking_price != null ? (
                            <span className="text-sm text-slate-300">Asking ${Number(c.asking_price).toFixed(2)}</span>
                          ) : null}
                        </div>
                        <div className="text-sm text-slate-300">Qty {c.quantity} · Est. ${(Number(c.estimated_price || 0) * Number(c.quantity || 0)).toFixed(2)}</div>
                        {c.graded === "yes" && c.grade != null && <div className="text-xs text-amber-300">Graded {c.grade}</div>}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <div className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <a
                          href={buildEbaySearchUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          eBay ↗
                        </a>
                        <a
                          href={c.id ? `/add-card?edit=${encodeURIComponent(c.id)}` : "/add-card"}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          Edit
                        </a>
                        <details className="relative" data-inventory-menu="true">
                          <summary className="list-none cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                            Move ▾
                          </summary>
                          <div className="absolute right-0 z-20 mt-2 w-36 rounded-2xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl text-left">
                            {normalizeStatusValue(c.status) !== "Listed" ? (
                              <button
                                className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                onClick={() => openStatusModal(c, "Listed")}
                              >
                                Move to Listed
                              </button>
                            ) : (
                              <button
                                className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                onClick={() => updateCardStatus(c, "Collection")}
                              >
                                Move to Collection
                              </button>
                            )}
                            <button
                              className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                              onClick={() => openStatusModal(c, "Sold")}
                            >
                              Move to Sold
                            </button>
                            <div className="my-1 h-px bg-white/8" />
                            <button
                              className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"
                              onClick={() => onDelete(c.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>

              <div className="mt-4 hidden max-w-full overflow-x-hidden rounded border border-slate-800 bg-slate-900 md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-950 text-left text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={visibleCardIds.length > 0 && visibleCardIds.every((id) => selectedCardIds.includes(id))}
                          onChange={(e) => setSelectedCardIds(e.target.checked ? visibleCardIds : [])}
                          aria-label="Select visible cards"
                        />
                      </th>
                      <th className="px-3 py-2">Img</th>
                      <th className="px-3 py-2">Card</th>
                      <th className="px-3 py-2 text-center">Qty / Value</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyRows.map((row, i) => {
                      const selectedParallel = selectedParallelByFamily[row.key] ?? normalizeParallelLabel(row.representative.parallel);
                      const c = row.family.find((f) => normalizeParallelLabel(f.parallel) === selectedParallel) ?? row.representative;
                      return (
                        <tr key={row.key} className="border-t border-slate-800 align-top">
                        <td className="px-3 py-2 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={c.id ? selectedCardIds.includes(c.id) : false}
                            onChange={() => toggleCardSelection(c.id)}
                            aria-label={`Select ${c.player_name}`}
                          />
                        </td>
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
                        <td className="px-3 py-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{c.player_name}</div>
                            <button
                              type="button"
                              onClick={() => togglePc(c, c.pc_position == null)}
                              className={
                                c.pc_position != null
                                  ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/15"
                                  : "rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                              }
                              aria-label={c.pc_position != null ? "Remove from PC" : "Add to PC"}
                              title={c.pc_position != null ? "Remove from PC" : "Star in PC"}
                            >
                              {c.pc_position != null ? "★" : "☆"}
                            </button>
                          </div>
                          <div className="text-xs text-slate-400">{c.year} · {c.team} · {c.sport}</div>
                          <div className="mt-1 text-sm text-slate-200">{c.brand} · {c.set_name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>#{c.card_number}</span>
                            {c.serial_number_text ? <span>{c.serial_number_text}</span> : null}
                            <select
                              className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-200"
                              value={selectedParallelByFamily[row.key] ?? normalizeParallelLabel(row.representative.parallel)}
                              onChange={(e) => setSelectedParallelByFamily((prev) => ({ ...prev, [row.key]: e.target.value }))}
                            >
                              {row.parallelOptions.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle text-center">
                          <div className="font-semibold">Qty {c.quantity}</div>
                          <div className="text-sm text-slate-300">${(Number(c.estimated_price || 0) * Number(c.quantity || 0)).toFixed(2)}</div>
                          <div className="text-xs text-amber-300">{c.graded === "yes" && c.grade != null ? `Graded ${c.grade}` : "Ungraded"}</div>
                        </td>
                        <td className="px-3 py-2 align-middle text-center">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(normalizeStatusValue(c.status))}`}>
                            {normalizeStatusValue(c.status)}
                          </span>
                          {normalizeStatusValue(c.status) === "Listed" && c.asking_price != null ? (
                            <div className="mt-2 text-xs text-slate-300">Asking ${Number(c.asking_price).toFixed(2)}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-middle text-center">
                          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                            <a
                              href={buildEbaySearchUrl(c)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            >
                              eBay ↗
                            </a>
                            <a
                              href={c.id ? `/add-card?edit=${encodeURIComponent(c.id)}` : "/add-card"}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            >
                              Edit
                            </a>
                            <details className="relative" data-inventory-menu="true">
                              <summary className="list-none cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                                Move ▾
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-36 rounded-2xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl">
                                {normalizeStatusValue(c.status) !== "Listed" ? (
                                  <button
                                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                    onClick={() => openStatusModal(c, "Listed")}
                                  >
                                    Move to Listed
                                  </button>
                                ) : (
                                  <button
                                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                    onClick={() => updateCardStatus(c, "Collection")}
                                  >
                                    Move to Collection
                                  </button>
                                )}
                                <button
                                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                  onClick={() => openStatusModal(c, "Sold")}
                                >
                                  Move to Sold
                                </button>
                                <div className="my-1 h-px bg-white/8" />
                                <button
                                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"
                                  onClick={() => onDelete(c.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </details>
                          </div>
                        </td>
                        </tr>
                      );
                    })}
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
                          <div className="flex items-center justify-center gap-2">
                            <div className="font-semibold">{c.player_name}</div>
                            <button
                              type="button"
                              onClick={() => togglePc(c, c.pc_position == null)}
                              className={
                                c.pc_position != null
                                  ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/15"
                                  : "rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                              }
                              aria-label={c.pc_position != null ? "Remove from PC" : "Add to PC"}
                              title={c.pc_position != null ? "Remove from PC" : "Star in PC"}
                            >
                              {c.pc_position != null ? "★" : "☆"}
                            </button>
                          </div>
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

                        <div className="flex justify-center">
                          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                            <a
                              href={buildEbaySearchUrl(c)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            >
                              eBay ↗
                            </a>
                            <a
                              href={c.id ? `/add-card?edit=${encodeURIComponent(c.id)}` : "/add-card"}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                            >
                              Edit
                            </a>
                            <details className="relative" data-inventory-menu="true">
                              <summary className="list-none cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                                Move ▾
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl text-left">
                                {normalizeStatusValue(c.status) !== "Listed" ? (
                                  <button
                                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                    onClick={() => openStatusModal(c, "Listed")}
                                  >
                                    Move to Listed
                                  </button>
                                ) : (
                                  <button
                                    className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                    onClick={() => updateCardStatus(c, "Collection")}
                                  >
                                    Move to Collection
                                  </button>
                                )}
                                <button
                                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
                                  onClick={() => openStatusModal(c, "Sold")}
                                >
                                  Move to Sold
                                </button>
                                <div className="my-1 h-px bg-white/8" />
                                <button
                                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"
                                  onClick={() => onDelete(c.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </details>
                          </div>
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
    {bulkEditModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setBulkEditModal(null)}
      >
        <div
          className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-lg font-bold">Bulk edit selected cards</div>
          <div className="mt-1 text-sm text-slate-300">Apply the same platform or asking price to {selectedCardIds.length} selected card{selectedCardIds.length === 1 ? "" : "s"}.</div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Platform</div>
              <input
                className="w-full rounded bg-slate-950 px-3 py-2"
                value={bulkEditModal.platform}
                onChange={(e) => setBulkEditModal((prev) => (prev ? { ...prev, platform: e.target.value } : prev))}
                placeholder="eBay, Whatnot, local..."
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Asking price</div>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded bg-slate-950 px-3 py-2"
                value={bulkEditModal.askingPrice}
                onChange={(e) => setBulkEditModal((prev) => (prev ? { ...prev, askingPrice: e.target.value } : prev))}
                placeholder="Optional shared price"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
              onClick={() => setBulkEditModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-[#d50000] px-4 py-2 text-sm font-semibold hover:bg-[#b80000]"
              onClick={saveBulkEdit}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    )}
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

            {statusModal.nextStatus === "Sold" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <div className="mb-1 text-sm text-slate-300">Cost basis</div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={statusModal.costBasis}
                    onChange={(e) => setStatusModal((prev) => (prev ? { ...prev, costBasis: e.target.value } : prev))}
                    placeholder="0.00"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm text-slate-300">Fees</div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={statusModal.platformFee}
                    onChange={(e) => setStatusModal((prev) => (prev ? { ...prev, platformFee: e.target.value } : prev))}
                    placeholder="0.00"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm text-slate-300">Shipping</div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={statusModal.shippingCost}
                    onChange={(e) => setStatusModal((prev) => (prev ? { ...prev, shippingCost: e.target.value } : prev))}
                    placeholder="0.00"
                  />
                </label>
              </div>
            ) : null}
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
