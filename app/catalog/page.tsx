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

function buildEbaySearchUrl(card: Card) {
  const parts: string[] = [
    card.player_name,
    card.year,
    card.brand,
    card.set_name,
    card.parallel,
    card.card_number,
    card.team,
    card.sport,
    card.serial_number_text,
  ]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);

  if (card.rookie === "yes") parts.push("rookie");
  if (card.is_autograph === "yes") parts.push("autograph");
  if (card.has_memorabilia === "yes") parts.push("memorabilia");

  const query = parts.join(" ");
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
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
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [imageModal, setImageModal] = useState<{ src: string; alt: string; backSrc?: string; backAlt?: string } | null>(null);
  const [cardsView, setCardsView] = useState<"list" | "grid">("list");
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

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
    const raw = q.trim().toLowerCase();

    const wantsRookie = /\b(rc|rookie)\b/.test(raw);
    const wantsAuto = /\b(auto|autograph|autographs)\b/.test(raw);
    const wantsMem = /\b(mem|memorabilia)\b/.test(raw);

    // Remove special keywords so normal text search still works.
    const s = raw
      .replace(/\b(rc|rookie|auto|autograph|autographs|mem|memorabilia)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cards.filter((c) => {
      const matchesQ =
        !s ||
        `${c.player_name} ${c.team} ${c.year} ${c.brand} ${c.set_name} ${c.parallel} ${c.card_number} ${c.serial_number_text}`
          .toLowerCase()
          .includes(s);

      const matchesRookie = !wantsRookie || c.rookie === "yes";
      const matchesAuto = !wantsAuto || c.is_autograph === "yes";
      const matchesMem = !wantsMem || c.has_memorabilia === "yes";

      return matchesQ && matchesRookie && matchesAuto && matchesMem;
    });
  }, [cards, q]);

  const valuable = useMemo(() => {
    return [...cards].sort((a, b) => score(b) - score(a)).slice(0, 5);
  }, [cards]);

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

    setPreviewCard((prev) => (prev?.id === id ? null : prev));
    setSelectedCardIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });
  };

  const bulkDeleteSelected = async () => {
    if (!selectedCardIds.length) return;
    const ok = confirm(`Delete ${selectedCardIds.length} selected card(s)?`);
    if (!ok) return;

    if (!supabaseConfigured || !supabase) return;
    if (!testerKey) return;

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("tester_key", testerKey)
      .in("id", selectedCardIds);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }

    setSelectedCardIds([]);
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
                const ok = confirm("Are you sure you want to clear demo data? This will delete all cards in this collection (for the current tester key). ");
                if (!ok) return;
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

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="rounded bg-slate-900 px-3 py-2"
            placeholder="Search player, team, set, serial... (try: rc, auto, mem)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="rounded bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            onClick={sync}
          >
            Refresh
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => setQ((prev) => (prev.trim() ? `${prev.trim()} rc` : "rc"))}
          >
            RC
          </button>
          <button
            type="button"
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => setQ((prev) => (prev.trim() ? `${prev.trim()} auto` : "auto"))}
          >
            Auto
          </button>
          <button
            type="button"
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => setQ((prev) => (prev.trim() ? `${prev.trim()} mem` : "mem"))}
          >
            Mem
          </button>
          <button
            type="button"
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => setQ("")}
          >
            Clear
          </button>
        </div>

        <h2 className="text-xl font-semibold">Cards in Collection: {cards.length}</h2>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Valuable Candidates</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ranking of candidates based on the information you provided.
          </p>

          {valuable.length === 0 ? (
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
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <a
                              href={previewCard.id ? `/add-card?tester_key=${encodeURIComponent(testerKey)}&edit=${encodeURIComponent(previewCard.id)}` : `/add-card?tester_key=${encodeURIComponent(testerKey)}`}
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
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">All Cards</h2>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={`rounded px-3 py-1 text-xs font-semibold hover:bg-slate-800 ${cardsView === "list" ? "bg-slate-800" : "bg-slate-900"}`}
              onClick={() => setCardsView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 text-xs font-semibold hover:bg-slate-800 ${cardsView === "grid" ? "bg-slate-800" : "bg-slate-900"}`}
              onClick={() => setCardsView("grid")}
            >
              Grid
            </button>
          </div>

          {selectedCardIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-300">{selectedCardIds.length} selected</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded bg-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-600"
                  onClick={bulkDeleteSelected}
                >
                  Delete selected
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
                  onClick={() => setSelectedCardIds([])}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div
            className={
              cardsView === "grid"
                ? "mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "mt-4 space-y-3"
            }
          >
            {filtered.length === 0 ? (
              <div className="rounded border border-slate-800 bg-slate-900 p-4 text-slate-400">No matches.</div>
            ) : (
              filtered.map((c, i) => (
                <div
                  key={`${c.player_name}-${c.year}-${c.card_number}-${c.id || i}`}
                  className="rounded border border-slate-800 bg-slate-900 p-4"
                >
                  <div className={cardsView === "grid" ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row sm:items-start"}>
                    <div className="w-full sm:w-32">
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
                          className="block w-full"
                        >
                          <img
                            alt="front"
                            src={driveToImageSrc(c.image_url as string)}
                            className={cardsView === "grid" ? "h-32 w-full rounded border border-slate-800 object-contain bg-slate-900 cursor-zoom-in" : "h-24 w-full rounded border border-slate-800 object-contain bg-slate-900 cursor-zoom-in"}
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
                          className="block w-full"
                        >
                          <img
                            alt="back"
                            src={driveToImageSrc(c.back_image_url as string)}
                            className={cardsView === "grid" ? "h-32 w-full rounded border border-slate-800 object-contain bg-slate-900 cursor-zoom-in" : "h-24 w-full rounded border border-slate-800 object-contain bg-slate-900 cursor-zoom-in"}
                          />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          {c.id && (
                            <input
                              type="checkbox"
                              aria-label={`Select ${c.player_name}`}
                              className="mb-1 h-4 w-4 rounded border border-slate-700 bg-slate-950"
                              checked={selectedCardIds.includes(c.id)}
                              onChange={(e) => toggleSelected(c.id as string, e.target.checked)}
                            />
                          )}
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
                          <div className="flex w-full gap-2">
                            <a
                              href={c.id ? `/add-card?tester_key=${encodeURIComponent(testerKey)}&edit=${encodeURIComponent(c.id)}` : `/add-card?tester_key=${encodeURIComponent(testerKey)}`}
                              className="inline-flex flex-1 items-center justify-center leading-none rounded bg-[#b80000] px-2 py-1.5 text-xs font-semibold hover:bg-[#d50000]"
                            >
                              Edit
                            </a>
                            <a
                              href={buildEbaySearchUrl(c)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex flex-1 items-center justify-center leading-none rounded bg-slate-800 px-2 py-1.5 text-xs font-semibold hover:bg-slate-700"
                            >
                              eBay
                            </a>
                            <button
                              className="rounded bg-red-700 flex-1 px-3 py-1 text-xs font-semibold hover:bg-red-600"
                              onClick={() => onDelete(c.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
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
