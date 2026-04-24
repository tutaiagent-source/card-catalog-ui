"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CardCatLogo from "@/components/CardCatLogo";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import UsernamePromptBanner from "@/components/UsernamePromptBanner";
import { driveToImageSrc } from "@/lib/googleDrive";
import { startDirectConversation } from "@/lib/messaging";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

type YesNo = "yes" | "no";

type MarketCard = {
  id?: string;
  user_id: string;
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
  graded?: YesNo | string | null;
  grade?: number | null;
  grading_company?: string | null;
  auto_grade?: number | null;
  grading_cert_number_text?: string | null;
  image_url?: string;
  back_image_url?: string;
  asking_price?: number | null;
  listed_at?: string | null;
  sale_platform?: string | null;
  public_market_visible?: boolean;
};

type SellerProfile = {
  id: string;
  username: string;
  market_visibility_mode?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function buildEbaySearchUrl(card: MarketCard) {
  const serialRaw = String(card.serial_number_text ?? "").trim();
  const slashIdx = serialRaw.indexOf("/");
  const serialForEbay = slashIdx >= 0 ? serialRaw.slice(slashIdx) : serialRaw;

  const parts = [card.player_name, card.brand, card.set_name, card.parallel, card.card_number, serialForEbay]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .filter((part) => part.toLowerCase() !== "n/a");

  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(parts.join(" "))}&LH_Sold=1&LH_Complete=1`;
}

function toUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(raw)) return `https://${raw}`;
  return null;
}

function yes(value?: string | null) {
  return String(value || "").toLowerCase() === "yes";
}

