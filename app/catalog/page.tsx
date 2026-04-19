import { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/lib/useSupabaseUser';
import { normalizeCatalogTaxonomy } from '@/lib/cardTaxonomy';
import { buildSellerNotes, parseSellerMeta } from '@/lib/cardSellerMeta';
import { driveToImageSrc } from '@/lib/googleDrive';
import { usePlanPreview } from '@/lib/planPreview';
import CardCatMobileNav from '@/components/CardCatMobileNav';
import CardCatLogo from '@/components/CardCatLogo';
import EmailVerificationNotice from '@/components/EmailVerificationNotice';
import ShareCardPrompt from '@/components/shareCardPrompt'; // Import the ShareCardPrompt component

const CardCatalogPage = () => {
  const cards = loadCards(); // your function to load cards
console.log(cards); // Log the card data for debugging
  return (
    <div>
      {cards.map((card) => (
        <div key={card.id}>
          {/* Render the ShareCardPrompt */}
          <ShareCardPrompt card={card} />
          {/* Other card details can go here */}
        </div>
      ))}
    </div>
  );
};

export default CardCatalogPage;