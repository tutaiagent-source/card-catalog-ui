"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Don’t register SW unless explicitly enabled.
    // This prevents mobile reload/"Can’t open this page" loops while we debug.
    if (process.env.NEXT_PUBLIC_PWA_ENABLED !== "1") return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // no-op
      });
  }, []);

  return null;
}
