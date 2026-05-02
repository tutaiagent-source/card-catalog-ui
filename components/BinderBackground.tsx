import React from "react";

export default function BinderBackground({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={["relative overflow-hidden", className ?? ""].join(" ")}> 
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-12"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 48px)",
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0 1px, transparent 1px 48px)",
            "radial-gradient(circle at 20% 0%, rgba(245,158,11,0.35), transparent 40%)",
            "radial-gradient(circle at 80% 0%, rgba(59,130,246,0.35), transparent 42%)",
          ].join(","),
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
