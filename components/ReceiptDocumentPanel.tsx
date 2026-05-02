import React from "react";

import StatusChip from "@/components/StatusChip";

export default function ReceiptDocumentPanel({
  title = "Receipt",
  subtitle,
  rows,
  status = "receipt",
}: {
  title?: string;
  subtitle?: string;
  status?: "receipt" | "sold";
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <StatusChip status={status} />
            <div className="text-lg font-bold text-white">{title}</div>
          </div>
          {subtitle ? <div className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</div> : null}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {rows.map((r, idx) => (
          <div
            key={r.label}
            className={[
              "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
              idx === 0 ? "" : "border-t border-white/10",
            ].join(" ")}
          >
            <div className="text-sm font-semibold text-slate-200">{r.label}</div>
            <div className="text-sm font-bold text-white">{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
