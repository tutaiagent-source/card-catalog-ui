"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);

    // iOS has known service worker instability issues that can manifest as
    // "A problem repeatedly occurred" loops. For now, we permanently disable
    // SW registration on iOS and only unregister any existing SWs.
    if (isIOS) {
      const didReload = sessionStorage.getItem("cardcat_sw_unreg_reload") === "1";
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())).catch(() => {}))
        .finally(() => {
          if (!didReload) {
            sessionStorage.setItem("cardcat_sw_unreg_reload", "1");
            window.location.reload();
          }
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
