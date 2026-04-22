import MarketingImageLightbox from "@/components/MarketingImageLightbox";

export default function ShareSheetFeaturePreview() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[#0f172a] p-5 shadow-[0_25px_80px_rgba(2,6,23,0.45)]">
      <MarketingImageLightbox src="/share-sheet-feature-preview.jpg" alt="Card post preview">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#020617]">
          <img
            src="/share-sheet-feature-preview.jpg"
            alt="Card post preview"
            className="block h-auto w-full object-contain"
          />
        </div>
      </MarketingImageLightbox>
    </div>
  );
}