export default function MarketPage() {
  const { user, loading } = useSupabaseUser();
  const needsEmailVerification = !!user && !(user as any)?.email_confirmed_at;

  const [cards, setCards] = useState<MarketCard[]>([]);
  const [profiles, setProfiles] = useState<SellerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [activeCard, setActiveCard] = useState<MarketCard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [loadingCards, setLoadingCards] = useState(false);
  const [messageStarting, setMessageStarting] = useState(false);
  const [error, setError] = useState("");

  const zoomContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowBack(false);
    setZoomEnabled(false);
  }, [activeCard?.id]);

  useEffect(() => {
    setZoomEnabled(false);
  }, [showBack]);

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    (async () => {
      setLoadingCards(true);
      setError("");

      const { data: cardRows, error: cardError } = await supabase
        .from("cards")
        .select("id, user_id, player_name, year, brand, set_name, parallel, card_number, team, sport, competition, rookie, is_autograph, has_memorabilia, serial_number_text, graded, grade, grading_company, auto_grade, grading_cert_number_text, image_url, back_image_url, asking_price, listed_at, sale_platform, public_market_visible")
        .eq("status", "Listed")
        .order("listed_at", { ascending: false });

      if (cardError) {
        setError(cardError.message);
        setLoadingCards(false);
        return;
      }

      const nextCards = (cardRows ?? []) as MarketCard[];
      setCards(nextCards);

      const sellerIds = Array.from(new Set(nextCards.map((card) => String(card.user_id || "")).filter(Boolean)));
      if (sellerIds.length === 0) {
        setProfiles([]);
        setLoadingCards(false);
        return;
      }

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, market_visibility_mode")
        .in("id", sellerIds);

      if (profileError) {
        setError(profileError.message);
        setLoadingCards(false);
        return;
      }

      setProfiles((profileRows ?? []) as SellerProfile[]);
      setLoadingCards(false);
    })();
  }, [user?.id]);

  const sellerMap = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile.username])), [profiles]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sellerQ = sellerFilter.trim().toLowerCase();

    return cards.filter((card) => {
      const seller = profiles.find((profile) => profile.id === card.user_id);
      const sellerUsername = String(seller?.username || "").toLowerCase();
      const marketMode = String(seller?.market_visibility_mode || "none").toLowerCase();
      const visibleInMarket = marketMode === "all_listed" || marketMode === "whole_collection" || (marketMode === "selected_cards" && Boolean(card.public_market_visible));
      if (!visibleInMarket) return false;

      const matchesSeller = !sellerQ || sellerUsername === sellerQ;
      if (!matchesSeller) return false;
      if (!q) return true;

      const haystack = [
        card.player_name,
        card.year,
        card.brand,
        card.set_name,
        card.parallel,
        card.team,
        card.sport,
        card.competition,
        sellerUsername,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [cards, searchQuery, sellerFilter, sellerMap, profiles]);

  async function handleMessageSeller(card: MarketCard) {
    const sellerUsername = String(sellerMap.get(card.user_id) || "").trim();
    if (!sellerUsername || !user?.id) return;

    if (!card.id) {
      setError("Could not message this listing (missing card id). Try refreshing.");
      return;
    }

    setMessageStarting(true);
    setError("");

    try {
      const prefill = `Hey, I'm interested in your ${[card.year, card.player_name, card.brand, card.set_name].filter(Boolean).join(" ")}. Is it still available?`;
      const conversationId = await startDirectConversation(sellerUsername, undefined, card.id);
      window.location.href = `/messages?conversation=${encodeURIComponent(conversationId)}&prefill=${encodeURIComponent(prefill)}`;
    } catch (err: any) {
      setError(err?.message || "Could not start a conversation.");
      setMessageStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 text-slate-300">Loading market...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign In Required</h1>
          <p className="mt-3 text-slate-300">Please sign in to browse the market.</p>
          <a href="/login" className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <EmailVerificationNotice needsVerification={needsEmailVerification} email={(user as any)?.email} />
        <UsernamePromptBanner userId={user?.id} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardCatLogo />
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Market</h1>
            <div className="mt-2 text-sm text-slate-400">Member-Only Market Feed: browse active listings from other CardCat members, then message sellers directly from the card.</div>
          </div>
          <div className="flex gap-3">
            <a href="/listed" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">Listings</a>
            <a href="/messages" className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]">Messages</a>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <section className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Market Spotlight</div>
              <h2 className="mt-2 text-xl font-bold text-white">How It Works</h2>
              <p className="mt-1 text-sm text-emerald-100/90">
                Listings posted to Market appear here. Tap <span className="font-semibold">Message seller</span> to start a listing-initiated thread, then use Messages to manage what you sent and what you received.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-emerald-100/90">
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2">
                <span aria-hidden="true">✅</span> Posted listings show up instantly
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2">
                <span aria-hidden="true">💬</span> Message sellers from the card
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-200">Active Market Listings</div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player, brand, team, seller"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none sm:w-80"
              />
              {sellerFilter ? (
                <button
                  type="button"
                  onClick={() => setSellerFilter("")}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                >
                  Clear seller filter
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">{sellerFilter ? `Showing cards from @${sellerFilter}` : `${filteredCards.length} card${filteredCards.length === 1 ? "" : "s"}`}</div>

          {loadingCards ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">Loading public listings…</div>
          ) : filteredCards.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">No public listings match that search yet.</div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {filteredCards.map((card) => {
                const sellerUsername = String(sellerMap.get(card.user_id) || "").trim();
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveCard(card)}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-left hover:bg-slate-950/60"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950">
                      {card.image_url ? <img alt={card.player_name} src={driveToImageSrc(card.image_url)} className="h-full w-full object-contain" /> : <div className="h-full w-full" />}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-white line-clamp-2">{card.player_name}</div>
                    <div className="mt-1 text-xs text-slate-400 line-clamp-2">{[card.year, card.brand, card.set_name].filter(Boolean).join(" · ")}</div>
                    {sellerUsername ? <div className="mt-1 text-xs text-emerald-200">@{sellerUsername}</div> : null}
                    {card.asking_price != null ? <div className="mt-2 text-sm font-semibold text-slate-100">{formatMoney(Number(card.asking_price))}</div> : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {activeCard ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4" onClick={() => setActiveCard(null)}>
            <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl [-webkit-overflow-scrolling:touch]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Market listing</div>
                  <div className="mt-2 text-xl font-bold text-white">{[activeCard.year, activeCard.player_name].filter(Boolean).join(" ")}</div>
                  {sellerMap.get(activeCard.user_id) ? <div className="mt-2 text-sm text-slate-400">Seller: <span className="text-slate-200">@{sellerMap.get(activeCard.user_id)}</span></div> : null}
                </div>
                <button type="button" onClick={() => setActiveCard(null)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">Close</button>
              </div>

              <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-white/10 bg-slate-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-200">Image</div>

                    <div className="flex items-center gap-2">
                      {activeCard.back_image_url ? (
                        <button
                          type="button"
                          onClick={() => setShowBack((v) => !v)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          {showBack ? "Show front" : "Show back"}
                        </button>
                      ) : null}

                      {activeCard.image_url || activeCard.back_image_url ? (
                        <button
                          type="button"
                          onClick={() => setZoomEnabled((v) => !v)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          {zoomEnabled ? "Zoomed" : "🔎 Zoom"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div
                    ref={zoomContainerRef}
                    className={`mt-4 relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-950 ${zoomEnabled ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                    onMouseMove={(e) => {
                      if (!zoomEnabled) return;
                      const el = zoomContainerRef.current;
                      if (!el) return;
                      const rect = el.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                    }}
                    onMouseLeave={() => {
                      if (!zoomEnabled) return;
                      setZoomOrigin({ x: 50, y: 50 });
                    }}
                  >
                    {showBack && activeCard.back_image_url ? (
                      <img
                        alt="back"
                        src={driveToImageSrc(activeCard.back_image_url)}
                        className={`h-full w-full ${zoomEnabled ? "object-cover" : "object-contain"}`}
                        style={
                          zoomEnabled
                            ? {
                                transform: "scale(2.8)",
                                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                              }
                            : undefined
                        }
                      />
                    ) : activeCard.image_url ? (
                      <img
                        alt="front"
                        src={driveToImageSrc(activeCard.image_url)}
                        className={`h-full w-full ${zoomEnabled ? "object-cover" : "object-contain"}`}
                        style={
                          zoomEnabled
                            ? {
                                transform: "scale(2.8)",
                                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                              }
                            : undefined
                        }
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">Card details</div>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div className="text-base font-semibold text-white">{activeCard.player_name}</div>
                    <div>{[activeCard.year, activeCard.brand, activeCard.set_name].filter(Boolean).join(" · ")}</div>
                    {(activeCard.team || activeCard.sport || activeCard.competition) ? <div>{[activeCard.team, activeCard.sport, activeCard.competition].filter(Boolean).join(" · ")}</div> : null}
                    {activeCard.parallel ? <div><span className="text-slate-400">Parallel:</span> <span className="text-white">{activeCard.parallel}</span></div> : null}
                    <div><span className="text-slate-400">Card:</span> <span className="text-white">#{activeCard.card_number}</span></div>
                    {activeCard.serial_number_text ? <div><span className="text-slate-400">Serial:</span> <span className="text-white">{activeCard.serial_number_text}</span></div> : null}
                    {activeCard.asking_price != null ? <div><span className="text-slate-400">Asking:</span> <span className="font-semibold text-white">{formatMoney(Number(activeCard.asking_price))}</span></div> : null}

                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      {yes(activeCard.is_autograph) ? <span className="rounded bg-[#d50000] px-2 py-1 text-white">Auto</span> : null}
                      {yes(activeCard.has_memorabilia) ? <span className="rounded bg-[#d50000] px-2 py-1 text-white">Mem</span> : null}
                      {yes(activeCard.rookie) ? <span className="rounded bg-amber-500 px-2 py-1 text-black">RC</span> : null}
                      {yes(activeCard.graded) && activeCard.grade != null ? <span className="rounded bg-blue-800 px-2 py-1 text-white">Grade {activeCard.grade}</span> : null}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3">
                      {toUrl(activeCard.sale_platform) ? (
                        <a
                          href={toUrl(activeCard.sale_platform) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          Open listing ↗
                        </a>
                      ) : null}

                      {String(sellerMap.get(activeCard.user_id) || "").trim() && activeCard.user_id !== user.id ? (
                        <button
                          type="button"
                          onClick={() => handleMessageSeller(activeCard)}
                          disabled={messageStarting}
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15 disabled:opacity-60"
                        >
                          {messageStarting ? "Opening…" : "Message seller"}
                        </button>
                      ) : null}

                      {String(sellerMap.get(activeCard.user_id) || "").trim() ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSellerFilter(String(sellerMap.get(activeCard.user_id) || ""));
                            setActiveCard(null);
                          }}
                          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          See seller's cards
                        </button>
                      ) : null}

                      <a href={buildEbaySearchUrl(activeCard)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/15">
                        Comp check ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <CardCatMobileNav />
    </main>
  );
}
