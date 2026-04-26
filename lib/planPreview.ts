"use client";

import { useEffect, useState } from "react";

export type PlanPreview = "collector" | "pro" | "seller";

const STORAGE_KEY = "cardcat-plan-preview";

export function usePlanPreview(defaultPlan: PlanPreview = "pro") {
  const [planPreview, setPlanPreviewState] = useState<PlanPreview>(defaultPlan);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "collector" || stored === "pro" || stored === "seller") {
        setPlanPreviewState(stored);
      }
    } finally {
      setReady(true);
    }
  }, []);

  const setPlanPreview = (next: PlanPreview) => {
    setPlanPreviewState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  return {
    planPreview,
    setPlanPreview,
    isCollectorPreview: planPreview === "collector",
    ready,
  };
}
