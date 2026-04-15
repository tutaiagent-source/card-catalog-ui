"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  const persistOrder = async (next: Card[]) => {
    if (!supabaseConfigured || !supabase) return;
    const sb = supabase;
    if (!user?.id) return;

    setSavingOrder(true);
    try {
      const updates = next.map((c, i) => {
        if (!c.id) return Promise.resolve(null);
        return sb
          .from("cards")
          .update({ pc_position: (i + 1) * 1000 })
          .eq("id", c.id)
          .eq("user_id", user.id);
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

  const onDropReorder = async (overId: string) => {
    if (!draggingId || draggingId === overId) return;

    const fromIndex = pcCards.findIndex((c) => c.id === draggingId);
    const toIndex = pcCards.findIndex((c) => c.id === overId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = pcCards.slice();
    const [moved] = next.splice(fromIndex, 1);
    const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
    next.splice(insertAt, 0, moved);

    setDragOverId(null);
    setDraggingId(null);

    const name = moved?.player_name ?? "Card";
    await persistOrder(next);
    setStatusToast(`Reordered: ${name}`);
  };

  const totalPcCards = useMemo(() => pcCards.length, [pcCards]);

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
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Personal Collection shelf</h1>
            <p className="mt-2 text-slate-300">Starred cards live here. Drag to reorder.</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-400">{totalPcCards} card{totalPcCards === 1 ? "" : "s"}</div>
            {savingOrder ? <div className="mt-1 text-xs text-amber-200">Saving order…</div> : null}
          </div>
        </div>

        {pcCards.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-lg font-semibold text-white">Your PC shelf is empty</div>
            <div className="mt-2 text-sm text-slate-300">Go to Catalog and “Star in PC” to add cards.</div>
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="rounded-[20px] border border-white/10 bg-slate-900/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-slate-200">Display</div>
                <div className="text-xs text-slate-400">Drag cards to reorder</div>
              </div>

              <div
                className="mt-4 flex gap-4 overflow-x-auto pb-3"
                role="list"
                aria-label="PC shelf"
              >
                {pcCards.map((c) => {
                  const isDragging = draggingId && c.id === draggingId;
                  const isOver = dragOverId && c.id === dragOverId;

                  return (
                    <div
                      key={c.id}
                      role="listitem"
                      draggable
                      onDragStart={(e) => {
                        if (!c.id) return;
                        setDraggingId(c.id);
                        setDragOverId(c.id);
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
                        setDragOverId(c.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!c.id) return;
                        onDropReorder(c.id);
                      }}
                      className={
                        "w-56 shrink-0 rounded-2xl border bg-slate-900/40 p-3 transition " +
                        (isDragging
                          ? "border-amber-500/60 bg-amber-500/10 opacity-70"
                          : isOver
                            ? "border-amber-500/40 bg-amber-500/8"
                            : "border-slate-800/90 hover:border-white/20")
                      }
                    >
                      <div className="relative">
                        <div className="aspect-[3/2] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                          {c.image_url ? (
                            <img
                              alt="front"
                              src={driveToImageSrc(c.image_url)}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromPc(c)}
                          className="absolute right-2 top-2 rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-200 hover:bg-slate-950/90"
                          aria-label="Remove from PC"
                          title="Remove from PC"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-3">
                        <div className="line-clamp-2 text-sm font-semibold text-white">{c.player_name}</div>
                        <div className="mt-1 text-xs text-slate-300">
                          {c.year} · {c.brand}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{c.set_name} · #{c.card_number || "n/a"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <CardCatMobileNav />

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
