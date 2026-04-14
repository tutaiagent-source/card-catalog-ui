"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

export default function LoginPage() {
  const { user, loading } = useSupabaseUser();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/catalog";
    }
  }, [loading, user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!supabaseConfigured || !supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email.");
      return;
    }

    setSending(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/catalog`,
      },
    });
    setSending(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Check your email for the sign-in link.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold">Sign in to Card Catalog</h1>
        <p className="mt-3 text-slate-300">
          We’ll email you a sign-in link so you can save and manage your collection.
        </p>

        <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <label className="block">
            <div className="mb-2 text-sm text-slate-300">Email</div>
            <input
              type="email"
              className="w-full rounded bg-slate-950 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {message ? <div className="mt-4 rounded border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</div> : null}
          {error ? <div className="mt-4 rounded border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">{error}</div> : null}

          <button
            type="submit"
            disabled={sending}
            className="mt-5 w-full rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000] disabled:opacity-60"
          >
            {sending ? "Sending..." : "Email me a sign-in link"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-400">
          Already signed in? <a href="/catalog" className="text-red-300 hover:underline">Go to your catalog</a>
        </div>
      </div>
    </main>
  );
}
