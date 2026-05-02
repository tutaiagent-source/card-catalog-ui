"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { parseSellerMeta } from "@/lib/cardSellerMeta";

type YesNo = "yes" | "no";

type SharedCard = {
  id?: string;

  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;
  card_number: string;
  team?: string;
  sport?: string;
  competition?: string | null;
  rookie?: YesNo | string | null;
  is_autograph?: YesNo | string | null;
  has_memorabilia?: YesNo | string | null;
  serial_number_text: string;

  grading_company?: string | null;
  auto_grade?: number | null;
  grading_cert_number_text?: string | null;
  graded?: YesNo | string | null;
  grade?: number | null;

  image_url?: string;
  back_image_url?: string;

  asking_price?: number | null;
  listed_at?: string | null;
  estimated_price?: number | null;
  sale_platform?: string | null;
  notes?: string | null;
};

export default function ListingsSharedView({
  token,
  showPricing,
  showCompCheck,
  ownerUsername,
  cards,
}: {
  token: string;
  showPricing: boolean;
  showCompCheck: boolean;
  ownerUsername?: string | null;
  cards: SharedCard[];
}) {
  const { user } = useSupabaseUser();
  const [activeCard, setActiveCard] = useState<SharedCard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listedRecency, setListedRecency] = useState<"any" | "24h" | "7d" | "30d" | "90d">("any");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [onlyAutos, setOnlyAutos] = useState(false);
  const [onlyGraded, setOnlyGraded] = useState(false);
  const [onlyRookie, setOnlyRookie] = useState(false);
  const [onlyMemorabilia, setOnlyMemorabilia] = useState(false);

  useEffect(() => {
    setShowBack(false);
  }, [activeCard?.id]);

  function toUrl(s?: string | null) {
    const raw = String(s || "").trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(raw)) return `https://${raw}`;
    return null;
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
  }

  function buildEbaySearchUrl(card: SharedCard) {
    const serialRaw = String(card.serial_number_text ?? "").trim();
    const slashIdx = serialRaw.indexOf("/");
    const serialForEbay = slashIdx >= 0 ? serialRaw.slice(slashIdx) : serialRaw;

    const autoPart = yes(card.is_autograph) ? "auto" : "";

    const parts = [card.player_name, card.year, card.brand, card.set_name, card.parallel, autoPart, card.card_number, serialForEbay]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean);

    return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(parts.join(" "))}&LH_Sold=1&LH_Complete=1`;
  }

  function yes(value?: string | null) {
    return String(value || "").toLowerCase() === "yes";
  }

  const sortedCards = useMemo(() => {
    return cards
      .slice()
      .sort((a, b) => String(b.year || "").localeCompare(String(a.year || "")) || a.player_name.localeCompare(b.player_name));
  }, [cards]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const parsedMin = priceMin.trim() ? Number(priceMin) : null;
    const parsedMax = priceMax.trim() ? Number(priceMax) : null;

    const now = Date.now();
    const cutoffMs = (() => {
      switch (listedRecency) {
        case "24h":
          return now - 24 * 60 * 60 * 1000;
        case "7d":
          return now - 7 * 24 * 60 * 60 * 1000;
        case "30d":
          return now - 30 * 24 * 60 * 60 * 1000;
        case "90d":
          return now - 90 * 24 * 60 * 60 * 1000;
        case "any":
        default:
          return null;
      }
    })();

    return sortedCards.filter((card) => {
      if (cutoffMs != null) {
        const listedAtMs = card.listed_at ? new Date(card.listed_at).getTime() : NaN;
        if (!Number.isFinite(listedAtMs) || listedAtMs < cutoffMs) return false;
      }

      if (parsedMin != null || parsedMax != null) {
        const price = card.asking_price != null ? Number(card.asking_price) : NaN;
        if (!Number.isFinite(price)) return false;
        if (parsedMin != null && price < parsedMin) return false;
        if (parsedMax != null && price > parsedMax) return false;
      }

      if (onlyAutos && !yes(card.is_autograph)) return false;
      if (onlyGraded && !yes(card.graded)) return false;
      if (onlyRookie && !yes(card.rookie)) return false;
      if (onlyMemorabilia && !yes(card.has_memorabilia)) return false;

      if (!q) return true;

      const sellerNotes = parseSellerMeta(card.notes).publicNotes;
      const haystack = [
        card.player_name,
        card.year,
        card.brand,
        card.set_name,
        card.parallel,
        card.team,
        card.sport,
        card.competition,
        sellerNotes,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [sortedCards, searchQuery, listedRecency, priceMin, priceMax, onlyAutos, onlyGraded, onlyRookie, onlyMemorabilia]);

  const activeCardPublicNotes = useMemo(() => parseSellerMeta(activeCard?.notes).publicNotes, [activeCard?.notes]);

  const proxyImageSrc = (
    cardId?: string | null,
    side: "front" | "back" = "front",
    variant: "grid" | "detail" = "detail"
  ) => {
    const id = String(cardId || "").trim();
    if (!id) return "";
    return `/api/listings-share-image?token=${encodeURIComponent(token)}&cardId=${encodeURIComponent(id)}&side=${encodeURIComponent(side)}&variant=${encodeURIComponent(variant)}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              🔗 Shared listings
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">View-only</h1>
            <p className="mt-2 text-slate-300">Tap a card for a larger view.</p>
            {ownerUsername ? <p className="mt-2 text-sm text-slate-400">Seller: <span className="text-slate-200">@{ownerUsername}</span></p> : null}
          </div>
        </div>

        {sortedCards.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-lg font-semibold text-white">No active listings</div>
            <div className="mt-2 text-sm text-slate-300">This share may be empty or expired.</div>
          </div>
        ) : (
          <section className="mt-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-slate-200">Shared shelf</div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by player name"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none sm:max-w-xs"
                  aria-label="Search shared listings by player name"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-300">Listed</div>
                  <select
                    value={listedRecency}
                    onChange={(e) => setListedRecency(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                    aria-label="Filter by listed recency"
                  >
                    <option value="any">Any time</option>
                    <option value="24h">Last 24h</option>
                    <option value="7d">Last 7d</option>
                    <option value="30d">Last 30d</option>
                    <option value="90d">Last 90d</option>
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-300">Price min (USD)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                    aria-label="Minimum asking price"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-300">Price max (USD)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                    aria-label="Maximum asking price"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-950" checked={onlyAutos} onChange={(e) => setOnlyAutos(e.target.checked)} />
                  Auto
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-950" checked={onlyGraded} onChange={(e) => setOnlyGraded(e.target.checked)} />
                  Graded
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-950" checked={onlyRookie} onChange={(e) => setOnlyRookie(e.target.checked)} />
                  Rookie
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-950" checked={onlyMemorabilia} onChange={(e) => setOnlyMemorabilia(e.target.checked)} />
                  Memorabilia
                </label>

                {(listedRecency !== "any" || priceMin.trim() !== "" || priceMax.trim() !== "" || onlyAutos || onlyGraded || onlyRookie || onlyMemorabilia) ? (
                  <button
                    type="button"
                    className="ml-auto rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                    onClick={() => {
                      setListedRecency("any");
                      setPriceMin("");
                      setPriceMax("");
                      setOnlyAutos(false);
                      setOnlyGraded(false);
                      setOnlyRookie(false);
                      setOnlyMemorabilia(false);
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>

              {filteredCards.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                  No cards match that search.
                </div>
              ) : (
                <>
                  <div
                    className="md:hidden space-y-3"
                    role="list"
                    aria-label="Shared listed cards"
                  >
                    {filteredCards.map((c) => {
                      const goHref = toUrl(c.sale_platform);
                      const cardPublicNotes = c.notes ? parseSellerMeta(c.notes).publicNotes : "";
                      return (
                        <div
                          key={c.id}
                          role="listitem"
                          tabIndex={0}
                          onClick={() => setActiveCard(c)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setActiveCard(c);
                          }}
                          className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/40 p-3"
                          aria-label={`View ${c.player_name}`}
                        >
                          <div className="flex gap-3">
                            {c.image_url && c.id ? (
                              <button
                                type="button"
                                className="h-20 w-14 flex-shrink-0 overflow-hidden rounded border border-slate-800 bg-slate-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCard(c);
                                }}
                                aria-label={`View ${c.player_name}`}
                              >
                                <img
                                  alt={c.player_name}
                                  src={proxyImageSrc(c.id, "front", "grid")}
                                  className="h-full w-full object-contain"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </button>
                            ) : (
                              <div className="h-20 w-14 flex-shrink-0 rounded border border-slate-800 bg-slate-950" />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-white">{c.player_name}</div>
                                  <div className="mt-0.5 text-sm text-slate-300">
                                    {c.year} · {c.brand}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    {c.set_name} · {c.parallel}
                                  </div>

                                  {c.serial_number_text ? (
                                    <div className="mt-1 text-[11px] text-slate-400 truncate">
                                      <span className="text-slate-500">Serial:</span> {c.serial_number_text}
                                    </div>
                                  ) : null}
                                  {cardPublicNotes ? (
                                    <div className="mt-1 text-[11px] text-amber-200 line-clamp-2">{cardPublicNotes}</div>
                                  ) : null}
                                </div>

                                {goHref ? (
                                  <div className="mt-0.5 rounded-full border border-white/10 bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-slate-200">
                                    ↗
                                  </div>
                                ) : null}
                              </div>

                              {c.asking_price != null ? (
                                showPricing ? (
                                  <div className="mt-2 text-sm font-semibold text-slate-100">
                                    {formatMoney(Number(c.asking_price))}
                                  </div>
                                ) : (
                                  <div className="mt-2 text-sm font-semibold text-emerald-200">✅ Accepting offers</div>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="hidden md:grid grid-cols-4 gap-2 sm:grid-cols-5"
                    role="list"
                    aria-label="Shared listed cards"
                  >
                    {filteredCards.map((c) => {
                      const goHref = toUrl(c.sale_platform);
                      const cardPublicNotes = c.notes ? parseSellerMeta(c.notes).publicNotes : "";
                      return (
                        <div
                          key={c.id}
                          role="listitem"
                          tabIndex={0}
                          onClick={() => setActiveCard(c)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setActiveCard(c);
                          }}
                          className="relative cursor-pointer rounded-xl border border-slate-800 bg-slate-950/40 p-2"
                          aria-label={`View ${c.player_name}`}
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-950 flex items-center justify-center">
                            {c.image_url && c.id ? (
                              <img
                                alt={c.player_name}
                                src={proxyImageSrc(c.id, "front", "detail")}
                                className="max-h-full max-w-full object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="h-full w-full" />
                            )}
                          </div>

                          <div className="mt-2 text-center">
                            <div className="line-clamp-2 text-sm font-semibold text-white">{c.player_name}</div>
                            <div className="mt-1 text-xs text-slate-300">
                              {c.year} · {c.brand}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {c.set_name} · {c.parallel}
                            </div>

                            {c.serial_number_text ? (
                              <div className="mt-1 text-[11px] text-slate-400 truncate">
                                <span className="text-slate-500">Serial:</span> {c.serial_number_text}
                              </div>
                            ) : null}
                            {cardPublicNotes ? (
                              <div className="mt-1 text-[11px] text-amber-200 line-clamp-2">{cardPublicNotes}</div>
                            ) : null}

                            {c.asking_price != null ? (
                              showPricing ? (
                                <div className="mt-2 text-sm font-semibold text-slate-100">{formatMoney(Number(c.asking_price))}</div>
                              ) : (
                                <div className="mt-2 text-sm font-semibold text-emerald-200">✅ Accepting offers</div>
                              )
                            ) : null}
                          </div>

                          {goHref ? (
                            <div className="absolute right-2 top-2 z-20 rounded-full border border-white/10 bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold text-slate-200">
                              ↗
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {activeCard ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4" onClick={() => setActiveCard(null)}>
            <div
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl [-webkit-overflow-scrolling:touch]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Listed card</div>
                  <div className="mt-2 text-xl font-bold text-white">{[activeCard.year, activeCard.player_name].filter(Boolean).join(" ")}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCard(null)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-white/10 bg-slate-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Image</div>
                      {activeCard.back_image_url ? (
                        <div className="mt-1 text-xs text-slate-400">Use the button to view the back of the card.</div>
                      ) : null}
                    </div>
                    {activeCard.back_image_url ? (
                      <button
                        type="button"
                        onClick={() => setShowBack((v) => !v)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                      >
                        {showBack ? "Show front" : "Show back"}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>

                  <div className="mt-4">
                    <div
                      className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-950"
                      role={activeCard.back_image_url ? "button" : undefined}
                      tabIndex={activeCard.back_image_url ? 0 : -1}
                      aria-label={activeCard.back_image_url ? "Flip card" : undefined}
                      onClick={() => {
                        if (!activeCard.back_image_url) return;
                        setShowBack((v) => !v);
                      }}
                      onKeyDown={(e) => {
                        if (!activeCard.back_image_url) return;
                        if (e.key === "Enter" || e.key === " ") setShowBack((v) => !v);
                      }}
                    >
                      {activeCard.back_image_url ? (
                        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10">
                          ⇄
                        </div>
                      ) : null}

                      <div className="relative h-full w-full" style={{ perspective: 1200 }}>
                        <div
                          className="absolute inset-0 h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                          style={{
                            transformStyle: "preserve-3d",
                            transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
                          }}
                        >
                          {activeCard.image_url && activeCard.id ? (
                            <img
                              alt="front"
                              src={proxyImageSrc(activeCard.id, "front", "detail")}
                              className="absolute inset-0 h-full w-full object-contain"
                              style={{ backfaceVisibility: "hidden" }}
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: "hidden" }} />
                          )}

                          {activeCard.back_image_url && activeCard.id ? (
                            <img
                              alt="back"
                              src={proxyImageSrc(activeCard.id, "back", "detail")}
                              className="absolute inset-0 h-full w-full object-contain"
                              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                              draggable={false}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white">Card details</div>

                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <div className="text-base font-semibold text-white">{activeCard.player_name}</div>
                      <div>
                        <span className="text-white">{[activeCard.year, activeCard.brand, activeCard.set_name].filter(Boolean).join(" · ")}</span>
                      </div>
                      {(activeCard.team || activeCard.sport || activeCard.competition) ? (
                        <div>
                          <span className="text-white">{[activeCard.team, activeCard.sport, activeCard.competition].filter(Boolean).join(" · ")}</span>
                        </div>
                      ) : null}
                      <div>
                        <span className="text-slate-400">Brand/Set:</span>{" "}
                        <span className="text-white">{activeCard.brand} · {activeCard.set_name}</span>
                      </div>
                      {activeCard.parallel ? (
                        <div>
                          <span className="text-slate-400">Parallel:</span>{" "}
                          <span className="text-white">{activeCard.parallel}</span>
                        </div>
                      ) : null}
                      <div>
                        <span className="text-slate-400">Card:</span>{" "}
                        <span className="text-white">#{activeCard.card_number}</span>
                      </div>
                      {activeCard.serial_number_text ? (
                        <div>
                          <span className="text-slate-400">Serial:</span>{" "}
                          <span className="text-white">{activeCard.serial_number_text}</span>
                        </div>
                      ) : null}

                      {activeCard.asking_price != null ? (
                        showPricing ? (
                          <div className="pt-1">
                            <span className="text-slate-400">Asking:</span>{" "}
                            <span className="text-white font-semibold">{formatMoney(Number(activeCard.asking_price))}</span>
                          </div>
                        ) : (
                          <div className="pt-1 text-sm font-semibold text-emerald-200">✅ Accepting offers</div>
                        )
                      ) : null}

                      {activeCardPublicNotes ? (
                        <div className="pt-3">
                          <span className="text-slate-400">Seller notes:</span>
                          <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-200">{activeCardPublicNotes}</div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2 pt-2 text-xs">
                        {yes(activeCard.is_autograph) ? <span className="rounded bg-[#d50000] px-2 py-1 text-white">Auto</span> : null}
                        {yes(activeCard.has_memorabilia) ? <span className="rounded bg-[#d50000] px-2 py-1 text-white">Mem</span> : null}
                        {yes(activeCard.rookie) ? <span className="rounded bg-amber-500 px-2 py-1 text-black">RC</span> : null}
                        {yes(activeCard.graded) && activeCard.grade != null ? <span className="rounded bg-blue-800 px-2 py-1 text-white">Grade {activeCard.grade}</span> : null}
                        {yes(activeCard.graded) && activeCard.grading_company ? <span className="rounded bg-slate-800 px-2 py-1 text-white">{activeCard.grading_company}</span> : null}
                        {yes(activeCard.graded) && activeCard.auto_grade != null ? <span className="rounded bg-emerald-900 px-2 py-1 text-white">Auto {activeCard.auto_grade}</span> : null}
                        {yes(activeCard.graded) && activeCard.grading_cert_number_text ? (
                          <span className="max-w-[180px] truncate rounded bg-slate-700 px-2 py-1 text-white" title={activeCard.grading_cert_number_text}>
                            Cert {activeCard.grading_cert_number_text}
                          </span>
                        ) : null}
                      </div>

                      {String(activeCard.graded || "no") === "yes" && activeCard.grade != null ? (
                        <div className="pt-2">
                          <span className="text-slate-400">Grade:</span>{" "}
                          <span className="text-white">{activeCard.grade}</span>
                        </div>
                      ) : null}

                      {String(activeCard.graded || "no") === "yes" && activeCard.grading_company ? (
                        <div>
                          <span className="text-slate-400">Company:</span>{" "}
                          <span className="text-white">{activeCard.grading_company}</span>
                        </div>
                      ) : null}

                      {String(activeCard.graded || "no") === "yes" && activeCard.auto_grade != null ? (
                        <div>
                          <span className="text-slate-400">Auto grade:</span>{" "}
                          <span className="text-white">{activeCard.auto_grade}</span>
                        </div>
                      ) : null}

                      {String(activeCard.graded || "no") === "yes" && activeCard.grading_cert_number_text ? (
                        <div>
                          <span className="text-slate-400">Cert:</span>{" "}
                          <span className="text-white">{activeCard.grading_cert_number_text}</span>
                        </div>
                      ) : null}

                      {(() => {
                        const href = toUrl(activeCard.sale_platform);
                        if (!href && !showCompCheck) return null;
                        return (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                              >
                                Open listing ↗
                              </a>
                            ) : null}

                            {showCompCheck ? (
                              <a
                                href={buildEbaySearchUrl(activeCard)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/15"
                              >
                                Comp check ↗
                              </a>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
