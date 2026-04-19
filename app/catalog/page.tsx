// app/catalog/page.tsx

"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { normalizeCatalogTaxonomy } from "@/lib/cardTaxonomy";
import { buildSellerNotes, parseSellerMeta } from "@/lib/cardSellerMeta";
import { driveToImageSrc } from "@/lib/googleDrive";
import { usePlanPreview } from "@/lib/planPreview";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import ShareCardPrompt from '@/components/shareCardPrompt';

type YesNo = "yes" | "no";
type CardStatus = "Collection" | "Listed" | "Sold";
type Card = {
  id?: string;
  player_name: string;
  year: string;
  brand: string;
  set_name: string;
  parallel: string;
  card_number: string;
  team: string;
  sport: string;
  competition?: string | null;
  rookie: YesNo;
  is_autograph: YesNo;
  has_memorabilia: YesNo;
  graded?: YesNo;
  grade?: number | null;
  serial_number_text: string;
  quantity: number;
  estimated_price?: number | null;
  image_url?: string;
  back_image_url?: string;
  status?: CardStatus | string;
  asking_price?: number | null;
  listed_at?: string;
  sold_price?: number | null;
  sold_at?: string;
  sale_platform?: string;
  notes?: string;
  date_added?: string;
  pc_position?: number | null;
};

function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(storageKey());
    console.log("Raw cards data:", raw);  // Add this line
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Card[];
    console.log("Parsed cards:", parsed);  // This will show the parsed data
    return parsed;
  } catch (error) {
    console.error("Error loading cards:", error);
    return [];
  }
}

const CardCatalogPage = () => {
  const cards = loadCards(); // your function to load cards
  console.log(cards); // Log the card data for debugging
  return (
    <div>
      {cards.map((card) => (
        <div key={card.id}>
          <ShareCardPrompt card={card} />
          {/* Other card details can go here */}
        </div>
      ))}
    </div>
  );
};

export default CardCatalogPage;