// app/add-card/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import {
  normalizeBrandAndSet,
  normalizeCatalogTaxonomy,
  SOCCER_COMPETITION_OPTIONS,
  SPORT_OPTIONS,
} from "@/lib/cardTaxonomy";
import { buildSellerNotes, parseSellerMeta } from "@/lib/cardSellerMeta";
import { usePlanPreview } from "@/lib/planPreview";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";

type YesNo = "yes" | "no";
type CardStatus = "Collection" | "Listed" | "Sold";

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
  competition?: string | null;

  rookie: YesNo;
  is_autograph: YesNo;
  has_memorabilia: YesNo;

  graded: YesNo;
  grade: number | null;

  serial_number_text: string;
  quantity: number;

  estimated_price?: number | null;

  image_url?: string;
  back_image_url?: string;

  status?: CardStatus | string;
  asking_price?: number | null;
  listed_at?: string;
  sold_price?: number | null;
  sold_at?: string;
  sale_platform?: string;
  cost_basis?: number | null;
  shipping_cost?: number | null;
  platform_fee?: number | null;
  notes?: string;
  date_added?: string;
};

const requiredFields = [
  "player_name",
  "year",
  "brand",
  "set_name",
  "card_number",
  "team",
  "sport",
] as const;

function validate(card: Partial<Card>) {
  const missing: string[] = [];
  for (const f of requiredFields) {
    const v = (card as any)[f];
    if (!v || String(v).trim() === "" || String(v).trim().toLowerCase() === "n/a") missing.push(f);
  }
  return missing;
}

function storageKey() {
  return "cards_v1";
}

const draftKey = "card_draft_v1";

function normalizeStatusValue(status?: string | null): CardStatus {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw || raw === "incoming" || raw === "collection") return "Collection";
  if (raw === "listed") return "Listed";
  if (raw === "sold") return "Sold";
  return "Collection";
}

function normalizeParallelLabel(p: string | undefined | null) {
  const raw = String(p ?? "").trim();
  if (!raw || raw.toLowerCase() === "n/a") return "n/a";
  const v = raw.replace(/\s+/g, " ");
  const lower = v.toLowerCase();
  if (lower === "parallel") return "Parallel";
  if (lower === "insert") return "Insert";
  if (lower.includes("parallel") && lower.includes("insert")) return "Parallel/Insert";
  return v;
}

function DateField({
  label,
  value,
  onChange,
  pickerRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  pickerRef: { current: HTMLInputElement | null };
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-slate-300">{label}</div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded bg-slate-950 px-3 py-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="YYYY-MM-DD"
          inputMode="numeric"
        />
        <button
          type="button"
          className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
          onClick={() => onChange(new Date().toISOString().slice(0, 10))}
        >
          Today
        </button>
        <button
          type="button"
          className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
          onClick={() => {
            const input = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
            if (!input) return;
            if (typeof input.showPicker === "function") input.showPicker();
            else input.click();
          }}
          aria-label={`Pick ${label}`}
        >
          📅
        </button>
      </div>
      <input
        ref={pickerRef}
        type="date"
        className="sr-only"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="mt-1 text-xs text-slate-400">Type the date directly, use Today, or click the calendar.</div>
    </label>
  );
}

function normalizeCards(cards: Card[]) {
  let changed = false;
  const fixed = cards.map((c) => {
    if (c && !c.id) {
      changed = true;
      return { ...c, id: crypto.randomUUID() };
    }
    return c;
  });
  return { fixed, changed };
}

function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Card[];
    const { fixed, changed } = normalizeCards(parsed);
    if (changed) localStorage.setItem(storageKey(), JSON.stringify(fixed));
    return fixed;
  } catch {
    return [];
  }
}

function saveCards(cards: Card[]) {
  localStorage.setItem(storageKey(), JSON.stringify(cards));
}

const stepLabels = ["Identity", "Details", "Value", "Images"];

