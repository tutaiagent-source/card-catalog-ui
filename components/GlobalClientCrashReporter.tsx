"use client";

import { useEffect, useMemo, useState } from "react";

type CrashRecord = {
  id: string;
  at: string;
  href: string;
  lastClickedHref?: string | null;
  userAgent: string;
  message?: string;
  stack?: string;
  type: "onerror" | "unhandledrejection";
};

const STORAGE_KEY = "cardcat_last_crash_v1";

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch (_e) {
    return String(value);
  }
}

export default function GlobalClientCrashReporter() {
  const [lastCrashId, setLastCrashId] = useState<string | null>(null);
  const [lastCrashAt, setLastCrashAt] = useState<string | null>(null);

  useEffect(() => {
    // Load last crash id for a visible breadcrumb.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CrashRecord;
      setLastCrashId(parsed?.id ?? null);
      setLastCrashAt(parsed?.at ?? null);
    } catch (_e) {
      // ignore
    }
  }, []);

  const sendCrash = useMemo(
    () =>
      async (record: CrashRecord) => {
        // keepalive is important for iOS reliability.
        try {
          await fetch("/api/client-crash", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(record),
            keepalive: true,
          });
        } catch (_e) {
          // ignore
        }
      },
    []
  );

  useEffect(() => {
    const getLastClickedHref = () => {
      try {
        return sessionStorage.getItem("cardcat_last_clicked_href");
      } catch (_e) {
        return null;
      }
    };

    const onDocClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const a = target?.closest?.("a") as HTMLAnchorElement | null;
        const href = a?.href || a?.getAttribute?.("href");
        if (!href) return;
        sessionStorage.setItem("cardcat_last_clicked_href", String(href));
      } catch (_err) {
        // ignore
      }
    };

    document.addEventListener("click", onDocClick, true);

    const makeRecord = (type: CrashRecord["type"], payload: any): CrashRecord => {
      const id =
        (globalThis.crypto as any)?.randomUUID?.() ??
        `cc_crash_${Math.random().toString(16).slice(2)}`;
      const at = new Date().toISOString();
      const href =
        (globalThis.location && typeof location.href === "string" && location.href) || "";

      const message = typeof payload?.message === "string" ? payload.message : payload?.reason ? String(payload.reason) : undefined;
      const stack = typeof payload?.stack === "string" ? payload.stack : payload?.reason?.stack;

      const record: CrashRecord = {
        id,
        at,
        href,
        lastClickedHref: getLastClickedHref(),
        userAgent: navigator.userAgent,
        message,
        stack,
        type,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        setLastCrashId(id);
        setLastCrashAt(at);
      } catch (_e) {
        // ignore
      }

      return record;
    };

    const onError: OnErrorEventHandler = (event: any) => {
      try {
        const error = event?.error;
        const payload = {
          message: event?.message,
          stack: error?.stack,
          source: event?.filename,
          line: event?.lineno,
          col: event?.colno,
        };
        const rec = makeRecord("onerror", payload);
        void sendCrash(rec);
      } catch (_e) {
        // ignore
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        const reason = event?.reason;
        const payload = {
          message: typeof reason?.message === "string" ? reason.message : undefined,
          stack: reason?.stack,
          reason,
          serializedReason: safeStringify(reason),
        };
        const rec = makeRecord("unhandledrejection", payload);
        void sendCrash(rec);
      } catch (_e) {
        // ignore
      }
    };

    window.addEventListener("error", onError as any);
    window.addEventListener("unhandledrejection", onUnhandledRejection as any);

    return () => {
      document.removeEventListener("click", onDocClick, true);
      window.removeEventListener("error", onError as any);
      window.removeEventListener("unhandledrejection", onUnhandledRejection as any);
    };
  }, [sendCrash]);

  if (!lastCrashId) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 72,
        left: 12,
        right: 12,
        zIndex: 999999,
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(0,0,0,0.7)",
        color: "#fde68a",
        border: "1px solid rgba(245,158,11,0.35)",
        fontSize: 12,
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Crash breadcrumb</div>
      <div>
        id: <span style={{ fontFamily: "monospace" }}>{lastCrashId}</span>
        {lastCrashAt ? <span> · {new Date(lastCrashAt).toLocaleTimeString()}</span> : null}
      </div>
    </div>
  );
}

