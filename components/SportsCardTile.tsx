import React from "react";

import StatusChip from "@/components/StatusChip";

type Props = {
  href: string;
  status: "catalog" | "pc" | "listings" | "market" | "sold" | "receipt";
  title: string;
  sentence: string;
  cta: string;
  preview?: {
    kicker?: string;
    lines: Array<string>;
  };
};

export default function SportsCardTile({ href, status, title, sentence, cta, preview }: Props) {
  return (
    <a
      href={href}
      className="group relative block rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:bg-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl border border-white/10 bg-white/[0.03] opacity-40 translate-y-1" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={status} />
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Feature</div>
          </div>
          <div className="mt-3 text-lg font-semibold text-white">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{sentence}</div>
        </div>

        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-xs font-semibold text-slate-200">
          {title.length <= 5 ? title : "CC"}
        </div>
      </div>

      {preview ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          {preview.kicker ? <div className="text-xs font-semibold text-slate-400">{preview.kicker}</div> : null}
          <div className="mt-2 space-y-1 text-sm">
            {preview.lines.slice(0, 3).map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-slate-200">{l}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-200 group-hover:underline">{cta}</span>
        <span aria-hidden="true" className="text-slate-400">→</span>
      </div>
    </a>
  );
}
