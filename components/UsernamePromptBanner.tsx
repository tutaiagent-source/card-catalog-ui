"use client";

import { useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { useUserProfile } from "@/lib/useUserProfile";

export default function UsernamePromptBanner({ userId }: { userId?: string | null }) {
  const { profile, loading, tableReady, refreshProfile } = useUserProfile(userId);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentUsername = String(profile?.username || "").trim();
  const visible = Boolean(userId) && tableReady && !loading && !currentUsername;

  const normalizedDraft = useMemo(() => normalizeUsername(draft), [draft]);

  if (!visible) return null;

  async function saveUsername() {
    if (!userId || !supabaseConfigured || !supabase) return;
    setError("");
    setMessage("");

    const normalized = normalizeUsername(draft);
    const validationError = validateUsername(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        username: normalized,
      },
      { onConflict: "id" }
    );
    setSaving(false);

    if (upsertError) {
      if (String(upsertError.message || "").toLowerCase().includes("duplicate") || String(upsertError.message || "").toLowerCase().includes("unique")) {
        setError("That username is already taken.");
      } else {
        setError(upsertError.message);
      }
      return;
    }

    setDraft("");
    setMessage(`Saved @${normalized}`);
    await refreshProfile();
  }

  return (
    <section className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4 shadow-[0_18px_40px_rgba(16,185,129,0.08)]">
      <div className="text-sm font-semibold text-white">Choose your CardCat username</div>
      <p className="mt-1 text-sm text-slate-200">
        You’ll need a username before member-to-member messaging goes live.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
          <span className="mr-1 text-slate-500">@</span>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(normalizeUsername(e.target.value));
              setError("");
              setMessage("");
            }}
            placeholder="choose_a_username"
            className="w-full bg-transparent outline-none"
            maxLength={24}
          />
        </div>
        <button
          type="button"
          onClick={saveUsername}
          disabled={saving}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save username"}
        </button>
      </div>

      <div className="mt-2 text-xs text-slate-300">Lowercase letters, numbers, and underscores only.</div>
      {normalizedDraft ? <div className="mt-1 text-xs text-slate-400">Preview: @{normalizedDraft}</div> : null}
      {error ? <div className="mt-2 text-sm text-red-300">{error}</div> : null}
      {message ? <div className="mt-2 text-sm text-emerald-200">{message}</div> : null}
    </section>
  );
}
