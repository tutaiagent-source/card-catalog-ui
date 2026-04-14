"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

type Mode = "signin" | "signup" | "magic";

export default function LoginPage() {
  const { user, loading } = useSupabaseUser();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/catalog";
    }
  }, [loading, user]);

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const onPasswordSignIn = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!supabaseConfigured || !supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setWorking(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setWorking(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    window.location.href = "/catalog";
  };

  const onPasswordSignUp = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!supabaseConfigured || !supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
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

    setWorking(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/catalog`,
      },
    });
    setWorking(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Account created. Check your email to confirm your account, then sign in.");
    setMode("signin");
  };

  const onMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!supabaseConfigured || !supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email.");
      return;
    }

    setWorking(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/catalog`,
      },
    });
    setWorking(false);

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
          Use a password or a magic link to save and manage your collection.
        </p>

        <div className="mt-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
          <button
            type="button"
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === "signin" ? "bg-[#d50000]" : "bg-slate-950 hover:bg-slate-800"}`}
            onClick={() => {
              resetMessages();
              setMode("signin");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-[#d50000]" : "bg-slate-950 hover:bg-slate-800"}`}
            onClick={() => {
              resetMessages();
              setMode("signup");
            }}
          >
            Create account
          </button>
          <button
            type="button"
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === "magic" ? "bg-[#d50000]" : "bg-slate-950 hover:bg-slate-800"}`}
            onClick={() => {
              resetMessages();
              setMode("magic");
            }}
          >
            Magic link
          </button>
        </div>

        <form
          onSubmit={mode === "signin" ? onPasswordSignIn : mode === "signup" ? onPasswordSignUp : onMagicLink}
          className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
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

          {mode !== "magic" && (
            <label className="mt-4 block">
              <div className="mb-2 text-sm text-slate-300">Password</div>
              <input
                type="password"
                className="w-full rounded bg-slate-950 px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </label>
          )}

          {mode === "signup" && (
            <label className="mt-4 block">
              <div className="mb-2 text-sm text-slate-300">Confirm password</div>
              <input
                type="password"
                className="w-full rounded bg-slate-950 px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
          )}

          {message ? <div className="mt-4 rounded border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</div> : null}
          {error ? <div className="mt-4 rounded border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">{error}</div> : null}

          <button
            type="submit"
            disabled={working}
            className="mt-5 w-full rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000] disabled:opacity-60"
          >
            {working
              ? mode === "magic"
                ? "Sending..."
                : "Working..."
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Email me a sign-in link"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-400">
          Already signed in? <a href="/catalog" className="text-red-300 hover:underline">Go to your catalog</a>
        </div>
      </div>
    </main>
  );
}
