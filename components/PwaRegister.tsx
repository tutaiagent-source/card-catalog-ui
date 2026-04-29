"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Proof-by-elimination: fully disable SW control while we fix the
    // "A problem repeatedly occurred" navigation issue.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())).catch(() => {}))
      .catch(() => {
        // no-op
      });
  }, []);

  return null;
}
