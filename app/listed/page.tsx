"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { driveToImageSrc } from "@/lib/googleDrive";
import { buildSellerNotes, parseSellerMeta } from "@/lib/cardSellerMeta";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import UsernamePromptBanner from "@/components/UsernamePromptBanner";
import { useUserProfile } from "@/lib/useUserProfile";
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
  public_market_visible?: boolean;
  notes?: string | null;

  sold_price?: number | null;
  sold_at?: string | null;
};

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
  const { profile, refreshProfile } = useUserProfile(user?.id);

  const [cards, setCards] = useState<ListedCard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeCard, setActiveCard] = useState<ListedCard | null>(null);
  const [showBack, setShowBack] = useState(false);

  const [editLink, setEditLink] = useState<string>("");
  const [editAskingPrice, setEditAskingPrice] = useState<string>("");
  const [editListedAt, setEditListedAt] = useState<string>("");
  const [editSellerNotes, setEditSellerNotes] = useState<string>("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [markSoldModal, setMarkSoldModal] = useState<{ price: string; date: string } | null>(null);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const [shareCard, setShareCard] = useState<any | null>(null);

  type ListingShare = {
    id?: string;
    share_token: string;
    created_at?: string;
    expires_at?: string | null;
    revoked_at?: string | null;
    show_pricing: boolean;
    show_comp_check?: boolean;
  };

  const [listingShares, setListingShares] = useState<ListingShare[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [manageSharesOpen, setManageSharesOpen] = useState(false);
  const [shareShowPricing, setShareShowPricing] = useState(true);
  const [shareDuration, setShareDuration] = useState<"24h" | "7d" | "1m" | "permanent">("7d");
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [marketModeSaving, setMarketModeSaving] = useState(false);

  const [bulkSelectingCards, setBulkSelectingCards] = useState(false);
  const [bulkSelectedCardIds, setBulkSelectedCardIds] = useState<string[]>([]);
  const [bulkUpdatingMarketVisibility, setBulkUpdatingMarketVisibility] = useState(false);

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
        .select("id, player_name, year, brand, set_name, parallel, serial_number_text, image_url, back_image_url, status, asking_price, listed_at, sale_platform, sold_price, sold_at, public_market_visible, notes")
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

  async function loadListingShares() {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    let { data, error } = await supabase
      .from("listing_shares")
      .select("id, share_token, created_at, expires_at, revoked_at, show_pricing, show_comp_check")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error && String(error.message || "").toLowerCase().includes("show_comp_check")) {
      const fallback = await supabase
        .from("listing_shares")
        .select("id, share_token, created_at, expires_at, revoked_at, show_pricing")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });
      data = (fallback.data ?? []).map((row: any) => ({ ...row, show_comp_check: true }));
      error = fallback.error;
    }

    if (error) {
      console.error("Failed to load listing shares:", error);
      return;
    }

    setListingShares((data ?? []) as ListingShare[]);
  }

  useEffect(() => {
    if (!user?.id || !supabaseConfigured) return;
    loadListedCards();
    loadListingShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!activeCard) return;
    setShowBack(false);
    setEditLink(String(activeCard.sale_platform || ""));
    setEditAskingPrice(activeCard.asking_price != null ? String(activeCard.asking_price) : "");
    setEditListedAt(activeCard.listed_at ? String(activeCard.listed_at).slice(0, 10) : "");
    setEditSellerNotes(parseSellerMeta(activeCard.notes).publicNotes);
  }, [activeCard]);

  async function createListingShare() {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    setIsCreatingShare(true);
    setGeneratedShareLink(null);
    try {
      const token = crypto.randomUUID().replace(/-/g, "");

      let expires_at: string | null = null;
      const now = Date.now();
      if (shareDuration !== "permanent") {
        const ms =
          shareDuration === "24h"
            ? 24 * 60 * 60 * 1000
            : shareDuration === "7d"
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000;
        expires_at = new Date(now + ms).toISOString();
      }

      let { error } = await supabase.from("listing_shares").insert({
        owner_user_id: user.id,
        share_token: token,
        expires_at,
        show_pricing: shareShowPricing,
        // Comps should always be on the shared card listings.
        show_comp_check: true,
      });

      if (error && String(error.message || "").toLowerCase().includes("show_comp_check")) {
        const fallback = await supabase.from("listing_shares").insert({
          owner_user_id: user.id,
          share_token: token,
          expires_at,
          show_pricing: shareShowPricing,
        });
        error = fallback.error;
      }

      if (error) {
        alert(`Could not create share link: ${error.message}`);
        return;
      }

      const url = `${window.location.origin}/listed/share/${token}`;
      setGeneratedShareLink(url);
      await loadListingShares();
    } finally {
      setIsCreatingShare(false);
    }
  }

  async function revokeListingShare(shareId?: string) {
    if (!shareId) return;
    if (!user?.id || !supabaseConfigured || !supabase) return;

    const ok = confirm("Disable this shared listings link?");
    if (!ok) return;

    const { error } = await supabase
      .from("listing_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", shareId);

    if (error) {
      alert(`Could not disable link: ${error.message}`);
      return;
    }

    setGeneratedShareLink(null);
    await loadListingShares();
  }

  async function toggleMarketVisibility(cardId?: string, nextValue?: boolean) {
    if (!cardId || !user?.id || !supabaseConfigured || !supabase) return;
    if (!profile?.username) {
      alert("Choose a username first, then you can post cards to Market.");
      return;
    }

    if (String(profile?.market_visibility_mode || "none") !== "selected_cards") {
      await setMarketMode("selected_cards");
    }

    const { error } = await supabase
      .from("cards")
      .update({ public_market_visible: Boolean(nextValue) })
      .eq("id", cardId)
      .eq("user_id", user.id);

    if (error) {
      alert(`Could not update market visibility: ${error.message}`);
      return;
    }

    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, public_market_visible: Boolean(nextValue) } : card)));
    setActiveCard((prev) => (prev?.id === cardId ? { ...prev, public_market_visible: Boolean(nextValue) } : prev));
  }

  async function setMarketMode(nextMode: "none" | "selected_cards" | "all_listed") {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    if (!profile?.username) {
      alert("Choose a username first, then you can post cards to Market.");
      return;
    }

    setMarketModeSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          username: String(profile.username || ""),
          allow_messages: profile.allow_messages ?? true,
          market_visibility_mode: nextMode,
        },
        { onConflict: "id" }
      );
    setMarketModeSaving(false);

    if (error) {
      alert(`Could not update market visibility: ${error.message}`);
      return;
    }

    await refreshProfile();
  }

  async function postSelectedCardsToMarket() {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    if (!profile?.username) {
      alert("Choose a username first.");
      return;
    }
    if (bulkSelectedCardIds.length === 0) {
      alert("Select at least one card first.");
      return;
    }

    setBulkUpdatingMarketVisibility(true);
    try {
      // Ensure we’re in selected-cards mode so the per-card flag controls visibility.
      if (profile.market_visibility_mode !== "selected_cards") {
        await setMarketMode("selected_cards");
      }

      const { error } = await supabase
        .from("cards")
        .update({ public_market_visible: true })
        .in("id", bulkSelectedCardIds)
        .eq("user_id", user.id);

      if (error) {
        alert(`Could not post selected cards: ${error.message}`);
        return;
      }

      setCards((prev) => prev.map((card) => (card.id && bulkSelectedCardIds.includes(card.id) ? { ...card, public_market_visible: true } : card)));
      setActiveCard((prev) => (prev?.id && bulkSelectedCardIds.includes(prev.id) ? { ...prev, public_market_visible: true } : prev));

      setBulkSelectedCardIds([]);
      setBulkSelectingCards(false);
    } finally {
      setBulkUpdatingMarketVisibility(false);
    }
  }

  function shareDurationLabel(s: ListingShare) {
    if (!s.expires_at) return "Permanent";
    if (!s.created_at) return "Limited";
    const created = new Date(s.created_at);
    const expires = new Date(s.expires_at);
    const diffMs = expires.getTime() - created.getTime();
    if (!Number.isFinite(diffMs)) return "Limited";

    if (diffMs <= 36 * 60 * 60 * 1000) return "24h";
    if (diffMs <= 10 * 24 * 60 * 60 * 1000) return "7 days";
    return "1 month";
  }

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
      const existingSellerMeta = parseSellerMeta(activeCard.notes).meta;
      const notes = buildSellerNotes(editSellerNotes, existingSellerMeta);

      const { error } = await supabase
        .from("cards")
        .update({ asking_price, listed_at, sale_platform, notes })
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
            ? { ...c, asking_price, listed_at, sale_platform, notes }
            : c
        )
      );

      setActiveCard((prev) => (prev ? { ...prev, asking_price, listed_at, sale_platform, notes } : prev));
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
  const activeCardPublicNotes = useMemo(() => parseSellerMeta(activeCard?.notes).publicNotes, [activeCard?.notes]);
  const normalizedEditLink = editLink.trim();
  const normalizedEditSellerNotes = editSellerNotes.trim();
  const normalizedEditListedAt = editListedAt.trim();
  const normalizedEditAskingPrice = (() => {
    const raw = editAskingPrice.trim();
    if (!raw) return "";
    const n = Number(raw);
    return Number.isFinite(n) ? String(n) : raw;
  })();
  const activeAskingPrice = activeCard?.asking_price != null ? String(Number(activeCard.asking_price)) : "";
  const activeListedAtValue = activeCard?.listed_at ? String(activeCard.listed_at).slice(0, 10) : "";
  const activeLinkValue = String(activeCard?.sale_platform || "").trim();
  const activePublicNotesValue = activeCardPublicNotes.trim();
  const isListingDirty = Boolean(activeCard) && (
    normalizedEditLink !== activeLinkValue ||
    normalizedEditListedAt !== activeListedAtValue ||
    normalizedEditAskingPrice !== activeAskingPrice ||
    normalizedEditSellerNotes !== activePublicNotesValue
  );

  const nowMs = Date.now();
  const activeListingShares = listingShares.filter((s) => {
    if (s.revoked_at) return false;
    if (s.expires_at) {
      const exp = new Date(s.expires_at);
      if (Number.isFinite(exp.getTime())) return exp.getTime() > nowMs;
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-32 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <CardCatMobileNav />
        <EmailVerificationNotice needsVerification={needsEmailVerification} email={(user as any)?.email} />
        <UsernamePromptBanner userId={user?.id} />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardCatLogo />
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              <span>📣</span>
              <span>Listed</span>
            </div>
            <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight text-white">Actively listed cards</h1>
            <p className="mt-2 text-slate-300">Tap a card to set (or update) the sale link. When you mark it sold, it moves to the Sold page.</p>
          </div>

          <div className="text-left lg:text-right">
            <div className="text-sm text-slate-400">{sortedCards.length} active listing{sortedCards.length === 1 ? "" : "s"}</div>
            <div className="mt-3 flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <a
                href="/messages"
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Messages
              </a>
              <a
                href="/market"
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Market
              </a>
              <button
                type="button"
                onClick={() => {
                  setGeneratedShareLink(null);
                  setShareModalOpen(true);
                }}
                className="rounded-lg border border-white/10 bg-emerald-500/[0.14] px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/[0.18] disabled:opacity-60"
                disabled={loading}
              >
                Share listings
              </button>
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

        <section className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Marketplace visibility</div>
              <div className="mt-1 text-sm text-slate-300">
                Your listed cards are private by default. Use Marketplace visibility to post selected/listed cards into the Member Market feed at <span className="font-semibold text-slate-200">/market</span>. Use Share listings to generate a token-based private link you can send to a buyer (pricing and comp check can be toggled), and you can revoke/expire it anytime.
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="text-xs text-slate-400">
                {String(profile?.market_visibility_mode || "none") === "all_listed"
                  ? "Currently posting your whole listing collection to Market"
                  : "Currently using individual card selection"}
              </div>
              <button
                type="button"
                onClick={() => setMarketMode(String(profile?.market_visibility_mode || "none") === "all_listed" ? "selected_cards" : "all_listed")}
                disabled={marketModeSaving || !profile?.username}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${String(profile?.market_visibility_mode || "none") === "all_listed" ? "border-white/10 bg-slate-900/20 text-slate-200" : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"} disabled:opacity-60`}
              >
                {String(profile?.market_visibility_mode || "none") === "all_listed"
                  ? "Use individual card selection"
                  : "Post whole listing collection to Market"}
              </button>
            </div>
          </div>

          {!profile?.username ? (
            <div className="mt-3 text-xs text-amber-200">Choose a username first, then you can post cards to Market.</div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
            <div className="inline-flex items-center gap-2">
              <span className="h-3.5 w-8 rounded border border-emerald-500/30 bg-emerald-500/10" />
              Market
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-3.5 w-8 rounded border border-red-500/30 bg-red-500/10" />
              Unlisted / Private
            </div>
          </div>

          {profile?.market_visibility_mode === "selected_cards" ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              {!bulkSelectingCards ? (
                <button
                  type="button"
                  onClick={() => {
                    setBulkSelectedCardIds([]);
                    setBulkSelectingCards(true);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                  disabled={marketModeSaving || isRefreshing}
                >
                  Select multiple cards to post
                </button>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-300">
                    Tap cards to toggle Market visibility (green = on Market, red = off).
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkSelectingCards(false);
                        setBulkSelectedCardIds([]);
                      }}
                      disabled={bulkUpdatingMarketVisibility}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-60"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {activeListingShares.length > 0 ? (
          <div className="mt-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            ⚠️ {activeListingShares.length} active share link{activeListingShares.length === 1 ? "" : "s"} for your listings.
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-xl border border-amber-500/30 bg-amber-500/[0.12] px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-amber-500/[0.18]"
              onClick={() => setManageSharesOpen(true)}
            >
              Manage / disable
            </button>
          </div>
        ) : null}

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

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list" aria-label="Listed cards">
                  {sortedCards.map((c) => {
	                      const src = c.image_url ? driveToImageSrc(c.image_url, { variant: "detail" }) : "";
                    const goHref = toUrl(c.sale_platform);
                    const marketMode = profile?.market_visibility_mode || "none";
                    const isOnMarket =
                      marketMode === "whole_collection" ||
                      (marketMode === "all_listed" && c.status === "Listed") ||
                      (marketMode === "selected_cards" && Boolean(c.public_market_visible));
                    const isSelected = c.id ? bulkSelectedCardIds.includes(c.id) : false;
                    return (
                      <div
                        key={c.id}
                        role="listitem"
                        tabIndex={0}
                        onClick={() => {
                          if (marketMode === "selected_cards" && bulkSelectingCards && c.id) {
                            void toggleMarketVisibility(c.id as string, !isOnMarket);
                            return;
                          }
                          setActiveCard(c);
                        }}
                        className={`relative rounded-2xl border p-3 ${isOnMarket ? "border-emerald-500/60 bg-emerald-500/25" : "border-red-500/60 bg-red-500/20"}`}
                        aria-label={`View ${c.player_name}`}
                        onKeyDown={(e) => {
                          if (!(e.key === "Enter" || e.key === " ")) return;
                          if (marketMode === "selected_cards" && bulkSelectingCards && c.id) {
                            void toggleMarketVisibility(c.id as string, !isOnMarket);
                            return;
                          }
                          setActiveCard(c);
                        }}
                      >
                        {marketMode === "selected_cards" && bulkSelectingCards && c.id && isSelected ? (
                          <div
                            aria-hidden="true"
                            className={`absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${isSelected ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-slate-950/60 text-slate-200"}`}
                          >
                            ✓
                          </div>
                        ) : null}

	                          <div
	                            className={`aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-950 flex items-center justify-center ${isOnMarket ? "border border-emerald-500/80" : "border border-red-500/80"}`}
	                          >
	                            {c.image_url ? <img alt="front" src={src} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" /> : <div className="h-full w-full" />}
	                          </div>

                        <div className="mt-3 text-center">
                          <div className="line-clamp-2 text-sm font-semibold leading-tight text-white">{c.player_name}</div>
                          <div className="mt-1 text-[11px] text-slate-300">
                            {c.year} · {c.brand}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                            {c.set_name} · {c.parallel}
                          </div>

                          {c.status === "Sold" && c.sold_price != null ? (
                            <div className="mt-2 text-xs font-semibold text-emerald-200">SOLD {formatMoney(Number(c.sold_price))}</div>
                          ) : c.asking_price != null ? (
                            <div className="mt-2 text-xs font-semibold text-slate-100">{formatMoney(Number(c.asking_price))}</div>
                          ) : null}
                        </div>

                        {goHref ? (
                          <a
                            href={goHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 top-2 z-20 rounded-full border border-white/10 bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-950/90"
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
	                      const src = c.image_url ? driveToImageSrc(c.image_url, { variant: "detail" }) : "";
                      const goHref = toUrl(c.sale_platform);
                      const marketMode = profile?.market_visibility_mode || "none";
                      const isOnMarket =
                        marketMode === "whole_collection" ||
                        (marketMode === "all_listed" && c.status === "Listed") ||
                        (marketMode === "selected_cards" && Boolean(c.public_market_visible));
                      const isSelected = c.id ? bulkSelectedCardIds.includes(c.id) : false;
                      return (
                        <div
                          key={c.id}
                          role="button"
                          tabIndex={0}
                        onClick={() => {
                          if (marketMode === "selected_cards" && bulkSelectingCards && c.id) {
                            void toggleMarketVisibility(c.id as string, !isOnMarket);
                            return;
                          }
                          setActiveCard(c);
                        }}
                          className={`relative rounded-2xl border p-3 ${isOnMarket ? "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15" : "border-red-500/20 bg-red-500/10 hover:bg-red-500/15"}`}
                          onKeyDown={(e) => {
                            if (!(e.key === "Enter" || e.key === " ")) return;
                            if (marketMode === "selected_cards" && bulkSelectingCards && c.id) {
                              void toggleMarketVisibility(c.id as string, !isOnMarket);
                              return;
                            }
                            setActiveCard(c);
                          }}
                        >
	                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
	                            {c.image_url ? <img alt="front" src={src} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" /> : <div className="h-full w-full" />}
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

                          {marketMode === "selected_cards" && bulkSelectingCards && c.id && isSelected ? (
                            <div
                              aria-hidden="true"
                              className={`absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                                isSelected
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                                  : "border-white/10 bg-slate-950/60 text-slate-200"
                              }`}
                            >
                              ✓
                            </div>
                          ) : null}

                          <div className="mt-3 text-center">
                            <div className="line-clamp-2 text-sm font-semibold text-white">{c.player_name}</div>
                            <div className="mt-1 text-xs text-slate-300">
                              {c.year} · {c.brand}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {c.set_name} · {c.parallel}
                            </div>

                            {c.status === "Sold" ? (
                              c.sold_price != null ? (
                                <div className="mt-2 text-sm font-semibold text-emerald-200">SOLD {formatMoney(Number(c.sold_price))}</div>
                              ) : (
                                <div className="mt-2 text-sm font-semibold text-slate-500">Sold</div>
                              )
                            ) : c.asking_price != null ? (
                              <div className="mt-2 text-sm font-semibold text-slate-100">{formatMoney(Number(c.asking_price))}</div>
                            ) : (
                              <div className="mt-2 text-sm font-semibold text-slate-500">No price</div>
                            )}
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
                          className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                        >
                          Check comps ↗
                        </a>
                      </div>
                    </label>

                    <label className="block rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="text-sm font-semibold text-slate-200">Seller notes</div>
                      <div className="mt-2 text-sm text-slate-400">Optional buyer-facing notes. These show in Market and shared listing detail views.</div>
                      <textarea
                        value={editSellerNotes}
                        onChange={(e) => setEditSellerNotes(e.target.value)}
                        placeholder="Example: Small surface scratch on the top loader, card itself looks clean."
                        className="mt-3 min-h-[110px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </label>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="text-sm font-semibold text-slate-200">Market visibility</div>
                      <div className="mt-2 text-sm text-slate-400">Use this if your account is set to <span className="text-slate-200">Selected cards</span> for Market visibility.</div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-sm text-slate-300">{activeCard.public_market_visible ? "Visible on Market" : "Hidden from Market"}</div>
                        <button
                          type="button"
                          onClick={() => toggleMarketVisibility(activeCard.id, !activeCard.public_market_visible)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeCard.public_market_visible ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-800 text-slate-200"}`}
                        >
                          Toggle
                        </button>
                      </div>
                    </div>

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
                            disabled={isSavingDetails || !isListingDirty}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.08] disabled:opacity-60"
                          >
                            {isSavingDetails ? "Saving…" : isListingDirty ? "Save listing" : "Saved"}
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

      {shareModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={() => setShareModalOpen(false)}>
          <div
            className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Share your active listings</div>
                <div className="mt-1 text-sm text-slate-300">Generate a time-limited view-only link.</div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-slate-200">Offers & pricing</div>
                <div className="mt-3 text-sm text-slate-300">Prices will be visible in this share link.</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-slate-200">Link duration</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {([
                    { key: "24h", label: "24 hours" },
                    { key: "7d", label: "7 days" },
                    { key: "1m", label: "1 month" },
                    { key: "permanent", label: "Permanent" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setShareDuration(opt.key)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold ${shareDuration === opt.key ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-slate-900/20 text-slate-200"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isCreatingShare}
                  onClick={() => createListingShare()}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {isCreatingShare ? "Generating…" : "Generate share link"}
                </button>

                {generatedShareLink ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/30 p-3">
                    <div className="text-sm font-semibold text-slate-200">Your link</div>
                    <a href={generatedShareLink} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-slate-300">
                      {generatedShareLink}
                    </a>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                        onClick={() => {
                          navigator.clipboard?.writeText(generatedShareLink);
                        }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
                        onClick={() => {
                          setShareModalOpen(false);
                          setManageSharesOpen(true);
                        }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {manageSharesOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={() => setManageSharesOpen(false)}>
          <div
            className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Shared listings links</div>
                <div className="mt-1 text-sm text-slate-300">Disable a link to stop sharing (images are also blocked after disable/expiry).</div>
              </div>
              <button
                type="button"
                onClick={() => setManageSharesOpen(false)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {listingShares.filter((s) => !s.revoked_at).length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No share links yet.</div>
              ) : (
                listingShares
                  .filter((s) => !s.revoked_at)
                  .slice()
                  .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
                  .map((s) => {
                    const url = `${window.location.origin}/listed/share/${s.share_token}`;
                    const isActive = !s.revoked_at && (!s.expires_at || new Date(s.expires_at).getTime() > nowMs);

                    return (
                      <div key={s.id} className={`rounded-xl border p-4 ${isActive ? "border-emerald-400/20 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-200">{shareDurationLabel(s)}</div>
                            <div className="mt-1 text-xs text-slate-400">Created {s.created_at ? String(s.created_at).slice(0, 10) : ""}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {s.show_pricing
                                ? "Accepting offers off (pricing visible)"
                                : "Accepting offers on (pricing hidden)"} · Comp button on
                            </div>
                            <a className="mt-2 block break-all text-sm text-slate-300" href={url} target="_blank" rel="noreferrer">
                              {url}
                            </a>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                              onClick={() => navigator.clipboard?.writeText(url)}
                            >
                              Copy
                            </button>

                            {isActive ? (
                              <button
                                type="button"
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15"
                                onClick={() => revokeListingShare(s.id)}
                              >
                                Disable
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setManageSharesOpen(false);
                  setShareModalOpen(true);
                  setGeneratedShareLink(null);
                }}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                Create a new share link
              </button>
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
