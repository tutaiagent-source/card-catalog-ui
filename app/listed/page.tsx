"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { driveToImageSrc } from "@/lib/googleDrive";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import CatalogShareModal from "@/components/CatalogShareModal";

type CardStatus = "Collection" | "Listed" | "Sold";

type ListedCard = {
  id?: string;

  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;

  serial_number_text: string;

  image_url?: string;
  back_image_url?: string;

  status?: CardStatus | string;
  asking_price?: number | null;
  listed_at?: string | null;
  sale_platform?: string | null;

  sold_price?: number | null;
  sold_at?: string | null;
};

function toUrl(s?: string | null) {
  const raw = String(s || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function buildEbayCompsUrl(card: ListedCard) {
  const serialRaw = String(card.serial_number_text ?? "").trim();
  const slashIdx = serialRaw.indexOf("/");
  const serialForEbay = slashIdx >= 0 ? serialRaw.slice(slashIdx) : serialRaw;

  const parts: string[] = [
    card.player_name,
    card.brand,
    card.set_name,
    card.parallel,
    serialForEbay,
  ]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .filter((p) => p.toLowerCase() !== "n/a");

  const query = parts.join(" ");
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
}

function normalizeStatusValue(status?: string | null): CardStatus {
  const raw = String(status || "").trim().toLowerCase();
  if (raw === "sold") return "Sold";
  return "Listed";
}

function shortDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ListedPage() {
  const { user, loading } = useSupabaseUser();
  const needsEmailVerification = !!user && !(user as any)?.email_confirmed_at;

  const [cards, setCards] = useState<ListedCard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeCard, setActiveCard] = useState<ListedCard | null>(null);
  const [showBack, setShowBack] = useState(false);

  const [editLink, setEditLink] = useState<string>("");
  const [editAskingPrice, setEditAskingPrice] = useState<string>("");
  const [editListedAt, setEditListedAt] = useState<string>("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [markSoldModal, setMarkSoldModal] = useState<{ price: string; date: string } | null>(null);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const [shareCard, setShareCard] = useState<any | null>(null);

  const sortedCards = useMemo(() => {
    return cards
      .slice()
      .sort((a, b) => {
        if (a.status === "Sold" && b.status !== "Sold") return 1;
        if (a.status !== "Sold" && b.status === "Sold") return -1;

        if (a.status === "Sold" && b.status === "Sold") {
          return String(b.sold_at || "").localeCompare(String(a.sold_at || ""));
        }

        return String(b.listed_at || "").localeCompare(String(a.listed_at || ""));
      });
  }, [cards]);

  async function loadListedCards() {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("id, player_name, year, brand, set_name, parallel, serial_number_text, image_url, back_image_url, status, asking_price, listed_at, sale_platform, sold_price, sold_at")
        .eq("user_id", user.id)
        .eq("status", "Listed");

      if (error) {
        console.error("Failed to fetch listed cards:", error);
        return;
      }

      setCards(((data ?? []) as ListedCard[]).map((c) => ({ ...c, status: normalizeStatusValue(c.status) })));
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!user?.id || !supabaseConfigured) return;
    loadListedCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!activeCard) return;
    setShowBack(false);
    setEditLink(String(activeCard.sale_platform || ""));
    setEditAskingPrice(activeCard.asking_price != null ? String(activeCard.asking_price) : "");
    setEditListedAt(activeCard.listed_at ? String(activeCard.listed_at).slice(0, 10) : "");
  }, [activeCard]);

  async function saveListingDetails() {
    if (!user?.id || !supabaseConfigured || !supabase || !activeCard?.id) return;

    setIsSavingDetails(true);
    try {
      const askingRaw = editAskingPrice.trim();
      let asking_price: number | null = null;
      if (askingRaw) {
        const n = Number(askingRaw);
        if (!Number.isFinite(n)) {
          alert("Enter a valid asking price.");
          return;
        }
        asking_price = n;
      }

      const listed_at = editListedAt.trim() ? editListedAt.trim() : null;
      const sale_platform = editLink.trim() ? editLink.trim() : null;

      const { error } = await supabase
        .from("cards")
        .update({ asking_price, listed_at, sale_platform })
        .eq("id", activeCard.id)
        .eq("user_id", user.id);

      if (error) {
        alert("Could not save the listing details.");
        console.error(error);
        return;
      }

      setCards((prev) =>
        prev.map((c) =>
          c.id === activeCard.id
            ? { ...c, asking_price, listed_at, sale_platform }
            : c
        )
      );

      setActiveCard((prev) => (prev ? { ...prev, asking_price, listed_at, sale_platform } : prev));
    } finally {
      setIsSavingDetails(false);
    }
  }

  function openMarkSoldModal() {
    const today = new Date().toISOString().slice(0, 10);
    setMarkSoldModal({
      price: editAskingPrice.trim(),
      date: today,
    });
  }

  async function markAsSold() {
    if (!activeCard?.id) return;
    if (!user?.id || !supabaseConfigured || !supabase) return;
    if (!markSoldModal) return;

    const priceRaw = markSoldModal.price.trim();
    if (!priceRaw) {
      alert("Enter the sold price.");
      return;
    }

    const sold_price = Number(priceRaw);
    if (!Number.isFinite(sold_price) || sold_price < 0) {
      alert("Enter a valid sold price.");
      return;
    }

    const sold_at = markSoldModal.date.trim();
    if (!sold_at) {
      alert("Enter the sold date.");
      return;
    }

    const sale_platform = editLink.trim() || activeCard.sale_platform || null;

    setIsMarkingSold(true);
    try {
      const { error } = await supabase
        .from("cards")
        .update({ status: "Sold", sold_price, sold_at, sale_platform })
        .eq("id", activeCard.id)
        .eq("user_id", user.id);

      if (error) {
        alert(`Could not mark as sold: ${error.message}`);
        return;
      }

      setActiveCard(null);
      setMarkSoldModal(null);
      window.location.href = "/sold";
    } finally {
      setIsMarkingSold(false);
    }
  }

  const activeHref = toUrl(editLink);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <CardCatMobileNav />
        <EmailVerificationNotice needsVerification={needsEmailVerification} email={(user as any)?.email} />

        <div className="flex items-end justify-between gap-4">
          <div>
            <CardCatLogo />
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              <span>📣</span>
              <span>Listed</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Actively listed cards</h1>
            <p className="mt-2 text-slate-300">Tap a card to set (or update) the sale link. When you mark it sold, it moves to the Sold page.</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-400">{sortedCards.length} active listing{sortedCards.length === 1 ? "" : "s"}</div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={loadListedCards}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                disabled={loading || isRefreshing}
              >
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {sortedCards.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-lg font-semibold text-white">No active listings</div>
            <div className="mt-2 text-sm text-slate-300">Mark cards as Listed in Catalog to see them here.</div>
          </div>
        ) : (
          <>
            {/* Mobile: grid */}
            <section className="mt-6 lg:hidden">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-sm font-semibold text-slate-200">Listed shelf</div>

                <div className="grid grid-cols-4 gap-2" role="list" aria-label="Listed cards">
                  {sortedCards.map((c) => {
                    const src = c.image_url ? driveToImageSrc(c.image_url) : "";
                    const goHref = toUrl(c.sale_platform);
                    return (
                      <div
                        key={c.id}
                        role="listitem"
                        tabIndex={0}
                        onClick={() => setActiveCard(c)}
                        className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-0"
                        aria-label={`View ${c.player_name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setActiveCard(c);
                        }}
                      >
                        <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-950">
                          {c.image_url ? <img alt="front" src={src} className="h-full w-full object-contain" /> : <div className="h-full w-full" />}
                        </div>

                        {c.status === "Sold" && c.sold_price != null ? (
                          <div className="absolute left-2 top-2 z-10 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-500/20">
                            SOLD {formatMoney(Number(c.sold_price))}
                          </div>
                        ) : c.asking_price != null ? (
                          <div className="absolute left-2 top-2 z-10 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold text-slate-100 ring-1 ring-white/10">
                            {formatMoney(Number(c.asking_price))}
                          </div>
                        ) : null}

                        {goHref ? (
                          <a
                            href={goHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 bottom-2 z-20 rounded-full border border-white/10 bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-950/90"
                          >
                            Go ↗
                          </a>
                        ) : null}

                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Desktop: grid */}
            <section className="hidden lg:block mt-8">
              <div className="rounded-[28px] bg-white/[0.03] p-5">
                <div className="rounded-[20px] bg-slate-900/30 p-4">
                  <div className="text-sm font-semibold text-slate-200">Display</div>
                  <div className="mt-4 grid grid-cols-6 gap-4">
                    {sortedCards.map((c) => {
                      const src = c.image_url ? driveToImageSrc(c.image_url) : "";
                      const goHref = toUrl(c.sale_platform);
                      return (
                        <div
                          key={c.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveCard(c)}
                          className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-3 hover:bg-slate-950/55"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setActiveCard(c);
                          }}
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950">
                            {c.image_url ? <img alt="front" src={src} className="h-full w-full object-contain" /> : <div className="h-full w-full" />}
                          </div>

                          {goHref ? (
                            <a
                              href={goHref}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-3 top-3 z-20 rounded-full border border-white/10 bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-950/90"
                            >
                              Go ↗
                            </a>
                          ) : null}


                          {c.status === "Sold" ? (
                            c.sold_price != null ? (
                              <div className="mt-3 text-center text-sm font-semibold text-emerald-200">SOLD {formatMoney(Number(c.sold_price))}</div>
                            ) : (
                              <div className="mt-3 text-center text-sm font-semibold text-slate-500">Sold</div>
                            )
                          ) : c.asking_price != null ? (
                            <div className="mt-3 text-center text-sm font-semibold text-slate-100">{formatMoney(Number(c.asking_price))}</div>
                          ) : (
                            <div className="mt-3 text-center text-sm font-semibold text-slate-500">No price</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Modal */}
        {activeCard ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
            onClick={() => setActiveCard(null)}
          >
            <div
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl [-webkit-overflow-scrolling:touch]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                    {activeCard.status === "Sold" ? "Sold card" : "Listed card"}
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">
                    {[activeCard.year, activeCard.player_name].filter(Boolean).join(" ")}
                  </div>

                  {activeCard.status === "Sold" ? (
                    <div className="mt-2 text-sm text-emerald-200">
                      {activeCard.sold_at ? `Sold ${shortDate(activeCard.sold_at)} ` : "Sold "}
                      {activeCard.sold_price != null ? `· ${formatMoney(Number(activeCard.sold_price))}` : ""}
                    </div>
                  ) : null}
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
                    <div className="text-sm font-semibold text-slate-200">Image</div>
                    <div />
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
                          {activeCard.image_url ? (
                            <img
                              alt="front"
                              src={driveToImageSrc(activeCard.image_url)}
                              className="absolute inset-0 h-full w-full object-contain"
                              style={{ backfaceVisibility: "hidden" }}
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: "hidden" }} />
                          )}

                          {activeCard.back_image_url ? (
                            <img
                              alt="back"
                              src={driveToImageSrc(activeCard.back_image_url)}
                              className="absolute inset-0 h-full w-full object-contain"
                              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                              draggable={false}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-slate-300">
                    <div>
                      <span className="text-slate-400">Set:</span> <span className="text-white">{activeCard.set_name}</span>
                    </div>
                    {activeCard.parallel ? (
                      <div>
                        <span className="text-slate-400">Parallel:</span> <span className="text-white">{activeCard.parallel}</span>
                      </div>
                    ) : null}

                    {activeCard.status === "Sold" ? (
                      <div>
                        <span className="text-slate-400">Sold:</span>{" "}
                        <span className="text-white">
                          {activeCard.sold_at ? String(activeCard.sold_at).slice(0, 10) : "?"}
                          {activeCard.sold_price != null ? ` · ${formatMoney(Number(activeCard.sold_price))}` : ""}
                        </span>
                      </div>
                    ) : null}

                    {activeCard.status !== "Sold" && activeCard.listed_at ? (
                      <div>
                        <span className="text-slate-400">Listed:</span> <span className="text-white">{String(activeCard.listed_at)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-slate-200">Listing details</div>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-slate-200">Asking price</div>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={editAskingPrice}
                        onChange={(e) => setEditAskingPrice(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-slate-200">Listed date</div>
                      <input
                        type="date"
                        value={editListedAt}
                        onChange={(e) => setEditListedAt(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-slate-200">Sale link (URL) or platform</div>
                      <input
                        value={editLink}
                        onChange={(e) => setEditLink(e.target.value)}
                        placeholder="https://... (or eBay, Whatnot, ... )"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                      />

                      {activeHref ? (
                        <div className="mt-3">
                          <a
                            href={activeHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                          >
                            Open listing
                          </a>
                        </div>
                      ) : null}

                      <div className="mt-3">
                        <a
                          href={buildEbayCompsUrl(activeCard)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          Check comps ↗
                        </a>
                      </div>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeCard.status === "Sold" ? (
                        <a
                          href="/sold"
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.08] text-center"
                        >
                          View sold page
                        </a>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={saveListingDetails}
                            disabled={isSavingDetails}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.08] disabled:opacity-60"
                          >
                            {isSavingDetails ? "Saving…" : "Save listing"}
                          </button>
                          <button
                            type="button"
                            onClick={openMarkSoldModal}
                            disabled={isMarkingSold}
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-60"
                          >
                            {isMarkingSold ? "Marking…" : "Mark sold"}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShareCard({
                            player_name: activeCard.player_name,
                            year: activeCard.year,
                            set_name: activeCard.set_name,
                            parallel: activeCard.parallel,
                            serial_number_text: activeCard.serial_number_text,
                            asking_price: activeCard.asking_price,
                            image_url: activeCard.image_url,
                            back_image_url: activeCard.back_image_url,
                          });
                        }}
                        className="rounded-2xl bg-[#d50000] px-4 py-3 text-sm font-semibold text-white hover:bg-[#b80000]"
                      >
                        Share post
                      </button>
                    </div>
                  </div>

                  {shareCard ? (
                    <CatalogShareModal card={shareCard} onClose={() => setShareCard(null)} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

      {markSoldModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
          onClick={() => setMarkSoldModal(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              onClick={() => setMarkSoldModal(null)}
            >
              ✕
            </button>

            <div className="text-lg font-bold">Mark as sold</div>
            <div className="mt-1 text-sm text-slate-300">
              {activeCard ? `${activeCard.player_name} · ${activeCard.year} · ${activeCard.brand}` : ""}
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <div className="mb-1 text-sm text-slate-300">Sold price</div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded bg-slate-950 px-3 py-2 text-white"
                  value={markSoldModal.price}
                  onChange={(e) => setMarkSoldModal((prev) => (prev ? { ...prev, price: e.target.value } : prev))}
                  placeholder="e.g. 28.00"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm text-slate-300">Sold date</div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 rounded bg-slate-950 px-3 py-2 text-white"
                    value={markSoldModal.date}
                    onChange={(e) => setMarkSoldModal((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                  />
                  <button
                    type="button"
                    className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                    onClick={() =>
                      setMarkSoldModal((prev) => (prev ? { ...prev, date: new Date().toISOString().slice(0, 10) } : prev))
                    }
                  >
                    Today
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
                onClick={() => setMarkSoldModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-[#d50000] px-4 py-2 text-sm font-semibold hover:bg-[#b80000] disabled:opacity-60"
                disabled={isMarkingSold}
                onClick={() => markAsSold()}
              >
                {isMarkingSold ? "Marking…" : "Mark sold"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      </div>
    </main>
  );
}
