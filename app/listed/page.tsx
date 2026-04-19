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
  listed_at?: string;
  sale_platform?: string | null;
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

export default function ListedPage() {
  const { user, loading } = useSupabaseUser();
  const needsEmailVerification = !!user && !(user as any)?.email_confirmed_at;

  const [cards, setCards] = useState<ListedCard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeCard, setActiveCard] = useState<ListedCard | null>(null);
  const [showBack, setShowBack] = useState(false);

  const [editLink, setEditLink] = useState<string>("");
  const [isSavingLink, setIsSavingLink] = useState(false);

  const [shareCard, setShareCard] = useState<any | null>(null);

  const sortedCards = useMemo(() => {
    return cards
      .slice()
      .sort((a, b) => String(b.listed_at || "").localeCompare(String(a.listed_at || "")));
  }, [cards]);

  async function loadListedCards() {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("id, player_name, year, brand, set_name, parallel, serial_number_text, image_url, back_image_url, status, asking_price, listed_at, sale_platform")
        .eq("user_id", user.id)
        .eq("status", "Listed");

      if (error) {
        console.error("Failed to fetch listed cards:", error);
        return;
      }

      setCards(((data ?? []) as ListedCard[]).map((c) => ({ ...c, status: "Listed" })));
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
  }, [activeCard]);

  async function saveSalePlatform() {
    if (!user?.id || !supabaseConfigured || !supabase || !activeCard?.id) return;

    setIsSavingLink(true);
    try {
      const value = editLink.trim() ? editLink.trim() : null;
      const { error } = await supabase
        .from("cards")
        .update({ sale_platform: value })
        .eq("id", activeCard.id)
        .eq("user_id", user.id);

      if (error) {
        alert("Could not save the listing link.");
        console.error(error);
        return;
      }

      setCards((prev) =>
        prev.map((c) => (c.id === activeCard.id ? { ...c, sale_platform: value } : c))
      );

      setActiveCard((prev) => (prev ? { ...prev, sale_platform: value } : prev));
    } finally {
      setIsSavingLink(false);
    }
  }

  const activeHref = toUrl(activeCard?.sale_platform);

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
            <p className="mt-2 text-slate-300">Tap a card to set (or update) the sale link where you’re selling it.</p>
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
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="listitem"
                        onClick={() => setActiveCard(c)}
                        className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-0"
                        aria-label={`View ${c.player_name}`}
                      >
                        <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-950">
                          {c.image_url ? <img alt="front" src={src} className="h-full w-full object-contain" /> : <div className="h-full w-full" />}
                        </div>

                        {c.asking_price != null ? (
                          <div className="absolute left-2 top-2 z-10 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold text-slate-100 ring-1 ring-white/10">
                            {formatMoney(Number(c.asking_price))}
                          </div>
                        ) : null}

                        {c.back_image_url ? (
                          <div className="absolute right-2 top-2 z-10 rounded-full bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200 ring-1 ring-white/10">
                            ⇄
                          </div>
                        ) : null}
                      </button>
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
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setActiveCard(c)}
                          className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-3 hover:bg-slate-950/55"
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950">
                            {c.image_url ? <img alt="front" src={src} className="h-full w-full object-contain" /> : <div className="h-full w-full" />}
                          </div>
                          {c.asking_price != null ? (
                            <div className="mt-3 text-center text-sm font-semibold text-slate-100">{formatMoney(Number(c.asking_price))}</div>
                          ) : (
                            <div className="mt-3 text-center text-sm font-semibold text-slate-500">No price</div>
                          )}
                        </button>
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
              className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Listed card</div>
                  <div className="mt-2 text-xl font-bold text-white">
                    {[activeCard.year, activeCard.player_name].filter(Boolean).join(" ")}
                  </div>
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
                    {activeCard.back_image_url ? (
                      <button
                        type="button"
                        onClick={() => setShowBack((v) => !v)}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                      >
                        {showBack ? "Show front" : "Show back"}
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-950">
                      {showBack && activeCard.back_image_url ? (
                        <img
                          alt="back"
                          src={driveToImageSrc(activeCard.back_image_url)}
                          className="h-full w-full object-contain"
                        />
                      ) : activeCard.image_url ? (
                        <img
                          alt="front"
                          src={driveToImageSrc(activeCard.image_url)}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
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
                    {activeCard.listed_at ? (
                      <div>
                        <span className="text-slate-400">Listed:</span> <span className="text-white">{String(activeCard.listed_at)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-slate-200">Listing details</div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Asking price</div>
                      <div className="mt-2 text-2xl font-black text-white">
                        {activeCard.asking_price != null ? formatMoney(Number(activeCard.asking_price)) : "—"}
                      </div>
                    </div>

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
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={saveSalePlatform}
                        disabled={isSavingLink}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        {isSavingLink ? "Saving…" : "Save link"}
                      </button>
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
      </div>
    </main>
  );
}
