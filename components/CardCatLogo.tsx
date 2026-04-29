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
    <img
      src="/brand/icon.svg?v=3"
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      draggable={false}
      onError={(e) => {
        const el = e.currentTarget;
        el.src = "/icon.svg?v=3";
      }}
    />
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
      variant === "horizontal" ? "/brand/card_cat_horizontal.svg" : "/brand/card_cat_vertical.svg";
    const widthPx = variant === "horizontal" ? horizontalWidthPx : verticalWidthPx;
    const aspectRatio = variant === "horizontal" ? "11783/4958" : "1/1";

    return (
      <div className={`inline-flex ${alignClasses} ${className}`.trim()}>
        <div className="relative" style={{ width: `${widthPx}px`, aspectRatio }}>
          <img
            src={src}
            alt="CardCat"
            draggable={false}
            className={imageClassName || "object-contain"}
            style={{ position: "absolute", height: "100%", width: "100%", left: 0, top: 0, objectFit: "contain" }}
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
