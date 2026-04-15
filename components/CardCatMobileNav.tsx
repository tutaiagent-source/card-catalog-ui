"use client";

import { usePathname } from "next/navigation";

const items = [
  { href: "/catalog", label: "Catalog", icon: "🐾" },
  { href: "/pc", label: "PC ★", icon: "☆" },
  { href: "/add-card", label: "Add", icon: "＋" },
  { href: "/import", label: "Import", icon: "⬆️" },
  { href: "/sold", label: "Sold", icon: "💰" },
  { href: "/account", label: "Account", icon: "⚙️" },
];

export default function CardCatMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-1 py-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-semibold ${active ? "bg-amber-500/15 text-amber-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
