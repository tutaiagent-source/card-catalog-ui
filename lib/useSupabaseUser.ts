"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

// Reduce Supabase auth request storms on mobile (especially when you’re
// approaching Supabase rate limits) by sharing a single in-flight `getUser`
// and a shared auth-state listener across all hook instances.
const CACHE_TTL_MS = 10_000;
let cachedUser: User | null = null;
let cachedAt = 0;
let inflightUserPromise: Promise<User | null> | null = null;

type Subscriber = (u: User | null) => void;
const subscribers = new Set<Subscriber>();

let listenerStarted = false;
let listenerSubscription: any = null;

async function fetchUserOnce(): Promise<User | null> {
  if (Date.now() - cachedAt < CACHE_TTL_MS) return cachedUser;
  if (inflightUserPromise) return inflightUserPromise;

  if (!supabase) return null;

  inflightUserPromise = supabase.auth
    .getUser()
    .then(({ data }) => {
      cachedUser = data.user ?? null;
      cachedAt = Date.now();
      return cachedUser;
    })
    .catch(() => {
      cachedUser = null;
      cachedAt = Date.now();
      return cachedUser;
    })
    .finally(() => {
      inflightUserPromise = null;
    });

  return inflightUserPromise;
}

function startAuthListener() {
  if (!supabase) return;
  if (listenerStarted) return;
  listenerStarted = true;

  listenerSubscription = supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user ?? null;
    cachedAt = Date.now();
    for (const fn of subscribers) {
      try {
        fn(cachedUser);
      } catch (_e) {
        // ignore
      }
    }
  });
}

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const update = (u: User | null) => {
      if (!active) return;
      setUser(u);
      setLoading(false);
    };

    subscribers.add(update);

    try {
      startAuthListener();
    } catch (_e) {
      // ignore; fetchUserOnce will still resolve initial state.
    }

    setLoading(true);
    void fetchUserOnce().then((u) => update(u));

    return () => {
      active = false;
      subscribers.delete(update);

      if (subscribers.size === 0) {
        // Best-effort cleanup.
        try {
          const unsub = listenerSubscription?.subscription?.unsubscribe ?? listenerSubscription?.unsubscribe;
          if (unsub) unsub.call(listenerSubscription);
        } catch (_e) {
          // ignore
        }
        listenerStarted = false;
        listenerSubscription = null;
      }
    };
  }, []);

  return { user, loading };
}
