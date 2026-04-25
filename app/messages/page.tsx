"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import CardCatLogo from "@/components/CardCatLogo";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { ConversationRow, ConversationParticipantRow, MessageRow } from "@/lib/messaging";
import './messages.css'; // Import the new CSS styles

// Local type definition for CardContext

type CardContext = {
  id?: string;
  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;
  card_number: string;
  asking_price?: number | null;
  image_url?: string | null;
};

export default function MessagesPage() {
  const { user, loading } = useSupabaseUser();
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [activeConversationCard, setActiveConversationCard] = useState<CardContext | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationContextCards, setConversationContextCards] = useState<CardContext[]>([]);

  useEffect(() => {
    const currentConversation = conversations.find(conv => conv.id === activeConversationId);
    if (currentConversation && currentConversation.context_card_id) {
      const cardContext = conversationContextCards.find(card => card.id === currentConversation.context_card_id);
      setActiveConversationCard(cardContext || null); // Handles fallback properly
    } else {
      setActiveConversationCard(null);
    }
  }, [activeConversationId, conversations, conversationContextCards]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-24 flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <div className="flex-none w-full lg:w-80 rounded-3xl border border-white/10 bg-white/[0.04] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <CardCatLogo />
          <button className="bg-teal-500 text-white px-4 py-2 rounded-lg">Compose</button>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-semibold text-white">Folders</div>
          <button className="rounded-md p-2 text-left hover:bg-gray-700">Inbox</button>
          <button className="rounded-md p-2 text-left hover:bg-gray-700">Sent</button>
          <button className="rounded-md p-2 text-left hover:bg-gray-700">Drafts</button>
          <button className="rounded-md p-2 text-left hover:bg-gray-700">Archived</button>
          <button className="rounded-md p-2 text-left hover:bg-gray-700">Trash</button>
        </div>
      </div>

      {/* Middle Thread List */}
      <section className="flex-grow rounded-3xl border border-white/10 bg-white/[0.04] p-4 flex flex-col max-h-[calc(100vh-220px)] overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
          {conversations
            .filter(conv => conv.body.includes(searchQuery))
            .map(conv => {
              return (
                <div key={conv.id} className="p-2 border-b border-gray-700 hover:bg-gray-800 cursor-pointer">
                  <div className="font-semibold">{conv.body}</div>
                  <div className="text-sm text-gray-400">{new Date(conv.last_message_at).toLocaleString()}</div>
                  <button className="mt-1 text-teal-500" onClick={() => markAsRead(conv.id)}>Mark as Read</button>
                </div>
              );
            })}
        </div>
      </section>

      {/* Right Reading Pane */}
      <section className="flex-none border border-white/10 bg-white/[0.04] p-4 flex flex-col w-full lg:w-[320px] h-[calc(100vh-220px)] overflow-hidden">
          <div className="text-lg font-semibold text-white">
            {activeConversationCard ? `${activeConversationCard.player_name} (${activeConversationCard.year})` : 'Conversation Details'}
          </div>
          {/* Message history and functionality */}
      </section>
    </main>
  );
}