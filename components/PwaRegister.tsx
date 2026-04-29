"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Force replacement of any older SW versions that may be causing
    // iOS/WebView navigation loops.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())).catch(() => {}))
      .finally(() => {
        navigator.serviceWorker
          .register("/sw.v2.js")
          .catch(() => {
            // no-op
          });
      });
  }, []);

  return null;
}
