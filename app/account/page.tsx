"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { usePlanPreview } from "@/lib/planPreview";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";

type CardSummary = {
  id?: string;
  quantity: number | null;
  estimated_price?: number | null;
  status?: string | null;
};

export default function AccountPage() {
  const { user, loading } = useSupabaseUser();
  const { planPreview, setPlanPreview, isCollectorPreview } = usePlanPreview();
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingCatalog, setClearingCatalog] = useState(false);
  const [resettingSales, setResettingSales] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error: loadError } = await supabase
        .from("cards")
        .select("id, quantity, estimated_price, status")
        .eq("user_id", user.id);

      if (loadError) {
        setError(loadError.message);
        return;
      }

      setCards((data ?? []) as CardSummary[]);
    })();
  }, [user?.id]);

  const totalCards = useMemo(() => cards.reduce((sum, c) => sum + Number(c.quantity || 0), 0), [cards]);
  const estimatedTotal = useMemo(() => cards.reduce((sum, c) => sum + Number(c.quantity || 0) * Number(c.estimated_price || 0), 0), [cards]);
  const soldRows = useMemo(() => cards.filter((card) => String(card.status || "") === "Sold"), [cards]);
  const starterLimit = 100;
  const currentPlanPreview = isCollectorPreview ? "Collector" : "Pro";
  const usagePct = Math.min(100, Math.round((totalCards / starterLimit) * 100));

  const providers = useMemo(() => {
    const list = Array.isArray(user?.app_metadata?.providers) ? user?.app_metadata?.providers : [];
    return list.length ? list : [user?.app_metadata?.provider].filter(Boolean);
  }, [user?.app_metadata]);

  const onPasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!supabaseConfigured || !supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    if (!password) {
      setError("Enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated.");
  };

  const clearCatalog = async () => {
    setMessage("");
    setError("");

    if (!supabaseConfigured || !supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    if (!user?.id) return;

    const ok = confirm(`Clear your entire catalog? This will permanently delete ${cards.length} row${cards.length === 1 ? "" : "s"}.`);
    if (!ok) return;

    setClearingCatalog(true);
    const { error: deleteError } = await supabase.from("cards").delete().eq("user_id", user.id);
    setClearingCatalog(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setCards([]);
    setMessage("Catalog cleared.");
  };

  const resetSoldHistory = async () => {
    setMessage("");
    setError("");

    if (!supabaseConfigured || !supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    if (!user?.id) return;

    const soldIds = soldRows.map((card) => card.id).filter(Boolean) as string[];
    if (soldIds.length === 0) {
      setError("No sold history to reset.");
      return;
    }

    const ok = confirm(
      `Reset sold history for ${soldIds.length} sold row${soldIds.length === 1 ? "" : "s"}? This moves them back to Collection and removes them from the Sold dashboard.`
    );
    if (!ok) return;

    setResettingSales(true);
    const { error: resetError } = await supabase
      .from("cards")
      .update({ status: "Collection", sold_price: null, sold_at: null })
      .in("id", soldIds)
      .eq("user_id", user.id);
    setResettingSales(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setCards((prev) =>
      prev.map((card) =>
        card.id && soldIds.includes(card.id)
          ? { ...card, status: "Collection" }
          : card
      )
    );
    setMessage(`Reset sold history for ${soldIds.length} row${soldIds.length === 1 ? "" : "s"}.`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16 text-slate-300">Loading your account...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign in required</h1>
          <p className="mt-3 text-slate-300">Please sign in to view your account.</p>
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
            <h1 className="mt-3 text-2xl font-bold">My Account</h1>
            <div className="mt-1 text-sm text-slate-400">Manage your login and collection settings.</div>
          </div>
          <div className="flex gap-3">
            <a href="/catalog" className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700">
              Catalog
            </a>
            <a href="/sold" className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700">
              Sold
            </a>
            <button
              type="button"
              className="rounded bg-[#d50000] px-4 py-2 text-sm font-semibold hover:bg-[#b80000]"
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

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <h2 className="text-lg font-semibold">Profile</h2>
            <div className="mt-4 text-sm text-slate-300">Email</div>
            <div className="mt-1 font-medium">{user.email}</div>

            <div className="mt-4 text-sm text-slate-300">Sign-in methods</div>
            <div className="mt-1 text-sm text-slate-200">{providers.length ? providers.join(", ") : "email"}</div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.08)]">
            <h2 className="text-lg font-semibold">Collection summary</h2>
            <div className="mt-4 text-sm text-slate-300">Cards in collection</div>
            <div className="mt-1 text-2xl font-bold">{totalCards}</div>

            <div className="mt-4 text-sm text-slate-300">Estimated collection value</div>
            <div className="mt-1 text-2xl font-bold">${estimatedTotal.toFixed(2)}</div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <h2 className="text-lg font-semibold">Start here</h2>
          <p className="mt-2 text-sm text-slate-400">The seller-first workflow is simple: load cards in, keep a backup, track listed and sold inventory, then watch the sales dashboard.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["1. Add or import inventory", "Use Add Card for one-offs or Import CSV for an existing collection."],
              ["2. Keep a backup", "Export CSV from the Catalog anytime so your data stays portable."],
              ["3. Track sales cleanly", "Move cards to Listed or Sold and attach platform, fees, shipping, and card cost."],
              ["4. Watch the dashboard", "Use Sold to monitor revenue, net profit, ROI, and platform performance."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                <div className="text-sm font-semibold text-slate-100">{title}</div>
                <div className="mt-1 text-sm text-slate-400">{body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Plans and usage</h2>
              <p className="mt-1 text-sm text-slate-400">2-tier preview for launch: a limited Collector plan and an unlimited Pro plan with fair-use storage.</p>
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Previewing: {currentPlanPreview}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="text-sm font-semibold text-slate-200">Preview the paid-wall experience</div>
            <div className="mt-1 text-sm text-slate-400">Flip between Collector and Pro to see which tools stay visible, which tools get gated, and where upgrade prompts show up.</div>
            <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-slate-900/90 p-1">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${planPreview === "collector" ? "bg-white/[0.08] text-white" : "text-slate-300 hover:bg-white/[0.05]"}`}
                onClick={() => setPlanPreview("collector")}
              >
                Collector preview
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${planPreview === "pro" ? "bg-[#d50000] text-white" : "text-slate-300 hover:bg-white/[0.05]"}`}
                onClick={() => setPlanPreview("pro")}
              >
                Pro preview
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="font-semibold text-slate-200">Collector plan usage</div>
              <div className="text-slate-400">{totalCards} / {starterLimit} cards</div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-900">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(239,68,68,0.9))]" style={{ width: `${usagePct}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">Billing is not wired yet, but this gives the user-facing plan shape for launch.</div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-sm font-semibold text-slate-100">Collector</div>
              <div className="mt-1 text-sm text-slate-400">Starter tier, limited for personal collections and light selling.</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Up to 100 cards</li>
                <li>• Manual add/edit</li>
                <li>• Basic sold tracking</li>
                <li>• Basic dashboard</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
              <div className="text-sm font-semibold text-slate-100">Pro</div>
              <div className="mt-1 text-sm text-slate-400">Unlimited cards, CSV workflows, and deeper seller analytics.</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Unlimited cards, fair-use image storage</li>
                <li>• CSV import/export</li>
                <li>• Revenue, net profit, ROI, platform analytics</li>
                <li>• Bulk inventory tools</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href="/catalog" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Open catalog
            </a>
            <a href="/add-card" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Add a card
            </a>
            <a href="/import" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Import CSV
            </a>
            <a href="/sold" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Review sold cards
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <h2 className="text-lg font-semibold">Danger zone</h2>
          <p className="mt-2 text-sm text-slate-300">Use these when you need to rewind sales or wipe the whole catalog.</p>

          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
            <div className="text-sm font-semibold text-slate-100">Reset sold history</div>
            <div className="mt-1 text-sm text-slate-400">Moves sold cards back to Collection and clears their sold date and sold price.</div>
            <button
              type="button"
              className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={resetSoldHistory}
              disabled={resettingSales || soldRows.length === 0}
            >
              {resettingSales ? "Resetting sold history..." : `Reset sold history${soldRows.length ? ` (${soldRows.length})` : ""}`}
            </button>
            <div className="mt-2 text-xs text-slate-400">This keeps the cards, but removes them from the Sold dashboard.</div>
          </div>

          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
            <div className="text-sm font-semibold text-slate-100">Clear catalog</div>
            <div className="mt-1 text-sm text-slate-400">Permanently deletes every catalog row for this account.</div>
            <button
              type="button"
              className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={clearCatalog}
              disabled={clearingCatalog || cards.length === 0}
            >
              {clearingCatalog ? "Clearing catalog..." : "Clear catalog"}
            </button>
            <div className="mt-2 text-xs text-slate-400">This is permanent and deletes everything, not just sales history.</div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <h2 className="text-lg font-semibold">Change password</h2>
          <p className="mt-2 text-sm text-slate-400">Use this if you want password-based sign-in for your account.</p>

          <form onSubmit={onPasswordUpdate} className="mt-4 space-y-4">
            <label className="block">
              <div className="mb-2 text-sm text-slate-300">New password</div>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="flex-1 rounded bg-slate-950 px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rounded bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <label className="block">
              <div className="mb-2 text-sm text-slate-300">Confirm new password</div>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="flex-1 rounded bg-slate-950 px-3 py-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rounded bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            {message ? <div className="rounded border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</div> : null}
            {error ? <div className="rounded border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">{error}</div> : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000] disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
      <CardCatMobileNav />
    </main>
  );
}
