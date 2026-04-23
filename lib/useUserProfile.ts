"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

export type UserProfileRecord = {
  id: string;
  username: string;
  display_name?: string;
  allow_messages?: boolean;
  market_visibility_mode?: string;
};

export function useUserProfile(userId?: string | null) {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [tableReady, setTableReady] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!userId || !supabaseConfigured || !supabase) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, allow_messages, market_visibility_mode")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      const raw = String(error.message || "").toLowerCase();
      if (raw.includes("relation") || raw.includes("profiles") || raw.includes("schema cache")) {
        setTableReady(false);
        setProfile(null);
        setLoading(false);
        return;
      }
    }

    setTableReady(true);
    setProfile((data as UserProfileRecord | null) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return { profile, loading, tableReady, refreshProfile };
}
