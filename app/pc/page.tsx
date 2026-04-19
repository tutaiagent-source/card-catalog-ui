"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { driveToImageSrc } from "@/lib/googleDrive";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import CatalogShareModal from "@/components/CatalogShareModal";

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

  graded?: YesNo;
  grade?: number | null;

  serial_number_text: string;
  quantity: number;

  estimated_price?: number | null;

  image_url?: string;
  back_image_url?: string;

  pc_position?: number | null;
};

function buildEbaySearchUrl(card: Card) {
  const serialRaw = String(card.serial_number_text ?? "").trim();
  const slashIdx = serialRaw.indexOf("/");
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

export default function PcPage() {
  const { user, loading } = useSupabaseUser();
  const needsEmailVerification = !!user && !(user as any)?.email_confirmed_at;

  const [pcCards, setPcCards] = useState<Card[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Desktop drag-to-reorder
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragInsertBefore, setDragInsertBefore] = useState(true);

  // Image modal (mobile + desktop)
  const [imageModal, setImageModal] = useState<{ card: Card; src: string; backSrc?: string } | null>(null);
  const [shareCard, setShareCard] = useState<Card | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const [estimateDraft, setEstimateDraft] = useState<string>("");
  const [estimateSaving, setEstimateSaving] = useState(false);

  const [cardDetailsDraft, setCardDetailsDraft] = useState({
    player_name: "",
    year: "",
    brand: "",
    set_name: "",
    parallel: "",
    card_number: "",
    serial_number_text: "",
  });
  const [cardDetailsSaving, setCardDetailsSaving] = useState(false);

  useEffect(() => {
    if (!imageModal) return;
    setShowBack(false);
    setIsFlipping(false);
    setEstimateDraft(
      imageModal.card.estimated_price != null && Number.isFinite(Number(imageModal.card.estimated_price))
        ? String(imageModal.card.estimated_price)
        : ""
    );

    setCardDetailsDraft({
      player_name: imageModal.card.player_name ?? "",
      year: imageModal.card.year ?? "",
      brand: imageModal.card.brand ?? "",
      set_name: imageModal.card.set_name ?? "",
      parallel: imageModal.card.parallel ?? "",
      card_number: imageModal.card.card_number ?? "",
      serial_number_text: imageModal.card.serial_number_text ?? "",
    });
  }, [imageModal]);

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase.from("cards").select("*").eq("user_id", user.id);
      if (error) {
        console.error("Failed to fetch PC cards:", error);
        return;
      }

      const all = (data ?? []) as Card[];
      const next = all
        .filter((c) => c.pc_position != null)
        .slice()
        .sort((a, b) => Number(a.pc_position ?? 0) - Number(b.pc_position ?? 0));

      setPcCards(next);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!statusToast) return;
    const t = window.setTimeout(() => setStatusToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [statusToast]);

  const computeReordered = (base: Card[], fromId: string, overId: string, insertBefore: boolean) => {
    const fromIndex = base.findIndex((c) => c.id === fromId);
    const toIndex = base.findIndex((c) => c.id === overId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return base;

    // Replace the hovered card's position with the dragged card (swap),
    // instead of inserting and shifting everything between.
    const next = base.slice();
    const tmp = next[fromIndex];
    next[fromIndex] = next[toIndex];
    next[toIndex] = tmp;

    return next;
  };

  // Keep shelf order stable during drag to avoid HTML5 DnD layout glitches.
  const displayedCards = pcCards;

  const persistOrder = async (next: Card[]) => {
    if (!supabaseConfigured || !supabase) return;
    const sb = supabase;
    if (!user?.id) return;

    setSavingOrder(true);
    try {
      const updates = next.map((c, i) => {
        if (!c.id) return Promise.resolve(null);
        return sb.from("cards").update({ pc_position: (i + 1) * 1000 }).eq("id", c.id).eq("user_id", user.id);
      });

      await Promise.all(updates);
      setPcCards(next);
    } finally {
      setSavingOrder(false);
    }
  };

  const removeFromPc = async (card: Card) => {
    if (!card.id) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const { error } = await supabase
      .from("cards")
      .update({ pc_position: null })
      .eq("id", card.id)
      .eq("user_id", user.id);

    if (error) {
      alert(`PC update failed: ${error.message}`);
      return;
    }

    setStatusToast(`${card.player_name} removed from PC.`);
    setImageModal((prev) => (prev?.card.id === card.id ? null : prev));
    setPcCards((prev) => prev.filter((c) => c.id !== card.id));
  };

  const updateEstimatedPrice = async () => {
    const cardId = imageModal?.card?.id;
    if (!cardId) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const trimmed = estimateDraft.trim();
    let next: number | null = null;
    if (trimmed !== "") {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) {
        alert("Enter a valid estimated price (numbers only). ");
        return;
      }
      next = parsed;
    }

    setEstimateSaving(true);
    try {
      const { error } = await supabase
        .from("cards")
        .update({ estimated_price: next })
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (error) {
        alert(`PC estimate update failed: ${error.message}`);
        return;
      }

      setPcCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, estimated_price: next } : c)));
      setImageModal((prev) => (prev ? { ...prev, card: { ...prev.card, estimated_price: next } } : prev));
      setStatusToast("Estimated price updated.");
    } finally {
      setEstimateSaving(false);
    }
  };

  const updateCardDetails = async () => {
    const cardId = imageModal?.card?.id;
    if (!cardId) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const payload = {
      player_name: cardDetailsDraft.player_name.trim(),
      year: cardDetailsDraft.year.trim(),
      brand: cardDetailsDraft.brand.trim(),
      set_name: cardDetailsDraft.set_name.trim(),
      parallel: cardDetailsDraft.parallel.trim(),
      card_number: cardDetailsDraft.card_number.trim(),
      serial_number_text: cardDetailsDraft.serial_number_text.trim(),
    };

    setCardDetailsSaving(true);
    try {
      const { error } = await supabase
        .from("cards")
        .update(payload)
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (error) {
        alert(`Card details update failed: ${error.message}`);
        return;
      }

      setPcCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...payload } : c)));
      setImageModal((prev) => (prev ? { ...prev, card: { ...prev.card, ...payload } } : prev));
      setStatusToast("Card details updated.");
    } finally {
      setCardDetailsSaving(false);
    }
  };

  const onDropReorder = async (overId: string, insertBefore: boolean) => {
    if (!draggingId || draggingId === overId) return;

    const next = computeReordered(pcCards, draggingId, overId, insertBefore);
    setDragOverId(null);
    setDraggingId(null);

    const name = pcCards.find((c) => c.id === draggingId)?.player_name ?? "Card";
    await persistOrder(next);
    setStatusToast(`Reordered: ${name}`);
  };

  const totalPcCards = pcCards.length;

  const formatDollars = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const totalPcEstimatedValue = pcCards.reduce((sum, c) => sum + (c.estimated_price != null ? Number(c.estimated_price) || 0 : 0), 0);
  const hasAnyEstimatedValue = pcCards.some((c) => c.estimated_price != null && Number.isFinite(Number(c.estimated_price)));

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 bg-cover bg-center text-slate-100" style={{ backgroundImage: "url('/pc-wall.png')" }}>
        <div className="mx-auto max-w-6xl px-4 py-16 text-slate-300">Loading PC…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-slate-950 bg-cover bg-center text-slate-100 pb-20" style={{ backgroundImage: "url('/pc-wall.png')" }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <EmailVerificationNotice needsVerification={needsEmailVerification} email={(user as any)?.email} />
        <div className="flex items-end justify-between gap-4">
          <div>
            <CardCatLogo />
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              <span>⭐</span>
              <span>PC</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Personal Collection Shelf</h1>
            <p className="mt-2 text-slate-300">Starred cards live here. Tap to view, drag to reorder (where supported).</p>
            <a
              href="/catalog"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
            >
              ← Catalog
            </a>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-400">
              {totalPcCards} card{totalPcCards === 1 ? "" : "s"}
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-slate-400">Estimated PC value</div>
              <div className="mt-1 text-lg font-bold text-white">{hasAnyEstimatedValue ? formatDollars(totalPcEstimatedValue) : "—"}</div>
            </div>
            {savingOrder ? <div className="mt-1 text-xs text-amber-200">Saving order…</div> : null}
          </div>
        </div>

        {pcCards.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-lg font-semibold text-white">Your PC shelf is empty</div>
            <div className="mt-2 text-sm text-slate-300">Go to Catalog and “Star in PC” to add cards.</div>
          </div>
        ) : (
          <>
            {/* Mobile: 4-up grid */}
            <section className="mt-6 lg:hidden">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-sm font-semibold text-slate-200">PC Shelf</div>

                <div className="grid grid-cols-4 gap-2" role="list" aria-label="PC grid">
                  {pcCards.map((c) => {
                    const src = c.image_url ? driveToImageSrc(c.image_url) : "";

                    return (
                      <div
                        key={c.id}
                        role="listitem"
                        className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-0"
                        draggable
                        onDragStart={(e) => {
                          if (!c.id) return;
                          setDraggingId(c.id);
                          setDragOverId(c.id);
                          setDragInsertBefore(true);
                          try {
                            e.dataTransfer.setData("text/plain", c.id);
                          } catch {
                            // ignore
                          }
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (!c.id) return;
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                          setDragOverId(c.id);
                          setDragInsertBefore(e.clientY < rect.top + rect.height / 2);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!c.id) return;
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                          const insertBefore = e.clientY < rect.top + rect.height / 2;
                          onDropReorder(c.id, insertBefore);
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setImageModal({ card: c, src, backSrc: c.back_image_url ? driveToImageSrc(c.back_image_url) : undefined })}
                          className="block w-full"
                          aria-label={`View ${c.player_name}`}
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-950">
                            {c.image_url ? (
                              <img alt="front" src={src} className="h-full w-full object-contain" />
                            ) : (
                              <div className="h-full w-full" />
                            )}
                          </div>
                        </button>

                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Desktop: shelf + drag reorder */}
            <section className="hidden lg:block mt-8">
              <div className="rounded-[28px] bg-white/[0.03] p-5">
                <div className="rounded-[20px] bg-slate-900/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-200">Display</div>
                    <div className="text-xs text-slate-400">Drag to reorder</div>
                  </div>

                  <div
                    className="relative mt-4 grid grid-cols-5 gap-4 overflow-visible rounded-[18px] bg-gradient-to-b from-amber-500/10 via-slate-950/10 to-slate-950/25 px-4 pb-10"
                    role="list"
                    aria-label="PC shelf"
                  >
                    <div className="pointer-events-none absolute inset-0 -z-10 rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.32),transparent_58%)]" />
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 -z-10 h-4 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-[0.5px]" />

                    {displayedCards.map((c, idx) => {
                      const isDragging = draggingId && c.id === draggingId;
                      const isOver = dragOverId && c.id === dragOverId;

                      const cardTransform = undefined;

                      const insertionClass = isOver && draggingId ? "ring-2 ring-amber-400/70" : "";

                      return (
                        <div
                          key={c.id}
                          role="listitem"
                          draggable
                          onDragStart={(e) => {
                            if (!c.id) return;
                            setDraggingId(c.id);
                            setDragOverId(c.id);
                            setDragInsertBefore(true);
                            try {
                              e.dataTransfer.setData("text/plain", c.id);
                            } catch {
                              // ignore
                            }
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          style={cardTransform ? { transform: cardTransform } : undefined}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!c.id) return;
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            setDragOverId(c.id);
                            setDragInsertBefore(e.clientY < rect.top + rect.height / 2);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!c.id) return;
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const insertBefore = e.clientY < rect.top + rect.height / 2;
                            onDropReorder(c.id, insertBefore);
                          }}
                          className={
                            "relative z-10 w-full rounded-2xl bg-slate-900/20 p-3 transition shadow-[0_18px_60px_rgba(0,0,0,0.45)] hover:shadow-[0_28px_90px_rgba(0,0,0,0.65)] " +
                            (isDragging
                              ? "bg-amber-500/10 opacity-70"
                              : isOver
                                ? "bg-amber-500/8"
                                : "bg-slate-900/20 hover:bg-slate-900/25") +
                            " " + insertionClass
                          }
                        >
                          <div className="relative">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (!c.image_url) return;
                                setImageModal({
                                  card: c,
                                  src: driveToImageSrc(c.image_url),
                                  backSrc: c.back_image_url ? driveToImageSrc(c.back_image_url) : undefined,
                                });
                              }}
                              className="cursor-pointer"
                            >
                              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950/10">
                                {c.image_url ? (
                                  <img alt="front" src={driveToImageSrc(c.image_url)} className="h-full w-full object-contain" />
                                ) : (
                                  <div className="h-full w-full" />
                                )}
                              </div>
                            </div>

                          </div>

                          <div className="mt-3 text-center">
                            <div className="line-clamp-2 text-sm font-semibold text-white">{c.player_name}</div>
                            <div className="mt-1 text-xs text-slate-300">
                              {c.year} · {c.brand}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {c.set_name} · #{c.card_number || "n/a"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <CardCatMobileNav />

      {imageModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setImageModal(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">PC</div>
                <div className="mt-2 text-lg font-bold text-white">{imageModal.card.player_name}</div>
                <div className="mt-1 text-sm text-slate-300">
                  {imageModal.card.year} · {imageModal.card.brand} · {imageModal.card.set_name}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                onClick={() => setImageModal(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              className="relative mt-4 h-[60vh] max-h-[560px] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
              role={imageModal.backSrc ? "button" : undefined}
              tabIndex={imageModal.backSrc ? 0 : undefined}
              onClick={() => {
                if (!imageModal.backSrc || isFlipping) return;
                setIsFlipping(true);
                setShowBack((v) => !v);
                window.setTimeout(() => setIsFlipping(false), 520);
              }}
              onKeyDown={(e) => {
                if (!imageModal.backSrc || isFlipping) return;
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setIsFlipping(true);
                setShowBack((v) => !v);
                window.setTimeout(() => setIsFlipping(false), 520);
              }}
            >
              {imageModal.backSrc ? (
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
                  <img
                    alt="front"
                    src={imageModal.src}
                    className="absolute inset-0 h-full w-full object-contain"
                    style={{ backfaceVisibility: "hidden" }}
                    draggable={false}
                  />
                  {imageModal.backSrc ? (
                    <img
                      alt="back"
                      src={imageModal.backSrc}
                      className="absolute inset-0 h-full w-full object-contain"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      draggable={false}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 text-sm">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-slate-200 hover:bg-white/[0.08]"
                onClick={() => setShareCard(imageModal.card)}
              >
                Share
              </button>

              <a
                href={buildEbaySearchUrl(imageModal.card)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-slate-200 hover:bg-white/[0.08]"
              >
                Check Comps ↗
              </a>

              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Card details</div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Player</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.player_name}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, player_name: e.target.value }))}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Year</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.year}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, year: e.target.value }))}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Brand</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.brand}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, brand: e.target.value }))}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Set</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.set_name}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, set_name: e.target.value }))}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Parallel</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.parallel}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, parallel: e.target.value }))}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Card #</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.card_number}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, card_number: e.target.value }))}
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <div className="mb-1 text-xs font-semibold text-slate-300">Serial</div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={cardDetailsDraft.serial_number_text}
                      onChange={(e) => setCardDetailsDraft((p) => ({ ...p, serial_number_text: e.target.value }))}
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={updateCardDetails}
                    disabled={cardDetailsSaving}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    {cardDetailsSaving ? "Saving…" : "Save details"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Estimated price</div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                    <span className="text-slate-300">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className="w-28 bg-transparent text-sm text-white outline-none"
                      value={estimateDraft}
                      onChange={(e) => setEstimateDraft(e.target.value)}
                      placeholder="0.00"
                      aria-label="Estimated price"
                    />
                  </div>

                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08] disabled:opacity-60"
                    onClick={() => updateEstimatedPrice()}
                    disabled={estimateSaving}
                  >
                    {estimateSaving ? "Updating…" : "Update"}
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] disabled:opacity-60"
                    onClick={() => setEstimateDraft("")}
                    disabled={estimateSaving}
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-400">Used in the PC total value at the top of the page.</div>
              </div>

              <button
                type="button"
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15"
                onClick={() => {
                  const ok = confirm("Remove this card from PC?");
                  if (!ok) return;
                  removeFromPc(imageModal.card);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shareCard ? <CatalogShareModal card={shareCard} onClose={() => setShareCard(null)} /> : null}

      {statusToast ? (
        <div className="pointer-events-none fixed left-0 right-0 top-4 z-50 flex justify-center px-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-2 text-sm text-slate-200 shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
            {statusToast}
          </div>
        </div>
      ) : null}
    </main>
  );
}
