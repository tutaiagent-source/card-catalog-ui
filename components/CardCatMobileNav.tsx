"use client";

import { usePathname } from "next/navigation";
import { CardCatMark } from "@/components/CardCatLogo";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

const moreItems = [
  {
    href: "/pc",
    label: "PC ★",
    icon: "☆",
  },
  {
    href: "/listed",
    label: "Listings",
    icon: "📣",
  },
  {
    href: "/sold",
    label: "Sold",
    icon: "💰",
  },
  {
    href: "/import",
    label: "Import",
    icon: "⬆️",
  },
  {
    href: "/account",
    label: "Account",
    icon: "⚙️",
  },
] as const;

export default function CardCatMobileNav() {
  const pathname = usePathname();

  const { user } = useSupabaseUser();
  const [unreadConversationCount, setUnreadConversationCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  const userId = user?.id;
  const unreadable = useMemo(() => !userId || !supabaseConfigured || !supabase, [userId]);

  const moreActive = useMemo(() => {
    return moreItems.some((i) => i.href === pathname);
  }, [pathname]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const portalTarget = mounted && typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!moreOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  useEffect(() => {
    if (unreadable) {
      setUnreadConversationCount(0);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      if (!userId || !supabaseConfigured || !supabase) return;

      const { data: participantRows, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);

      if (participantError || !participantRows?.length) {
        if (!cancelled) setUnreadConversationCount(0);
        return;
      }

      const convIds = participantRows
        .map((r) => String(r.conversation_id))
        .filter(Boolean);

      if (!convIds.length) {
        if (!cancelled) setUnreadConversationCount(0);
        return;
      }

      const { data: conversationRows, error: conversationError } = await supabase
        .from("conversations")
        .select("id, last_message_at")
        .in("id", convIds);

      if (conversationError || !conversationRows?.length) {
        if (!cancelled) setUnreadConversationCount(0);
        return;
      }

      const lastReadByConversationId = new Map<string, string | null>(
        (participantRows ?? []).map((r) => [String(r.conversation_id), (r.last_read_at as string | null) ?? null])
      );

      let count = 0;
      for (const c of conversationRows) {
        if (!c.last_message_at) continue;
        const lastReadAt = lastReadByConversationId.get(String(c.id));
        if (!lastReadAt) {
          count++;
          continue;
        }

        if (new Date(c.last_message_at).getTime() > new Date(lastReadAt).getTime()) count++;
      }

      if (!cancelled) setUnreadConversationCount(count);
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [unreadable, userId]);

  const isActive = (href: string) => pathname === href;

  const items = [
    {
      href: "/catalog",
      label: "Catalog",
      icon: <CardCatMark className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />,
      active: isActive("/catalog"),
    },
    {
      href: "/market",
      label: "Market",
      icon: "🛒",
      active: isActive("/market"),
    },
    {
      href: "/add-card",
      label: "Add",
      icon: "＋",
      active: isActive("/add-card"),
    },
    {
      href: "/messages",
      label: "Messages",
      icon: "✉️",
      active: isActive("/messages"),
      unreadDot: unreadConversationCount > 0,
    },
    {
      href: "#more",
      label: "More",
      icon: "⋯",
      active: moreActive,
      moreButton: true,
    },
  ] as const;

  const content = (
    <>
      {moreOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {moreOpen ? (
        <div
          className="fixed inset-x-0 z-50 mx-auto w-full max-w-md px-3"
          style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              More
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
                        : "border-white/10 bg-slate-900/30 text-slate-200 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span aria-hidden="true" className="text-base">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-1 py-1">
          {items.map((item) => {
            const active = (item as any).moreButton ? moreActive : item.active;
            const showUnreadDot = item.href === "/messages" && (item as any).unreadDot;

            return (
              <button
                key={item.href + item.label}
                type="button"
                onClick={() => {
                  if ((item as any).moreButton) {
                    setMoreOpen((v) => !v);
                    return;
                  }
                  setMoreOpen(false);
                  window.location.href = item.href;
                }}
                className={`flex flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-semibold sm:text-[11px] lg:text-[12px] ${
                  active
                    ? "bg-amber-500/15 text-amber-200"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative flex h-5 items-center justify-center text-base leading-none sm:h-6 lg:h-7 sm:text-lg lg:text-[20px]">
                  {item.icon}
                  {showUnreadDot ? (
                    <span
                      className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-emerald-400"
                      aria-label={`${unreadConversationCount} unread messages`}
                    />
                  ) : null}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );

  if (portalTarget) return createPortal(content, portalTarget);
  return content;
}
