import MarketingNav from '@/components/MarketingNav';
import { CatalogShowcase, ImportShowcase, SoldShowcase } from '@/components/MarketingScreens';
import ShareCardPrompt from './components/shareCardPrompt';

const featureCards = [
    { title: 'Cleaner Catalog Control', body: 'Search, filter, and move through your collection without getting buried in spreadsheet clutter.' },
    { title: 'Built For Real Collections', body: 'Keep Personal Collection cards, listed inventory, and sold history connected in one clear system.' },
    { title: 'Guided Import Workflow', body: 'Bring in CSV files, review duplicates, and fix messy rows before they become bigger problems.' },
    { title: 'Seller Tools When You Need Them', body: 'Track listed and sold cards cleanly, then open recent sold listings on eBay with a click when you need quicker context.' }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />
        <ShareCardPrompt card={{ name: 'Test Card', year: 2021, serial: '12345', parallel: 'None', setName: 'Test Set', image: 'path_to_image' }} />
        {/* Other content would follow here */}
      </div>
    </main>
  );
}