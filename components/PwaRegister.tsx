"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Force replacement of any older SW versions that may be causing
    // iOS/WebView navigation loops.
    //
    // Important: we register a *versioned URL* so the browser reliably
    // fetches the updated script (and doesn’t keep an older cached SW).
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())).catch(() => {}))
      .finally(() => {
        navigator.serviceWorker
          .register("/sw.js?sw=v2")
          .catch(() => {
            // no-op
          });
      });
  }, []);

  return null;
}
