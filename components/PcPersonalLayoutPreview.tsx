"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { driveToImageSrc } from "@/lib/googleDrive";

type PcCard = {
  id?: string;

  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  card_number: string;

  image_url?: string;
  back_image_url?: string;

  pc_position?: number | null;
};

export default function PcPersonalLayoutPreview() {
  const { user, loading } = useSupabaseUser();

  const [pcCards, setPcCards] = useState<PcCard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    setIsRefreshing(true);
    (async () => {
      const { data, error } = await supabase.from("cards").select("id, player_name, year, brand, set_name, card_number, image_url, back_image_url, pc_position").eq("user_id", user.id);
      if (error) {
        console.error("Failed to fetch PC cards:", error);
        return;
      }

      const all = (data ?? []) as PcCard[];
      const next = all
        .filter((c) => c.pc_position != null)
        .slice()
        .sort((a, b) => Number(a.pc_position ?? 0) - Number(b.pc_position ?? 0));

      setPcCards(next);
    })()
      .finally(() => setIsRefreshing(false));
  }, [user?.id]);

  if (!user) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#020617] p-5">
        <div className="text-sm font-semibold text-slate-200">Sign in to preview your PC shelf</div>
        <div className="mt-2 text-sm text-slate-300">This guide can show your actual PC layout once you’re logged in.</div>

        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/30 p-3">
              <div className="aspect-[2/3] rounded-xl bg-slate-950/20" />
              <div className="mt-3 h-4 w-[70%] rounded bg-white/10" />
              <div className="mt-2 h-3 w-[55%] rounded bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading || isRefreshing) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#020617] p-6">
        <div className="text-sm font-semibold text-slate-200">Loading your PC…</div>
        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/30 p-3">
              <div className="aspect-[2/3] rounded-xl bg-white/5" />
              <div className="mt-3 h-4 w-[70%] rounded bg-white/10" />
              <div className="mt-2 h-3 w-[55%] rounded bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pcCards.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
        <div className="text-lg font-semibold text-white">Your PC shelf is empty</div>
        <div className="mt-2 text-sm text-slate-300">Star cards in Catalog (★) to see them show up here.</div>
      </div>
    );
  }

  const displayCards = pcCards.slice(0, 10);

  return (
    <div className="rounded-[28px] bg-white/[0.03] p-5">
      <div className="rounded-[20px] bg-slate-900/30 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">PC Shelf Preview</div>
            <div className="mt-1 text-xs text-slate-400">
              Ordered by your PC ★ ranking
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-400">
            {pcCards.length} card{pcCards.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Mobile: 4-up grid */}
        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/40 p-3 lg:hidden">
          <div className="mb-3 text-sm font-semibold text-slate-200">PC Shelf</div>
          <div className="grid grid-cols-4 gap-2" role="list" aria-label="PC grid preview">
            {displayCards.slice(0, 8).map((c) => (
              <div
                key={c.id}
                role="listitem"
                className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-0"
              >
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-950">
                  {c.image_url ? (
                    <img alt={c.player_name} src={driveToImageSrc(c.image_url, { variant: "grid" })} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>

                <div className="absolute left-2 top-2 rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-slate-100 ring-1 ring-white/10">
                  #{String(c.pc_position ?? "")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: shelf grid */}
        <div
          className="relative mt-4 hidden lg:grid grid-cols-5 gap-4 overflow-visible rounded-[18px] bg-gradient-to-b from-amber-500/10 via-slate-950/10 to-slate-950/25 px-4 pb-10"
          role="list"
          aria-label="PC shelf preview"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.32),transparent_58%)]" />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 -z-10 h-4 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-[0.5px]" />

          {displayCards.map((c) => (
            <div
              key={c.id}
              role="listitem"
              className="relative z-10 w-full rounded-2xl bg-slate-900/20 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950/10">
                {c.image_url ? (
                  <img alt={c.player_name} src={driveToImageSrc(c.image_url, { variant: "grid" })} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                ) : (
                  <div className="h-full w-full" />
                )}
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
          ))}
        </div>
      </div>
    </div>
  );
}
