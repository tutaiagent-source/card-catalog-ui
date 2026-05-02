import React from "react";

type Status = "catalog" | "pc" | "listings" | "market" | "sold" | "receipt";

type Props = {
  status: Status;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
};

const stylesByStatus: Record<Status, { wrapper: string; text: string; border: string }> = {
  catalog: {
    wrapper: "bg-amber-500/10",
    text: "text-amber-200",
    border: "border-amber-500/25",
  },
  pc: {
    wrapper: "bg-blue-500/10",
    text: "text-blue-200",
    border: "border-blue-500/25",
  },
  listings: {
    wrapper: "bg-emerald-500/10",
    text: "text-emerald-200",
    border: "border-emerald-500/25",
  },
  market: {
    wrapper: "bg-emerald-500/10",
    text: "text-emerald-200",
    border: "border-emerald-500/25",
  },
  sold: {
    wrapper: "bg-emerald-500/12",
    text: "text-emerald-200",
    border: "border-emerald-500/25",
  },
  receipt: {
    wrapper: "bg-white/5",
    text: "text-slate-200",
    border: "border-white/10",
  },
};

export default function StatusChip({ status, label, icon, className }: Props) {
  const s = stylesByStatus[status];
  const finalLabel = label ?? (status === "listings" ? "Listings" : status === "pc" ? "PC" : status[0].toUpperCase() + status.slice(1));

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        s.wrapper,
        s.border,
        s.text,
        className ?? "",
      ].join(" ")}
    >
      {icon ? <span className="text-[12px]">{icon}</span> : null}
      <span className="truncate">{finalLabel}</span>
    </span>
  );
}
