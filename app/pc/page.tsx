"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import CardCatMobileNav from "@/components/CardCatMobileNav";

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

function driveToImageSrc(url?: string) {
  const u = (url || "").trim();
  const m = u.match(/\/d\/([^/]+)\/view/);
  if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return u;
}

export default function PcPage() {
  const { user, loading } = useSupabaseUser();

  const [pcCards, setPcCards] = useState<Card[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Desktop drag-to-reorder
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragInsertBefore, setDragInsertBefore] = useState(true);

  // Image modal (mobile + desktop)
  const [imageModal, setImageModal] = useState<{ card: Card; src: string } | null>(null);

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

    const next = base.slice();
    const [moved] = next.splice(fromIndex, 1);

    const targetIndex = toIndex + (insertBefore ? 0 : 1);
    const insertAt = fromIndex < toIndex ? targetIndex - 1 : targetIndex;

    next.splice(insertAt, 0, moved);
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
    setPcCards((prev) => prev.filter((c) => c.id !== card.id));
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-16 text-slate-300">Loading PC…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-slate-950 text-slate-100 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              <span>⭐</span>
              <span>PC</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Personal Collection Shelf</h1>
            <p className="mt-2 text-slate-300">Starred cards live here. Tap to view, drag to reorder (desktop).</p>
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
                        className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-1"
                      >
                        <button
                          type="button"
                          onClick={() => setImageModal({ card: c, src })}
                          className="block w-full"
                          aria-label={`View ${c.player_name}`}
                        >
                          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-950">
                            {c.image_url ? (
                              <img alt="front" src={src} className="h-full w-full object-contain" />
                            ) : (
                              <div className="h-full w-full" />
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPc(c);
                          }}
                          className="absolute bottom-2 right-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/15"
                          aria-label="Remove from PC"
                          title="Remove from PC"
                        >
                          ★
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Desktop: shelf + drag reorder */}
            <section className="hidden lg:block mt-8">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="rounded-[20px] border border-white/10 bg-slate-900/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-200">Display</div>
                    <div className="text-xs text-slate-400">Drag to reorder</div>
                  </div>

                  <div
                    className="relative mt-4 flex gap-4 overflow-x-auto rounded-[18px] bg-gradient-to-b from-amber-500/10 via-slate-950/10 to-slate-950/25 px-4 pb-10"
                    role="list"
                    aria-label="PC shelf"
                  >
                    <div className="pointer-events-none absolute inset-0 -z-10 rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.32),transparent_58%)]" />
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 -z-10 h-4 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-[0.5px]" />

                    {displayedCards.map((c, idx) => {
                      const isDragging = draggingId && c.id === draggingId;
                      const isOver = dragOverId && c.id === dragOverId;

                      const center = (displayedCards.length - 1) / 2;
                      const offset = idx - center;
                      const rotateY = Math.max(-20, Math.min(20, -offset * 9));
                      const rotateZ = offset * 0.55;
                      const translateY = Math.abs(offset) * 3.2;

                      const cardTransform = isDragging
                        ? undefined
                        : `perspective(900px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateY(${translateY}px)`;

                      const insertionClass = isOver && draggingId ? (dragInsertBefore ? "border-l-4 border-amber-400" : "border-r-4 border-amber-400") : "";

                      return (
                        <div
                          key={c.id}
                          role="listitem"
                          draggable
                          style={cardTransform ? { transform: cardTransform } : undefined}
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
                            setDragInsertBefore(e.clientX < rect.left + rect.width / 2);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!c.id) return;
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const insertBefore = e.clientX < rect.left + rect.width / 2;
                            onDropReorder(c.id, insertBefore);
                          }}
                          className={
                            "relative z-10 w-56 shrink-0 rounded-2xl border bg-slate-900/40 p-3 transition will-change-transform shadow-[0_18px_60px_rgba(0,0,0,0.45)] hover:shadow-[0_28px_90px_rgba(0,0,0,0.65)] " +
                            (isDragging
                              ? "border-amber-500/60 bg-amber-500/10 opacity-70"
                              : isOver
                                ? "border-amber-500/30 bg-amber-500/8"
                                : "border-slate-800/90 hover:border-white/20") +
                            " " + insertionClass
                          }
                        >
                          <div className="relative">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (!c.image_url) return;
                                setImageModal({ card: c, src: driveToImageSrc(c.image_url) });
                              }}
                              className="cursor-pointer"
                            >
                              <div className="aspect-[3/2] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                                {c.image_url ? (
                                  <img alt="front" src={driveToImageSrc(c.image_url)} className="h-full w-full object-contain" />
                                ) : (
                                  <div className="h-full w-full" />
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromPc(c);
                              }}
                              className="absolute bottom-2 right-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/15"
                              aria-label="Remove from PC"
                              title="Remove from PC"
                            >
                              ★
                            </button>
                          </div>

                          <div className="mt-3">
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
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
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

            <div className="mt-4 aspect-[3/2] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <img alt="front" src={imageModal.src} className="h-full w-full object-contain" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200">
                Qty {imageModal.card.quantity}
              </div>
              {imageModal.card.card_number ? (
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200">
                  #{imageModal.card.card_number}
                </div>
              ) : null}
              <button
                type="button"
                className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200 hover:bg-red-500/15"
                onClick={() => removeFromPc(imageModal.card)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
