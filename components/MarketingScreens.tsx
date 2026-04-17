"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { driveToImageSrc } from "@/lib/googleDrive";

function ScreenFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-slate-950/80 p-3 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
      <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">{title}</div>
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function CatalogShowcase() {
  const { user } = useSupabaseUser();
  const [heroSrc, setHeroSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    if (!supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("image_url")
        .eq("user_id", user.id)
        .order("date_added", { ascending: false })
        .limit(20);

      if (error) return;
      const first = (data ?? []).find((c) => c.image_url);
      if (!first?.image_url) return;

      setHeroSrc(driveToImageSrc(String(first.image_url)));
    })();
  }, [user?.id]);

  return (
    <ScreenFrame title="Catalog" subtitle="A Fast, Clean View Of The Collection">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Collection Summary</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["Collection", "148"],
                ["Listed", "23"],
                ["Sold", "41"],
                ["Sports", "5"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Search, Filter, Browse, And Batch Actions Stay Tight And Easy To Reach.
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              "Browse",
              "Grid",
              "Football",
              "Listed",
            ].map((chip, i) => (
              <div
                key={chip}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i === 0 ? "bg-white/[0.08] text-white" : "border border-white/10 bg-slate-950/70 text-slate-300"}`}
              >
                {chip}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_12px_30px_rgba(2,6,23,0.35)]">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-[linear-gradient(160deg,rgba(213,0,0,0.18),rgba(15,23,42,0.2))]">
                {heroSrc ? (
                  <img src={heroSrc} alt="Card preview" className="h-full w-full object-contain" />
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-200">
                  Listed
                </div>
                <div className="text-sm font-semibold text-white">$65.00</div>
              </div>
              <div className="mt-3 text-xl font-semibold text-white">Tom Brady</div>
              <div className="mt-1 text-sm text-slate-400">2020 Prizm · #17</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200">
                  Edit Card
                </div>
                <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                  Check Recent Sold On eBay ↗
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

export function ImportShowcase() {
  return (
    <ScreenFrame title="Import" subtitle="Guided CSV Review Before Anything Gets Saved">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3">
          {[
            ["Create", "42 Rows"],
            ["Possible Duplicates", "6 Rows"],
            ["Needs Attention", "3 Rows"],
            ["Skipped", "1 Row"],
          ].map(([label, value], i) => (
            <div key={label} className={`rounded-2xl border p-4 ${i === 0 ? "border-emerald-500/25 bg-emerald-500/[0.08]" : "border-white/10 bg-white/[0.04]"}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
              <div className="mt-2 text-2xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-white">2024-football-import.csv</div>
              <div className="text-xs text-slate-400">54 Rows Ready For Review</div>
            </div>
            <div className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white">Choose File</div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              ["Row 7", "Possible Duplicate Match Found", "Review Match"],
              ["Row 12", "Missing Team Field", "Fix Above"],
              ["Row 14", "Needs Competition Value", "Create Anyway"],
            ].map(([row, issue, action]) => (
              <div key={row} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{row}</div>
                    <div className="mt-1 text-sm text-slate-400">{issue}</div>
                  </div>
                  <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                    {action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

export function SoldShowcase() {
  return (
    <ScreenFrame title="Sold" subtitle="Clear Sales History With Room For Deeper Insights">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.15))] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Revenue Pulse</div>
          <div className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">$3,482</div>
          <div className="mt-2 text-sm text-emerald-100/80">Gross Sales Across 41 Sold Cards</div>
          <div className="mt-5 space-y-3">
            {[
              ["Last 30d", "$842"],
              ["Avg Sale", "$84.92"],
              ["High Sale", "$210.00"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">{label}</div>
                <div className="text-xl font-semibold text-white sm:text-2xl">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {[
            ["Recent Sale", "2022 Prizm Messi", "$210.00"],
            ["Recent Sale", "2023 Select Stroud", "$145.00"],
            ["Recent Sale", "2020 Prizm Brady", "$90.00"],
          ].map(([label, card, price]) => (
            <div key={card} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{card}</div>
                </div>
                <div className="text-lg font-semibold text-emerald-300">{price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}

export function PcShowcase() {
  const { user } = useSupabaseUser();
  const [cards, setCards] = useState<Array<{ id: string; player_name: string; image_url: string | null }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    if (!supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("id,player_name,image_url")
        .eq("user_id", user.id)
        .order("date_added", { ascending: false })
        .limit(12);

      if (error) return;

      const next = (data ?? [])
        .filter((c) => c.image_url)
        .map((c) => ({ id: String(c.id), player_name: String(c.player_name || ""), image_url: String(c.image_url || "") }));

      setCards(next);
    })();
  }, [user?.id]);

  const placeholders = ["Jordan", "Brady", "Messi", "Wemby"];

  return (
    <ScreenFrame title="Personal Collection" subtitle="A Dedicated View For The Cards That Stay Close">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => {
          const card = cards[i];
          const name = card?.player_name || placeholders[i];
          const src = card?.image_url ? driveToImageSrc(card.image_url) : null;

          return (
            <div key={card?.id || name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
              {src ? (
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-950/20">
                  <img alt={name} src={src} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div
                  className={`aspect-[4/5] rounded-2xl ${i % 2 === 0 ? "bg-[linear-gradient(160deg,rgba(59,130,246,0.22),rgba(15,23,42,0.2))]" : "bg-[linear-gradient(160deg,rgba(245,158,11,0.2),rgba(15,23,42,0.2))]"}`}
                />
              )}

              <div className="mt-3 text-center text-sm font-semibold text-white">{name}</div>
              <div className="mt-1 text-center text-xs text-slate-400">Tap For Details, Keep The Full Catalog Separate</div>
            </div>
          );
        })}
      </div>
    </ScreenFrame>
  );
}
