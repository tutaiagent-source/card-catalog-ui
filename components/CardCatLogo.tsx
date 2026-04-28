import Image from "next/image";

type CardCatMarkProps = {
  className?: string;
};

type CardCatLogoProps = {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  showText?: boolean;
  align?: "left" | "center";
  variant?: "standard" | "horizontal" | "vertical" | "icon";
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  imageClassName?: string;
};

export function CardCatMark({ className = "h-10 w-10" }: CardCatMarkProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className={className}>
      <rect x="18" y="26" width="60" height="52" rx="14" fill="#D50000" />
      <rect x="22" y="30" width="52" height="44" rx="10" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <path d="M28 64C38 55 52 50 68 48" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M31 34L39 21L47 32C47.6 32.8 48.8 32.8 49.4 32L57 21L65 34V44H31V34Z"
        fill="#0F172A"
      />
      <path d="M34 45C34 34.5 40.9 27 48 27C55.1 27 62 34.5 62 45V47H34V45Z" fill="#0F172A" />
      <rect x="35" y="42" width="10" height="11" rx="5" fill="#0F172A" />
      <rect x="51" y="42" width="10" height="11" rx="5" fill="#0F172A" />
      <circle cx="43" cy="39.5" r="2.2" fill="#FBBF24" />
      <circle cx="53" cy="39.5" r="2.2" fill="#FBBF24" />
      <path d="M47.8 42.8L45.5 46.2H50.1L47.8 42.8Z" fill="#F8FAFC" />
      <path d="M45 48.4C46.5 49.8 49.1 49.8 50.6 48.4" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M65 39C73 42 76 52 71 60" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export default function CardCatLogo({
  className = "",
  markClassName,
  showTagline = true,
  showText = true,
  align = "left",
  variant = "standard",
  size = "md",
  priority = false,
  imageClassName = "",
}: CardCatLogoProps) {
  const alignClasses = align === "center" ? "justify-center" : "justify-start";

  const markSizeToClass = (s: "sm" | "md" | "lg") => (s === "sm" ? "h-9 w-9" : s === "lg" ? "h-12 w-12" : "h-11 w-11");
  const horizontalWidthPx = size === "sm" ? 200 : size === "lg" ? 260 : 220;
  const verticalWidthPx = size === "sm" ? 220 : size === "lg" ? 360 : 280;

  if (variant === "horizontal" || variant === "vertical") {
    const src =
      variant === "horizontal" ? "/brand/card_cat_horizontal.png" : "/brand/card_cat_vertical.png";
    const widthPx = variant === "horizontal" ? horizontalWidthPx : verticalWidthPx;
    const aspect = variant === "horizontal" ? 11783 / 4958 : 1;
    const heightPx = Math.round(widthPx / aspect);

    return (
      <div className={`inline-flex ${alignClasses} ${className}`.trim()}>
        <div className="relative" style={{ width: `${widthPx}px`, height: `${heightPx}px` }}>
          <Image
            src={src}
            alt="CardCat"
            fill
            priority={priority}
            sizes={`${widthPx}px`}
            style={{ objectFit: "contain", objectPosition: "center" }}
            className={imageClassName || "object-contain object-center"}
          />
        </div>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <div className={`inline-flex ${alignClasses} ${className}`.trim()}>
        <CardCatMark className={markClassName ?? markSizeToClass(size)} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 ${align === "center" ? "text-center" : "text-left"} ${className}`.trim()}
    >
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
        <CardCatMark className={markClassName ?? markSizeToClass(size)} />
      </div>
      {showText ? (
        <div>
          <div className="text-lg font-black tracking-[-0.03em] text-white sm:text-xl">CardCat</div>
          {showTagline ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90 sm:text-[11px]">
              Card Inventory For Collectors
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
