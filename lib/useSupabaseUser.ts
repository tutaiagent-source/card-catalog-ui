"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    let sub: any = null;

    // Supabase can fail in certain mobile/private-network contexts
    // (storage/cookie restrictions). We must catch to avoid unhandled
    // rejections that can crash older browsers.
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setLoading(false);
      });

    try {
      ({ data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }));
    } catch (_e) {
      // If the listener cannot be attached (common in some constrained
      // mobile/privacy contexts), we just treat this as logged-out.
      if (active) {
        setUser(null);
        setLoading(false);
      }
    }

    return () => {
      active = false;
      try {
        if (sub?.subscription?.unsubscribe) sub.subscription.unsubscribe();
        else if (sub?.unsubscribe) sub.unsubscribe();
      } catch (_e) {
        // ignore
      }
    };
  }, []);

  return { user, loading };
}
