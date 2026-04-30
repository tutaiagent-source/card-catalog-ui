"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import CardCatMobileNav from "@/components/CardCatMobileNav";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import UsernamePromptBanner from "@/components/UsernamePromptBanner";
import { driveToImageSrc } from "@/lib/googleDrive";
import { startDirectConversation } from "@/lib/messaging";
import { parseSellerMeta } from "@/lib/cardSellerMeta";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

type SellerProfile = {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  market_visibility_mode?: string;

  is_shop?: boolean;
  shop_name?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_website?: string;
  shop_show_address?: boolean;
  shop_show_phone?: boolean;
  shop_show_website?: boolean;
  shop_verification_status?: string;
  shop_verified_at?: string | null;
};

type SellerCard = {
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
  serial_number_text: string;
  image_url?: string;
  back_image_url?: string;
  asking_price?: number | null;
  listed_at?: string | null;
  sale_platform?: string | null;
  public_market_visible?: boolean;
  notes?: string | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function toUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(raw)) return `https://${raw}`;
  return null;
}

export default function SellerProfilePage() {
  const params = useParams<{ username?: string }>();
  const routeUsername = String(params.username || "").trim().toLowerCase();

  const { user, loading } = useSupabaseUser();
  const emailConfirmedAt = (user as unknown as { email_confirmed_at?: string | null } | null)?.email_confirmed_at;
  const needsEmailVerification = !!user && !emailConfirmedAt;

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [cards, setCards] = useState<SellerCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [activeCard, setActiveCard] = useState<SellerCard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [messageStarting, setMessageStarting] = useState(false);

  const isShop = Boolean(seller?.is_shop);
  const shopStatus = String(seller?.shop_verification_status || "unsubmitted").toLowerCase();
  const isVerifiedShop = isShop && shopStatus === "verified";

  useEffect(() => {
    setShowBack(false);
  }, [activeCard?.id]);

  const isOwnProfile = Boolean(seller?.id && user?.id && seller.id === user.id);

  const activeCardPublicNotes = useMemo(
    () => (activeCard?.notes ? parseSellerMeta(activeCard.notes).publicNotes : ""),
    [activeCard?.notes]
  );

  useEffect(() => {
    if (!routeUsername) return;
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    (async () => {
      setError("");
      setSeller(null);
      setCards([]);

      setLoadingCards(true);
      try {
        const { data: profileRow, error: profileErr } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, avatar_url, bio, market_visibility_mode, is_shop, shop_name, shop_address, shop_phone, shop_website, shop_show_address, shop_show_phone, shop_show_website, shop_verification_status"
          )
          .eq("username", routeUsername)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileRow) {
          setError("Seller not found.");
          return;
        }

        setSeller(profileRow as SellerProfile);

        const mode = String((profileRow as SellerProfile).market_visibility_mode || "none");

        if (mode === "none") {
          setCards([]);
        } else {
          let q = supabase
            .from("cards")
            .select(
              "id, user_id, player_name, year, brand, set_name, parallel, card_number, team, sport, competition, serial_number_text, image_url, back_image_url, asking_price, listed_at, sale_platform, public_market_visible, notes"
            )
            .eq("user_id", (profileRow as SellerProfile).id)
            .eq("status", "Listed")
            .order("listed_at", { ascending: false });

          if (mode === "selected_cards") {
            q = q.eq("public_market_visible", true);
          }

          const { data: cardRows, error: cardErr } = await q;
          if (cardErr) throw cardErr;
          setCards((cardRows ?? []) as SellerCard[]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load seller profile.");
      } finally {
        setLoadingCards(false);
      }
    })();
  }, [routeUsername, user?.id]);

  useEffect(() => {
    if (!seller) return;
    setDisplayNameDraft(seller.display_name ?? "");
    setBioDraft(seller.bio ?? "");
  }, [seller?.id]);

  async function saveProfileEdits() {
    if (!isOwnProfile) return;
    if (!user?.id || !supabaseConfigured || !supabase) return;

    setError("");

    const nextDisplayName = String(displayNameDraft || "").slice(0, 80);
    const nextBio = String(bioDraft || "").slice(0, 800);

    const { error: upErr } = await supabase.from("profiles").update({
      display_name: nextDisplayName,
      bio: nextBio,
    }).eq("id", user.id);

    if (upErr) {
      setError(upErr.message);
      return;
    }

    // Optimistic update.
    setSeller((prev) => (prev ? { ...prev, display_name: nextDisplayName, bio: nextBio } : prev));
    setEditMode(false);
  }

  async function uploadAvatar(file: File) {
    if (!isOwnProfile) return;
    if (!supabaseConfigured || !supabase || !user?.id) return;
    setError("");

    setAvatarUploading(true);
    try {
      const allowedMimes = new Set(["image/png", "image/jpeg", "image/webp"]);
      const MAX_BYTES = 6 * 1024 * 1024;
      if (!allowedMimes.has(file.type)) throw new Error("Avatar must be a PNG, JPG, or WebP image.");
      if (file.size > MAX_BYTES) throw new Error("Avatar is too large (max 6MB). Please use a smaller file.");

      const loadImage = (f: File) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const url = URL.createObjectURL(f);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not read that image file."));
          };
          img.src = url;
        });

      const img = await loadImage(file);
      const MAX_DIM = 800;
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const targetW = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
      const targetH = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not process that image file.");
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (!b) reject(new Error("Could not process that image file."));
            else resolve(b);
          },
          "image/webp",
          0.82
        );
      });

      const avatarUuid = crypto.randomUUID();
      const bucket = "card-images";
      const folder = `avatars/${avatarUuid}`;
      const mainPath = `${folder}/main.webp`;
      const mainFile = new File([blob], "main.webp", { type: "image/webp" });

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(mainPath, mainFile, {
        upsert: false,
        contentType: "image/webp",
      });
      if (uploadErr) throw uploadErr;

      const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(mainPath);
      const publicUrl = pub.publicUrl;
      if (!publicUrl) throw new Error("Could not get avatar URL after upload.");

      const { error: upErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (upErr) throw upErr;

      setSeller((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Avatar upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleMessageSeller(card: SellerCard) {
    if (!seller?.username) return;
    if (!user?.id) return;
    if (!card.id) {
      setError("Could not message this listing (missing card id). Try refreshing.");
      return;
    }

    setMessageStarting(true);
    setError("");
    try {
      const prefill = `Hey, I'm interested in your ${[card.year, card.player_name, card.brand, card.set_name].filter(Boolean).join(" ")}. Is it still available?`;
      const conversationId = await startDirectConversation(seller.username, undefined, card.id);
      window.location.href = `/messages?conversation=${encodeURIComponent(conversationId)}&prefill=${encodeURIComponent(prefill)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a conversation.");
    } finally {
      setMessageStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 text-slate-300">Loading seller…</div>
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
        <EmailVerificationNotice
          needsVerification={needsEmailVerification}
          email={(user as unknown as { email?: string | null } | null)?.email ?? null}
        />
        <UsernamePromptBanner userId={user?.id} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-emerald-200">Seller profile</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {isVerifiedShop && seller?.shop_name ? seller.shop_name : `@${routeUsername}`}
            </h1>

            {seller?.is_shop ? (
              <div className="mt-2">
                <span
                  className={
                    isVerifiedShop
                      ? "rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-semibold text-emerald-200"
                      : "rounded-full bg-white/[0.04] px-3 py-1 text-[12px] font-semibold text-slate-300"
                  }
                >
                  {isVerifiedShop ? "Verified shop" : "Pending verification"}
                </span>
                {seller?.shop_name ? (
                  <div className="mt-1 text-xs text-slate-400">@{routeUsername}</div>
                ) : null}
              </div>
            ) : seller?.display_name ? (
              <div className="mt-1 text-slate-300">{seller.display_name}</div>
            ) : null}

            {seller?.avatar_url ? (
              <img
                src={driveToImageSrc(seller.avatar_url, { variant: "grid" })}
                alt={routeUsername}
                className="mt-3 h-16 w-16 rounded-full border border-white/10 bg-slate-950 object-cover"
              />
            ) : null}

            {seller?.bio ? <p className="mt-3 text-sm text-slate-400 whitespace-pre-wrap">{seller.bio}</p> : null}

            {seller && seller.is_shop && isVerifiedShop ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-sm font-semibold text-white">Shop details</div>

                {seller.shop_show_address && seller.shop_address ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Address</div>
                    <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{seller.shop_address}</div>
                  </div>
                ) : null}

                {seller.shop_show_phone && seller.shop_phone ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Phone</div>
                    <div className="mt-1 text-sm text-slate-200">{seller.shop_phone}</div>
                  </div>
                ) : null}

                {seller.shop_show_website && seller.shop_website ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Website</div>
                    {toUrl(seller.shop_website) ? (
                      <a
                        href={toUrl(seller.shop_website) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-sm font-semibold text-emerald-200 hover:underline"
                      >
                        {seller.shop_website}
                      </a>
                    ) : (
                      <div className="mt-1 text-sm text-slate-200">{seller.shop_website}</div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {isOwnProfile ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Avatar</div>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={avatarUploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            void uploadAvatar(f);
                          }}
                          className="block w-full text-sm text-slate-300"
                        />
                      </div>
                      {avatarUploading ? <div className="mt-2 text-xs text-slate-400">Uploading avatar…</div> : null}
                    </div>

                    <label className="block">
                      <div className="text-sm font-semibold text-white">Display name</div>
                      <input
                        value={displayNameDraft}
                        onChange={(e) => setDisplayNameDraft(e.target.value)}
                        className="mt-2 w-full rounded bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </label>

                    <label className="block">
                      <div className="text-sm font-semibold text-white">Bio</div>
                      <textarea
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                        className="mt-2 min-h-[88px] w-full rounded bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
                        onClick={() => setEditMode(false)}
                        disabled={avatarUploading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                        onClick={() => void saveProfileEdits()}
                        disabled={avatarUploading}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
                    onClick={() => setEditMode(true)}
                  >
                    Edit profile
                  </button>
                )}
              </div>
            ) : null}

            <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Member Market</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/market"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
            >
              Back to Market
            </Link>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Active listings on CardCat Market</div>
              <div className="mt-1 text-xs text-slate-500">{loadingCards ? "Loading…" : `${cards.length} card${cards.length === 1 ? "" : "s"}`}</div>
            </div>
          </div>

          {loadingCards ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">Loading listings…</div>
          ) : cards.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">No active market listings from this seller.</div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cards.map((card) => (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveCard(card)}
                  onKeyDown={(e) => {
                    if (!(e.key === "Enter" || e.key === " ")) return;
                    setActiveCard(card);
                  }}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-left hover:bg-slate-950/60"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
                    {card.image_url ? (
                      <img
                        alt={card.player_name}
                        src={driveToImageSrc(card.image_url, { variant: "grid" })}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>

                  <div className="mt-3 text-sm font-semibold text-white line-clamp-2">{card.player_name}</div>
                  <div className="mt-1 text-xs text-slate-400 line-clamp-2">{[card.year, card.brand, card.set_name].filter(Boolean).join(" · ")}</div>

                  {card.asking_price != null ? (
                    <div className="mt-2 text-sm font-semibold text-slate-100">{formatMoney(Number(card.asking_price))}</div>
                  ) : null}

                  <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                    Visible on CardCat Market
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {activeCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4" onClick={() => setActiveCard(null)}>
          <div
            className="w-full max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl [-webkit-overflow-scrolling:touch]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Market listing</div>
                <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                  Visible on CardCat Market
                </div>
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
                  </div>
                </div>

                <div className="mt-4 relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-950">
                  {showBack && activeCard.back_image_url ? (
                    <img alt="back" src={driveToImageSrc(activeCard.back_image_url)} className="h-full w-full object-contain" />
                  ) : activeCard.image_url ? (
                    <img alt="front" src={driveToImageSrc(activeCard.image_url)} className="h-full w-full object-contain" />
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

                  {activeCard.asking_price != null ? (
                    <div className="text-sm">
                      <span className="text-slate-400">Asking:</span>{" "}
                      <span className="font-semibold text-white">{formatMoney(Number(activeCard.asking_price))}</span>
                    </div>
                  ) : null}

                  {activeCardPublicNotes ? (
                    <div className="pt-3">
                      <div className="text-slate-400">Seller notes:</div>
                      <div className="mt-1 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-200">
                        {activeCardPublicNotes}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2">
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

                    {seller?.username && activeCard.user_id !== user.id ? (
                      <button
                        type="button"
                        onClick={() => void handleMessageSeller(activeCard)}
                        disabled={messageStarting}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15 disabled:opacity-60"
                      >
                        {messageStarting ? "Opening…" : "Message seller"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CardCatMobileNav />
    </main>
  );
}
