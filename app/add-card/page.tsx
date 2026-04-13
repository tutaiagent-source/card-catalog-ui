// app/add-card/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

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

  serial_number_text: string;
  quantity: number;

  image_url?: string;
  back_image_url?: string;

  status?: string;
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

export default function AddCardPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testerKey, setTesterKey] = useState<string>("");
  const [step, setStep] = useState(1);

  const [card, setCard] = useState<Partial<Card>>({
    parallel: "n/a",
    rookie: "no",
    is_autograph: "no",
    has_memorabilia: "no",
    serial_number_text: "",
    quantity: 1,
    status: "Incoming",
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
    const tk = params.get("tester_key");

    if (tk) {
      setTesterKey(tk);
    } else {
      const existing = localStorage.getItem("tester_key");
      if (existing) {
        setTesterKey(existing);
      } else {
        const newKey = crypto.randomUUID();
        localStorage.setItem("tester_key", newKey);
        setTesterKey(newKey);
      }
    }

    setEditingId(params.get("edit"));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    if (!testerKey) return;
    if (!supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", editingId)
        .eq("tester_key", testerKey)
        .maybeSingle();

      if (error) {
        console.error("Failed to load card for edit:", error);
        return;
      }

      if (data) {
        setCard(data as any);
        setStep(1);
      }
    })();
  }, [editingId, testerKey]);

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

      const cleaned: Card = {
        id: card.id ?? crypto.randomUUID(),

        player_name: String(card.player_name || ""),
        year: String(card.year || ""),
        brand: String(card.brand || ""),
        set_name: String(card.set_name || ""),
        parallel: normalizeParallelLabel(String(card.parallel || "n/a")),

        card_number: String(card.card_number || ""),
        team: String(card.team || ""),
        sport: String(card.sport || ""),

        rookie: (card.rookie as YesNo) || "no",
        is_autograph: (card.is_autograph as YesNo) || "no",
        has_memorabilia: (card.has_memorabilia as YesNo) || "no",

        serial_number_text: String(card.serial_number_text || ""),
        quantity: Number(card.quantity || 1),

        image_url: (card.image_url || "").trim() ? String(card.image_url) : undefined,
        back_image_url: (card.back_image_url || "").trim() ? String(card.back_image_url) : undefined,

        status: String(card.status || "Incoming"),
        notes: String(card.notes || ""),
        date_added: String(card.date_added || ""),
      };

      if (!supabaseConfigured || !supabase) {
        alert("Supabase isn’t configured yet.");
        return;
      }

      if (!testerKey) {
        alert("Missing tester key.");
        return;
      }

      const row = {
        tester_key: testerKey,

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

        serial_number_text: cleaned.serial_number_text,
        quantity: cleaned.quantity,

        image_url: cleaned.image_url ?? null,
        back_image_url: cleaned.back_image_url ?? null,

        status: cleaned.status,
        notes: cleaned.notes,
        date_added: cleaned.date_added,
      };

      if (editingId) {
        const { error } = await supabase
          .from("cards")
          .update(row)
          .eq("id", editingId)
          .eq("tester_key", testerKey);

        if (error) {
          alert(`Save failed: ${error.message}`);
          return;
        }

        localStorage.removeItem(draftKey);
        window.location.href = `/catalog?tester_key=${encodeURIComponent(testerKey)}`;
        return;
      }

      // If the same card identity already exists, offer to update quantity instead of inserting a duplicate.
      const { data: existingMatches, error: matchErr } = await supabase
        .from("cards")
        .select("id, quantity")
        .eq("tester_key", testerKey)
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
        .eq("serial_number_text", cleaned.serial_number_text)
        .limit(1);

      if (!matchErr && existingMatches && existingMatches.length > 0) {
        const existing = existingMatches[0] as any;
        const existingQty = Number(existing?.quantity ?? 0);
        const addQty = Number(cleaned.quantity ?? 1);

        const ok = confirm(
          `That card already exists (current quantity: ${existingQty}). Add ${addQty} more to it instead of creating a duplicate?`
        );

        if (ok) {
          const updatePayload: any = { quantity: existingQty + addQty };

          if (cleaned.image_url !== undefined) updatePayload.image_url = cleaned.image_url;
          if (cleaned.back_image_url !== undefined) updatePayload.back_image_url = cleaned.back_image_url;

          const { error: upErr } = await supabase
            .from("cards")
            .update(updatePayload)
            .eq("id", existing.id)
            .eq("tester_key", testerKey);

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{editingId ? "Edit Card" : "Add Card"}</h1>
          <a className="text-red-300 hover:underline" href={`/catalog?tester_key=${encodeURIComponent(testerKey)}`}>
            Back to Catalog
          </a>
        </div>

        <div className="mt-6 text-sm text-slate-300">Step {step} of 4</div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
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

                <div className="grid grid-cols-2 gap-3">
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
                    <input
                      className="w-full rounded bg-slate-950 px-3 py-2"
                      value={String(card.sport || "")}
                      onChange={(e) => set("sport", e.target.value)}
                    />
                  </label>
                </div>

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
                    {frontFile ? "Change front image" : "Choose front image"}
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
                    {frontFile ? `Selected: ${frontFile.name}` : "Choose a front image to enable upload."}
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
                    {backFile ? "Change back image" : "Choose back image"}
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
                    {backFile ? `Selected: ${backFile.name}` : "Choose a back image to enable upload."}
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
                    disabled={saving}
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
                    rookie: "no",
                    is_autograph: "no",
                    has_memorabilia: "no",
                    serial_number_text: "",
                    quantity: 1,
                    status: "Incoming",
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
                  window.location.href = `/catalog?tester_key=${encodeURIComponent(testerKey)}`;
                }}
              >
                Go to collection
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
