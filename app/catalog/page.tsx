// Import the ShareCardPrompt component at the top
import ShareCardPrompt from '@/components/shareCardPrompt';

// Inside the component that renders cards in your catalog, include:
const CardCatalogPage = () => {
  const cards = loadCards(); // your function to load cards
  return (
    <div>
      {cards.map((card) => (
        <div key={card.id}>
          {/* Render the card here */}
          <ShareCardPrompt card={card} />
          {/* Other card details, if any */}
        </div>
      ))}
    </div>
  );
};

export default CardCatalogPage;