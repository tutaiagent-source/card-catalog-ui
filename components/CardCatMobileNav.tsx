"use client";

import { usePathname } from "next/navigation";
import { CardCatMark } from "@/components/CardCatLogo";
import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

const items = [
  { href: "/catalog", label: "Catalog", icon: <CardCatMark className="h-5 w-5" /> },
  { href: "/pc", label: "PC ★", icon: "☆" },
  { href: "/listed", label: "Listings", icon: "📣" },
  { href: "/messages", label: "Msgs", icon: "✉️" },
  { href: "/add-card", label: "Add Card", icon: "＋" },
  { href: "/import", label: "Import", icon: "⬆️" },
  { href: "/sold", label: "Sold", icon: "💰" },
  { href: "/account", label: "Account", icon: "⚙️" },
];

export default function CardCatMobileNav() {
  const pathname = usePathname();

  const { user } = useSupabaseUser();
  const [unreadConversationCount, setUnreadConversationCount] = useState(0);

  const userId = user?.id;
  const unreadable = useMemo(() => !userId || !supabaseConfigured || !supabase, [userId]);

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

      const convIds = participantRows.map((r) => String(r.conversation_id)).filter(Boolean);
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-8 gap-1 px-1 py-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const showUnreadDot = item.href === "/messages" && unreadConversationCount > 0;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-semibold ${active ? "bg-amber-500/15 text-amber-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
            >
              <span className="relative flex h-5 items-center justify-center text-base leading-none">
                {item.icon}
                {showUnreadDot ? (
                  <span
                    className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-emerald-400"
                    aria-label={`${unreadConversationCount} unread messages`}
                  />
                ) : null}
              </span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
