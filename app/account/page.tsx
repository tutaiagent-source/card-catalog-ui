"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import CardCatMobileNav from "@/components/CardCatMobileNav";

type CardSummary = {
  quantity: number | null;
  estimated_price?: number | null;
};

export default function AccountPage() {
  const { user, loading } = useSupabaseUser();
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error: loadError } = await supabase
        .from("cards")
        .select("quantity, estimated_price")
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
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              CardCat.io
            </div>
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
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a href="/catalog" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Open catalog
            </a>
            <a href="/add-card" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Add a card
            </a>
            <a href="/sold" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
              Review sold cards
            </a>
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
