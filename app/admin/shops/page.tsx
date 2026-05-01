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
  shop_name?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_website?: string;

  pending_shop_name?: string;
  pending_shop_address?: string;
  pending_shop_phone?: string;
  pending_shop_website?: string;

  shop_verification_status: string;
  shop_admin_note?: string;
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
  const [adminNotesById, setAdminNotesById] = useState<Record<string, string>>({});

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

  async function reviewShop(profileId: string, action: "verify" | "request_changes" | "reject") {
    setError("");
    if (!supabaseConfigured || !supabase) return;
    if (!user?.id) return;

    const admin_note = action === "request_changes" ? String(adminNotesById[profileId] || "").trim() : "";

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
        body: JSON.stringify({ profile_id: profileId, action, admin_note }),
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
            <div className="text-sm font-semibold text-slate-200">Pending shop verification</div>
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
                  {(() => {
                    const status = String(p.shop_verification_status || "").toLowerCase();
                    const isReverification = status === "reverification_required";
                    const effectiveShopName = isReverification ? p.pending_shop_name : p.shop_name;
                    const effectiveAddress = isReverification ? p.pending_shop_address : p.shop_address;
                    const effectivePhone = isReverification ? p.pending_shop_phone : p.shop_phone;
                    const effectiveWebsite = isReverification ? p.pending_shop_website : p.shop_website;

                    return (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{effectiveShopName || p.display_name || `@${p.username}`}</div>
                      <div className="mt-1 text-xs text-slate-400">@{p.username}</div>
                      <div className="mt-3 space-y-1 text-sm text-slate-300">
                        {effectiveAddress ? (
                          <div>
                            <span className="text-slate-400">Address:</span> {effectiveAddress}
                          </div>
                        ) : null}
                        {effectivePhone ? (
                          <div>
                            <span className="text-slate-400">Phone:</span> {effectivePhone}
                          </div>
                        ) : null}
                        {effectiveWebsite ? (
                          <div>
                            <span className="text-slate-400">Website:</span> {effectiveWebsite}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-300">
                          {status === "pending_review"
                            ? "Pending review"
                            : status === "reverification_required"
                              ? "Re-verify requested"
                              : status}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 sm:w-72"
                        rows={2}
                        placeholder="Admin note (required for Request changes)"
                        value={adminNotesById[p.id] || ""}
                        onChange={(e) => setAdminNotesById((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />

                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => void reviewShop(p.id, "verify")}
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

                      <button
                        type="button"
                        disabled={savingId === p.id || !String(adminNotesById[p.id] || "").trim()}
                        onClick={() => void reviewShop(p.id, "request_changes")}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/[0.10] px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/[0.15] disabled:opacity-60"
                      >
                        Request changes
                      </button>
                    </div>
                  </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