export default function AddCardPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const { isCollectorPreview } = usePlanPreview();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [addToPC, setAddToPC] = useState(false);

  const [card, setCard] = useState<Partial<Card>>({
    parallel: "n/a",
    competition: "",
    rookie: "no",
    is_autograph: "no",
    has_memorabilia: "no",
    graded: "no",
    grade: 1,
    serial_number_text: "",
    quantity: 1,
    status: "Collection",
    notes: "",
  });

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<"front" | "back" | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingFront, setDraggingFront] = useState(false);
  const [draggingBack, setDraggingBack] = useState(false);

  const playerNameRef = useRef<HTMLInputElement | null>(null);
  const cardNumberRef = useRef<HTMLInputElement | null>(null);
  const rookieSelectRef = useRef<HTMLSelectElement | null>(null);
  const frontFileRef = useRef<HTMLInputElement | null>(null);
  const listedDatePickerRef = useRef<HTMLInputElement | null>(null);
  const soldDatePickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === 1) playerNameRef.current?.focus();
    else if (step === 2) cardNumberRef.current?.focus();
    else if (step === 3) rookieSelectRef.current?.focus();
    else if (step === 4) frontFileRef.current?.focus();
  }, [step]);

  const missing = useMemo(() => validate(card), [card]);

  const set = (k: keyof Card, v: any) => setCard((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditingId(params.get("edit"));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    if (!user?.id) return;
    if (!supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", editingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load card for edit:", error);
        return;
      }

      if (data) {
        const normalizedStatus = normalizeStatusValue((data as any)?.status);
        const normalized = normalizeCatalogTaxonomy({ ...(data as any), status: normalizedStatus });
        const seller = parseSellerMeta(normalized.notes);
        setCard({
          ...normalized,
          notes: seller.publicNotes,
          cost_basis: seller.meta.costBasis,
          shipping_cost: seller.meta.shippingCost,
          platform_fee: seller.meta.platformFee,
        });
        setAddToPC((data as any)?.pc_position != null);
        setStep(normalizedStatus === "Sold" ? 3 : 1);
      }
    })();
  }, [editingId, user?.id]);

  useEffect(() => {
    if (editingId) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as { step?: number; card?: Partial<Card> };
      if (typeof d?.step === "number") setStep(d.step);
      if (d?.card) setCard(d.card);
    } catch {
      // ignore
    }
  }, [editingId]);

  useEffect(() => {
    if (editingId) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ step, card }));
    } catch {
      // ignore
    }
  }, [step, card, editingId]);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const m = validate(card);
      if (m.length) {
        alert(`Missing required fields (or they are n/a): ${m.join(", ")}`);
        return;
      }

      const normalizedBrandSet = normalizeBrandAndSet(String(card.brand || ""), String(card.set_name || ""));
      const sellerNotes = buildSellerNotes(String(card.notes || ""), {
        costBasis: card.cost_basis ?? null,
        shippingCost: card.shipping_cost ?? null,
        platformFee: card.platform_fee ?? null,
      });

      const cleaned = normalizeCatalogTaxonomy({
        id: card.id ?? crypto.randomUUID(),

        player_name: String(card.player_name || ""),
        year: String(card.year || ""),
        brand: normalizedBrandSet.brand,
        set_name: normalizedBrandSet.set_name,
        parallel: normalizeParallelLabel(String(card.parallel || "n/a")),

        card_number: String(card.card_number || ""),
        team: String(card.team || ""),
        sport: String(card.sport || ""),
        competition: String(card.competition || ""),

        rookie: (card.rookie as YesNo) || "no",
        is_autograph: (card.is_autograph as YesNo) || "no",
        has_memorabilia: (card.has_memorabilia as YesNo) || "no",

        graded: (card.graded as YesNo) || "no",
        grade: ((card.graded as YesNo) || "no") === "yes" ? Number(card.grade || 1) : null,
        estimated_price: card.estimated_price == null ? null : Number(card.estimated_price),

        serial_number_text: String(card.serial_number_text || ""),
        quantity: Number(card.quantity || 1),

        image_url: (card.image_url || "").trim() ? String(card.image_url) : undefined,
        back_image_url: (card.back_image_url || "").trim() ? String(card.back_image_url) : undefined,

        status: normalizeStatusValue(card.status),
        asking_price: normalizeStatusValue(card.status) === "Listed" && card.asking_price != null ? Number(card.asking_price) : null,
        listed_at: normalizeStatusValue(card.status) === "Listed" ? String(card.listed_at || new Date().toISOString().slice(0, 10)) : "",
        sold_price: normalizeStatusValue(card.status) === "Sold" && card.sold_price != null ? Number(card.sold_price) : null,
        sold_at: normalizeStatusValue(card.status) === "Sold" ? String(card.sold_at || new Date().toISOString().slice(0, 10)) : "",
        sale_platform: normalizeStatusValue(card.status) === "Collection" ? "" : String(card.sale_platform || ""),
        cost_basis: card.cost_basis == null ? null : Number(card.cost_basis),
        shipping_cost: card.shipping_cost == null ? null : Number(card.shipping_cost),
        platform_fee: card.platform_fee == null ? null : Number(card.platform_fee),
        notes: sellerNotes,
        date_added: String(card.date_added || ""),
      }) as Card;

      if (!supabaseConfigured || !supabase) {
        alert("Supabase isn’t configured yet.");
        return;
      }

      if (!user?.id) {
        alert("You need to sign in before saving cards.");
        return;
      }

      const row: Record<string, any> = {
        user_id: user.id,

        player_name: cleaned.player_name,
        year: cleaned.year,
        brand: cleaned.brand,
        set_name: cleaned.set_name,
        parallel: cleaned.parallel,

        card_number: cleaned.card_number,
        team: cleaned.team,
        sport: cleaned.sport,

        rookie: cleaned.rookie,
        is_autograph: cleaned.is_autograph,
        has_memorabilia: cleaned.has_memorabilia,

        graded: cleaned.graded,
        grade: cleaned.grade,
        estimated_price: cleaned.estimated_price,

        serial_number_text: cleaned.serial_number_text,
        quantity: cleaned.quantity,

        image_url: cleaned.image_url ?? null,
        back_image_url: cleaned.back_image_url ?? null,

        status: cleaned.status,
        asking_price: cleaned.asking_price,
        listed_at: cleaned.listed_at || null,
        sold_price: cleaned.sold_price,
        sold_at: cleaned.sold_at || null,
        sale_platform: cleaned.sale_platform || null,
        notes: cleaned.notes,
        date_added: cleaned.date_added,
        pc_position: addToPC ? Date.now() : null,
      };

      if (String(cleaned.competition || "").trim()) {
        row.competition = String(cleaned.competition).trim();
      }

      if (editingId) {
        const { error } = await supabase
          .from("cards")
          .update(row)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          alert(`Save failed: ${error.message}`);
          return;
        }

        localStorage.removeItem(draftKey);
        window.location.href = "/catalog";
        return;
      }

      // If the same card identity already exists, offer to update quantity instead of inserting a duplicate.
      let existingMatchQuery = supabase
        .from("cards")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("player_name", cleaned.player_name)
        .eq("year", cleaned.year)
        .eq("brand", cleaned.brand)
        .eq("set_name", cleaned.set_name)
        .eq("parallel", cleaned.parallel)
        .eq("card_number", cleaned.card_number)
        .eq("team", cleaned.team)
        .eq("sport", cleaned.sport)
        .eq("rookie", cleaned.rookie)
        .eq("is_autograph", cleaned.is_autograph)
        .eq("has_memorabilia", cleaned.has_memorabilia)
        .eq("graded", cleaned.graded)
        .eq("serial_number_text", cleaned.serial_number_text);

      if (String(cleaned.competition || "").trim()) {
        existingMatchQuery = existingMatchQuery.eq("competition", String(cleaned.competition).trim());
      }

      const { data: existingMatches, error: matchErr } = await existingMatchQuery.limit(1);

      if (!matchErr && existingMatches && existingMatches.length > 0) {
        const existing = existingMatches[0] as any;
        const existingQty = Number(existing?.quantity ?? 0);
        const addQty = Number(cleaned.quantity ?? 1);

        const ok = confirm(
          `That card already exists (current quantity: ${existingQty}). Add ${addQty} more to it instead of creating a duplicate?`
        );

        if (ok) {
          const updatePayload: any = {
            quantity: existingQty + addQty,
            graded: cleaned.graded,
            grade: cleaned.grade,
            estimated_price: cleaned.estimated_price,
          };

          if (addToPC) updatePayload.pc_position = Date.now();
          if (cleaned.image_url !== undefined) updatePayload.image_url = cleaned.image_url;
          if (cleaned.back_image_url !== undefined) updatePayload.back_image_url = cleaned.back_image_url;

          const { error: upErr } = await supabase
            .from("cards")
            .update(updatePayload)
            .eq("id", existing.id)
            .eq("user_id", user.id);

          if (upErr) {
            alert(`Save failed: ${upErr.message}`);
            return;
          }

          localStorage.removeItem(draftKey);
          setPostSaveModalOpen(true);
          return;
        }
      }

      const { error } = await supabase.from("cards").insert(row);

      if (error) {
        alert(`Save failed: ${error.message}`);
        return;
      }

      localStorage.removeItem(draftKey);
      setPostSaveModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const uploadToSupabase = async (file: File, kind: "front" | "back") => {
    setUploadError("");

    if (!supabaseConfigured) {
      setUploadError("Supabase isn’t configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    if (!supabase) {
      setUploadError("Supabase client not available yet.");
      return;
    }

    const bucket = "card-images";
    const folder = kind === "front" ? "front" : "back";
    const path = `${crypto.randomUUID()}/${folder}/${file.name}`;

    try {
      const allowedMimes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
      const MAX_BYTES = 6 * 1024 * 1024; // 6MB
      const MAX_DIM = 2500;

      const mime = file.type || "";
      if (!allowedMimes.has(mime)) {
        throw new Error("Only PNG, JPG, WebP, or GIF images are allowed.");
      }

      if (file.size > MAX_BYTES) {
        throw new Error("Image is too large (max 6MB). Please use a smaller file.");
      }

      // Basic dimension check (prevents giant images from killing the UI)
      await new Promise<void>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || 0;
          const h = img.naturalHeight || 0;
          URL.revokeObjectURL(url);
          if (w > MAX_DIM || h > MAX_DIM) {
            reject(new Error(`Image dimensions are too large (max ${MAX_DIM}×${MAX_DIM}).`));
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Could not read that image file."));
        };
        img.src = url;
      });

      setUploading(kind);
      const { error: uploadErr } = await supabase!.storage.from(bucket).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

      if (uploadErr) throw uploadErr;

      const { data } = supabase!.storage.from(bucket).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      if (kind === "front") set("image_url", publicUrl);
      else set("back_image_url", publicUrl);
    } catch (e: any) {
      setUploadError(e?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16 text-slate-300">Loading card editor...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign in required</h1>
          <p className="mt-3 text-slate-300">Please sign in before adding or editing cards.</p>
          <a
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
          >
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardCatLogo />
            <h1 className="mt-3 text-2xl font-bold">{editingId ? "Edit Card" : "Add Card"}</h1>
            <div className="mt-1 text-sm text-slate-400">Signed in as {user.email}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {editingId && (
              <button
                type="button"
                disabled={saving}
                className="rounded-lg bg-[#d50000] px-4 py-2 text-sm font-semibold hover:bg-[#b80000] disabled:opacity-60"
                onClick={onSave}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            )}
            <a className="text-red-300 hover:underline" href="/catalog">
              Back to Catalog
            </a>
            <a className="text-red-300 hover:underline" href="/sold">
              Sold
            </a>
            <a className="text-red-300 hover:underline" href="/account">
              My Account
            </a>
            <button
              type="button"
              className="rounded bg-slate-800 px-3 py-1 text-sm font-semibold hover:bg-slate-700"
              onClick={async () => {
                if (!supabaseConfigured || !supabase) return;
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-300">Step {step} of 4</div>
              <div className="text-xs text-slate-400">{stepLabels[step - 1]}{editingId ? " · Jump between sections and save anytime." : ""}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {stepLabels.map((label, index) => {
                const stepNumber = index + 1;
                const active = stepNumber === step;
                const complete = stepNumber < step;
                const canJump = Boolean(editingId);
                return canJump ? (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(stepNumber)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-amber-500/15 text-amber-200" : complete ? "bg-emerald-500/12 text-emerald-200" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                  >
                    {stepNumber}. {label}
                  </button>
                ) : (
                  <div
                    key={label}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-amber-500/15 text-amber-200" : complete ? "bg-emerald-500/12 text-emerald-200" : "bg-slate-900 text-slate-400"}`}
                  >
                    {stepNumber}. {label}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d50000] via-red-500 to-amber-400" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const ok =
                  String(card.player_name || "").trim() &&
                  String(card.year || "").trim() &&
                  String(card.brand || "").trim() &&
                  String(card.set_name || "").trim();
                if (!ok) {
                  alert("Please fill: player name, year, brand, and set name.");
                  return;
                }
                setStep(2);
              }}
            >
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Card identity</h2>

                <label className="block">
                  <div className="mb-1 text-slate-300">Player name *</div>
                  <input
                    ref={playerNameRef}
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={String(card.player_name || "")}
                    onChange={(e) => set("player_name", e.target.value)}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="mb-1 text-slate-300">Year *</div>
                    <input
                      className="w-full rounded bg-slate-950 px-3 py-2"
                      value={String(card.year || "")}
                      onChange={(e) => set("year", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-slate-300">Parallel/Insert</div>
                    <input
                      className="w-full rounded bg-slate-950 px-3 py-2"
                      value={String(card.parallel || "")}
                      onChange={(e) => set("parallel", e.target.value)}
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="mb-1 text-slate-300">Brand *</div>
                  <input
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={String(card.brand || "")}
                    onChange={(e) => set("brand", e.target.value)}
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-slate-300">Set name *</div>
                  <input
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={String(card.set_name || "")}
                    onChange={(e) => set("set_name", e.target.value)}
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const ok =
                  String(card.card_number || "").trim() &&
                  String(card.team || "").trim() &&
                  String(card.sport || "").trim();
                if (!ok) {
                  alert("Please fill: card number, team, and sport.");
                  return;
                }
                setStep(3);
              }}
            >
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Numbers & team</h2>

                <label className="block">
                  <div className="mb-1 text-slate-300">Card number (back “No.”) *</div>
                  <input
                    ref={cardNumberRef}
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={String(card.card_number || "")}
                    onChange={(e) => set("card_number", e.target.value)}
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="mb-1 text-slate-300">Team *</div>
                    <input
                      className="w-full rounded bg-slate-950 px-3 py-2"
                      value={String(card.team || "")}
                      onChange={(e) => set("team", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-slate-300">Sport *</div>
                    <select
                      className="w-full rounded bg-slate-950 px-3 py-2"
                      value={String(card.sport || "")}
                      onChange={(e) => {
                        const nextSport = e.target.value;
                        set("sport", nextSport);
                        if (nextSport !== "Soccer") set("competition", "");
                      }}
                    >
                      <option value="">Select sport</option>
                      {SPORT_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {String(card.sport || "") === "Soccer" ? (
                  <label className="block">
                    <div className="mb-1 text-slate-300">Competition (optional)</div>
                    <input
                      className="w-full rounded bg-slate-950 px-3 py-2"
                      list="soccer-competition-options"
                      placeholder="Premier League, UEFA Champions League, World Cup..."
                      value={String(card.competition || "")}
                      onChange={(e) => set("competition", e.target.value)}
                    />
                    <datalist id="soccer-competition-options">
                      {SOCCER_COMPETITION_OPTIONS.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                    <div className="mt-1 text-xs text-slate-500">Only shown for soccer, so it does not slow down the normal add flow.</div>
                  </label>
                ) : null}

                <label className="block">
                  <div className="mb-1 text-slate-300">Serial number text (optional)</div>
                  <input
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    placeholder="e.g. 071/199 or /50 or n/a"
                    value={String(card.serial_number_text || "")}
                    onChange={(e) => set("serial_number_text", e.target.value)}
                  />
                </label>

                <div className="flex justify-between">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(4);
              }}
            >
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Flags & quantity</h2>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block rounded border border-slate-800 p-3">
                    <div className="text-slate-300">Rookie</div>
                    <select
                      ref={rookieSelectRef}
                      className="mt-2 w-full rounded bg-slate-950 px-2 py-2"
                      value={String(card.rookie || "no")}
                      onChange={(e) => set("rookie", e.target.value)}
                    >
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </label>

                  <label className="block rounded border border-slate-800 p-3">
                    <div className="text-slate-300">Autograph</div>
                    <select
                      className="mt-2 w-full rounded bg-slate-950 px-2 py-2"
                      value={String(card.is_autograph || "no")}
                      onChange={(e) => set("is_autograph", e.target.value)}
                    >
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </label>

                  <label className="block rounded border border-slate-800 p-3">
                    <div className="text-slate-300">Memorabilia</div>
                    <select
                      className="mt-2 w-full rounded bg-slate-950 px-2 py-2"
                      value={String(card.has_memorabilia || "no")}
                      onChange={(e) => set("has_memorabilia", e.target.value)}
                    >
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </label>
                </div>

                <div className="rounded border border-slate-800 p-3">
                  <div className="text-slate-300">Graded?</div>
                  <select
                    className="mt-2 w-full rounded bg-slate-950 px-2 py-2"
                    value={String(card.graded || "no")}
                    onChange={(e) => set("graded", e.target.value)}
                  >
                    <option value="no">no</option>
                    <option value="yes">yes</option>
                  </select>

                  {String(card.graded || "no") === "yes" && (
                    <div className="mt-3">
                      <div className="text-slate-300 text-sm">Grade (1–10)</div>
                      <select
                        className="mt-1 w-full rounded bg-slate-950 px-3 py-2"
                        value={String(card.grade ?? 1)}
                        onChange={(e) => set("grade", Number(e.target.value))}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="rounded border border-slate-800 p-3">
                  <div className="text-slate-300">Estimated price (USD)</div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="flex-1 rounded bg-slate-950 px-3 py-2"
                      value={card.estimated_price ?? ""}
                      onChange={(e) => set("estimated_price", e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="e.g. 12.50"
                    />

                    <button
                      type="button"
                      className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                      onClick={() => {
                        const serialRaw = String(card.serial_number_text ?? "").trim();
                        const slashIdx = serialRaw.indexOf("/");
                        const serialForEbay = slashIdx >= 0 ? serialRaw.slice(slashIdx) : serialRaw;

                        const parts = [
                          card.player_name,
                          card.brand,
                          card.set_name,
                          card.card_number,
                          serialForEbay,
                        ]
                          .map((p) => String(p ?? "").trim())
                          .filter(Boolean);

                        const query = parts.join(" ");
                        const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
                        window.open(url, "_blank", "noreferrer");
                      }}
                    >
                      eBay
                    </button>
                  </div>
                </div>

                <div className="rounded border border-slate-800 p-3 space-y-3">
                  <div>
                    <div className="text-slate-300">Status</div>
                    <select
                      className="mt-2 w-full rounded bg-slate-950 px-2 py-2"
                      value={String(card.status || "Collection")}
                      onChange={(e) => set("status", e.target.value)}
                    >
                      <option value="Collection">Collection</option>
                      <option value="Listed">Listed</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      id="add-to-pc"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                      checked={addToPC}
                      onChange={(e) => setAddToPC(e.target.checked)}
                    />
                    <label htmlFor="add-to-pc" className="text-sm text-slate-300">
                      Add to PC ★
                    </label>
                  </div>

                  {String(card.status || "Collection") === "Listed" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <div className="mb-1 text-sm text-slate-300">Asking price</div>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-full rounded bg-slate-950 px-3 py-2"
                          value={card.asking_price ?? ""}
                          onChange={(e) => set("asking_price", e.target.value === "" ? null : Number(e.target.value))}
                          placeholder="e.g. 35.00"
                        />
                      </label>
                      <DateField
                        label="Listed date"
                        value={String(card.listed_at || "")}
                        onChange={(value) => set("listed_at", value)}
                        pickerRef={listedDatePickerRef}
                      />
                      <label className="block">
                        <div className="mb-1 text-sm text-slate-300">Platform</div>
                        <input
                          className="w-full rounded bg-slate-950 px-3 py-2"
                          value={String(card.sale_platform || "")}
                          onChange={(e) => set("sale_platform", e.target.value)}
                          placeholder="eBay, Whatnot..."
                        />
                      </label>
                    </div>
                  )}

                  {String(card.status || "Collection") === "Sold" && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="block">
                        <div className="mb-1 text-sm text-slate-300">Sold for</div>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-full rounded bg-slate-950 px-3 py-2"
                          value={card.sold_price ?? ""}
                          onChange={(e) => set("sold_price", e.target.value === "" ? null : Number(e.target.value))}
                          placeholder="e.g. 28.00"
                        />
                      </label>
                      <DateField
                        label="Sold date"
                        value={String(card.sold_at || "")}
                        onChange={(value) => set("sold_at", value)}
                        pickerRef={soldDatePickerRef}
                      />
                      <label className="block">
                        <div className="mb-1 text-sm text-slate-300">Platform</div>
                        <input
                          className="w-full rounded bg-slate-950 px-3 py-2"
                          value={String(card.sale_platform || "")}
                          onChange={(e) => set("sale_platform", e.target.value)}
                          placeholder="eBay, local, show..."
                        />
                      </label>
                      {!isCollectorPreview ? (
                        <>
                          <label className="block">
                            <div className="mb-1 text-sm text-slate-300">Card cost</div>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-full rounded bg-slate-950 px-3 py-2"
                              value={card.cost_basis ?? ""}
                              onChange={(e) => set("cost_basis", e.target.value === "" ? null : Number(e.target.value))}
                              placeholder="Total cost"
                            />
                          </label>
                          <label className="block">
                            <div className="mb-1 text-sm text-slate-300">Platform fees</div>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-full rounded bg-slate-950 px-3 py-2"
                              value={card.platform_fee ?? ""}
                              onChange={(e) => set("platform_fee", e.target.value === "" ? null : Number(e.target.value))}
                              placeholder="Fees paid"
                            />
                          </label>
                          <label className="block">
                            <div className="mb-1 text-sm text-slate-300">Shipping cost</div>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-full rounded bg-slate-950 px-3 py-2"
                              value={card.shipping_cost ?? ""}
                              onChange={(e) => set("shipping_cost", e.target.value === "" ? null : Number(e.target.value))}
                              placeholder="Shipping paid"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  )}

                  {String(card.status || "Collection") === "Sold" && (
                    <div className={`rounded-xl border p-3 text-sm ${isCollectorPreview ? "border-amber-500/20 bg-amber-500/[0.08] text-amber-100" : "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-100"}`}>
                      {isCollectorPreview
                        ? "Collector preview keeps sold price, sold date, and platform. Card cost, fees, shipping, and profit math show up in Pro."
                        : "Seller metrics stay attached to the card so CardCat can calculate net profit and ROI on the Sold dashboard."}
                    </div>
                  )}
                </div>

                <label className="block">
                  <div className="mb-1 text-slate-300">Quantity</div>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded bg-slate-950 px-3 py-2"
                    value={Number(card.quantity || 1)}
                    onChange={(e) => set("quantity", Math.max(1, Number(e.target.value || 1)))}
                  />
                </label>

                <div className="flex justify-between">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 4 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSave();
              }}
            >
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Images (optional)</h2>

                <div className="text-xs text-slate-400">
                  Supabase configured: {supabaseConfigured ? "Yes" : "No"} (bucket: card-images)
                </div>

                {uploadError && (
                  <div className="rounded-lg border border-amber-600 bg-amber-950/30 p-3 text-amber-200">
                    {uploadError}
                  </div>
                )}

                <div className="rounded border border-slate-800 p-3">
                  <div className="text-sm font-semibold">Front</div>

                  <label
                    className={`mt-2 relative block cursor-pointer overflow-hidden rounded bg-slate-800 px-3 py-2 text-center text-sm font-semibold hover:bg-slate-700 border-2 border-dashed ${
                      draggingFront ? "border-[#d50000] ring-2 ring-[#d50000]/30" : "border-slate-600"
                    }`}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggingFront(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDraggingFront(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDraggingFront(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingFront(false);
                      const f = e.dataTransfer.files?.[0] ?? null;
                      if (!f) return;
                      if (!f.type.startsWith("image/")) return;
                      setFrontFile(f);
                      if (uploading !== "front") uploadToSupabase(f, "front");
                    }}
                  >
                    {draggingFront
                      ? "Drop front image to upload"
                      : frontFile
                        ? "Change front image (click or drag)"
                        : "Click or drag a front image to upload"}
                    <input
                      ref={frontFileRef}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setFrontFile(f);
                        if (f && uploading !== "front") uploadToSupabase(f, "front");
                      }}
                    />
                  </label>

                  <div className="mt-2 text-xs text-slate-400">
                    {draggingFront
                      ? "Drop to upload front image"
                      : frontFile
                        ? `Selected: ${frontFile.name}`
                        : "Click or drag a front image to upload."}
                  </div>

                  {uploading === "front" ? (
                    <div className="mt-2 text-xs text-slate-400">Uploading front…</div>
                  ) : card.image_url ? (
                    <div className="mt-2 text-xs text-slate-400">Front uploaded ✓</div>
                  ) : (
                    frontFile && <div className="mt-2 text-xs text-slate-400">Uploading will start automatically</div>
                  )}

                  <div className="mt-3 text-xs text-slate-400">Or paste a URL (optional)</div>
                  <input
                    className="mt-1 w-full rounded bg-slate-950 px-3 py-2 text-sm"
                    value={String(card.image_url || "")}
                    onChange={(e) => set("image_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="rounded border border-slate-800 p-3">
                  <div className="text-sm font-semibold">Back</div>

                  <label
                    className={`mt-2 relative block cursor-pointer overflow-hidden rounded bg-slate-800 px-3 py-2 text-center text-sm font-semibold hover:bg-slate-700 border-2 border-dashed ${
                      draggingBack ? "border-[#d50000] ring-2 ring-[#d50000]/30" : "border-slate-600"
                    }`}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggingBack(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDraggingBack(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDraggingBack(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingBack(false);
                      const f = e.dataTransfer.files?.[0] ?? null;
                      if (!f) return;
                      if (!f.type.startsWith("image/")) return;
                      setBackFile(f);
                      if (uploading !== "back") uploadToSupabase(f, "back");
                    }}
                  >
                    {draggingBack
                      ? "Drop back image to upload"
                      : backFile
                        ? "Change back image (click or drag)"
                        : "Click or drag a back image to upload"}
                    <input
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setBackFile(f);
                        if (f && uploading !== "back") uploadToSupabase(f, "back");
                      }}
                    />
                  </label>

                  <div className="mt-2 text-xs text-slate-400">
                    {draggingBack
                      ? "Drop to upload back image"
                      : backFile
                        ? `Selected: ${backFile.name}`
                        : "Click or drag a back image to upload."}
                  </div>

                  {uploading === "back" ? (
                    <div className="mt-2 text-xs text-slate-400">Uploading back…</div>
                  ) : card.back_image_url ? (
                    <div className="mt-2 text-xs text-slate-400">Back uploaded ✓</div>
                  ) : (
                    backFile && <div className="mt-2 text-xs text-slate-400">Uploading will start automatically</div>
                  )}

                  <div className="mt-3 text-xs text-slate-400">Or paste a URL (optional)</div>
                  <input
                    className="mt-1 w-full rounded bg-slate-950 px-3 py-2 text-sm"
                    value={String(card.back_image_url || "")}
                    onChange={(e) => set("back_image_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
                    onClick={() => setStep(3)}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      uploading === "front" ||
                      (Boolean(frontFile) && !card.image_url) ||
                      uploading === "back" ||
                      (Boolean(backFile) && !card.back_image_url)
                    }
                    className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000] disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Card"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      {postSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
            <div className="text-lg font-bold">Saved!</div>
            <div className="mt-2 text-sm text-slate-300">Add another card, or go to collection.</div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]"
                onClick={() => {
                  setPostSaveModalOpen(false);
                  setStep(1);
                  setCard({
                    parallel: "n/a",
                    competition: "",
                    rookie: "no",
                    is_autograph: "no",
                    has_memorabilia: "no",
                    graded: "no",
                    grade: 1,
                    serial_number_text: "",
                    quantity: 1,
                    status: "Collection",
                    cost_basis: null,
                    shipping_cost: null,
                    platform_fee: null,
                    notes: "",
                  });
                  setFrontFile(null);
                  setBackFile(null);
                  setUploading(null);
                  setUploadError("");
                }}
              >
                Add another card
              </button>

              <button
                type="button"
                className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
                onClick={() => {
                  setPostSaveModalOpen(false);
                  window.location.href = "/catalog";
                }}
              >
                Go to collection
              </button>
            </div>
          </div>
        </div>
      )}

      <CardCatMobileNav />
    </main>
  );
}
