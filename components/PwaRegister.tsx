"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);

    // iOS has known service worker instability issues that can manifest as
    // "A problem repeatedly occurred" loops.
    //
    // We need to *replace* any previously controlling SW with a known-safe
    // no-interception worker, and then force a one-time reload so iOS
    // actually drops the old controller.
    if (isIOS) {
      const didReload = sessionStorage.getItem("cardcat_sw_ios_reload") === "1";
      const bustKey = "cardcat_sw_ios_bust";
      const bust =
        sessionStorage.getItem(bustKey) ||
        Math.random().toString(36).slice(2);
      sessionStorage.setItem(bustKey, bust);

      // Unregister all existing SWs.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())).catch(() => {}))
        .finally(() => {
          // Register a fresh copy of our safe SW.
          navigator.serviceWorker
            .register(`/sw.js?sw=ios_${bust}`)
            .then((reg) => reg.update().catch(() => {}))
            .catch(() => {
              // no-op
            })
            .finally(() => {
              if (!didReload) {
                sessionStorage.setItem("cardcat_sw_ios_reload", "1");
                // Give iOS a moment to swap controllers before hard reload.
                setTimeout(() => window.location.reload(), 900);
              }
            });
        });
      return;
    }

    // Force replacement of any older SW versions that may be causing
    // iOS/WebView navigation loops.
    //
    // Important: we register a *versioned URL* so the browser reliably
    // fetches the updated script (and doesn’t keep an older cached SW).
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())).catch(() => {}))
      .finally(() => {
        // Register a versioned SW script so iOS/WebView reliably replaces any
        // older (possibly broken) controller.
        navigator.serviceWorker
          .register("/sw.js?sw=v3")
          .then((reg) => reg.update().catch(() => {}))
          .catch(() => {
            // no-op
          });
      });
  }, []);

  return null;
}
