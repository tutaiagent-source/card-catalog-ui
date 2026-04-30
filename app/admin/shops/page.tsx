"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { useUserProfile } from "@/lib/useUserProfile";

type PendingShop = {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_website: string;
  shop_verification_status: string;
  created_at?: string;
};

export default function AdminShopsPage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const { profile, refreshProfile } = useUserProfile(user?.id);

  const isAdmin = useMemo(() => String(profile?.username || "").trim().toLowerCase() === "cardcat", [profile?.username]);

  const [pending, setPending] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchPending() {
    setError("");
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;
    if (!isAdmin) return;

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Missing session token. Try signing out/in.");

      const resp = await fetch("/api/admin/shops/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(payload?.error || "Failed to load pending shops.");

      setPending((payload?.pending ?? []) as PendingShop[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pending shops.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    void fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function reviewShop(profileId: string, action: "approve" | "reject") {
    setError("");
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    setSavingId(profileId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Missing session token.");

      const resp = await fetch("/api/admin/shops/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profile_id: profileId, action }),
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(payload?.error || "Update failed.");

      await refreshProfile();
      await fetchPending();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  }

  if (userLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 text-slate-300">Loading admin…</div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Not authorized</h1>
          <p className="mt-3 text-slate-300">Only @cardcat can review shop verification.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold">Shop verification queue</h1>
        <p className="mt-2 text-sm text-slate-400">Approve/reject pending card shop profiles.</p>

        {error ? <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Pending shops</div>
            <div className="text-xs text-slate-400">{loading ? "Loading…" : `${pending.length} pending`}</div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">No pending shops right now.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {pending.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{p.shop_name || p.display_name || `@${p.username}`}</div>
                      <div className="mt-1 text-xs text-slate-400">@{p.username}</div>
                      <div className="mt-3 space-y-1 text-sm text-slate-300">
                        {p.shop_address ? <div><span className="text-slate-400">Address:</span> {p.shop_address}</div> : null}
                        {p.shop_phone ? <div><span className="text-slate-400">Phone:</span> {p.shop_phone}</div> : null}
                        {p.shop_website ? <div><span className="text-slate-400">Website:</span> {p.shop_website}</div> : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => void reviewShop(p.id, "approve")}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                      >
                        {savingId === p.id ? "Updating…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => void reviewShop(p.id, "reject")}
                        className="rounded-xl border border-red-500/30 bg-red-500/[0.10] px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/[0.15] disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
