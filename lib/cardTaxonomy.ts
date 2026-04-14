function clean(value: string | undefined | null) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function titleCase(value: string) {
  return clean(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeSportLabel(value: string | undefined | null) {
  const raw = clean(value);
  if (!raw) return "";
  const lower = raw.toLowerCase();

  if (["nfl", "ncaaf", "ncaa football", "football", "ncaa footbal"].includes(lower) || lower.includes("football")) {
    return "Football";
  }
  if (["nba", "wnba", "ncaab", "ncaa basketball", "basketball"].includes(lower) || lower.includes("basketball")) {
    return "Basketball";
  }
  if (["mlb", "ncaa baseball", "baseball"].includes(lower) || lower.includes("baseball")) {
    return "Baseball";
  }
  if (["nhl", "hockey"].includes(lower) || lower.includes("hockey")) {
    return "Hockey";
  }
  if (["soccer", "fifa", "mls"].includes(lower) || lower.includes("soccer")) {
    return "Soccer";
  }
  if (lower.includes("golf")) return "Golf";
  if (lower.includes("racing") || lower.includes("nascar") || lower.includes("f1")) return "Racing";
  if (lower.includes("wrestling") || lower.includes("wwe")) return "Wrestling";
  if (lower.includes("ufc") || lower.includes("mma")) return "MMA";
  if (lower.includes("tennis")) return "Tennis";

  return titleCase(raw);
}

export function normalizeBrandAndSet(brandValue: string | undefined | null, setValue: string | undefined | null) {
  let brand = clean(brandValue);
  let set_name = clean(setValue);

  const lowerBrand = brand.toLowerCase();
  const lowerSet = set_name.toLowerCase();

  const paniniSets: Record<string, string> = {
    prizm: "Prizm",
    select: "Select",
    mosaic: "Mosaic",
    optic: "Optic",
    phoenix: "Phoenix",
    contenders: "Contenders",
    chronicles: "Chronicles",
    spectra: "Spectra",
    immaculate: "Immaculate",
    flawless: "Flawless",
    donruss: "Donruss",
  };

  for (const [token, canonicalSet] of Object.entries(paniniSets)) {
    if ((lowerBrand === token || lowerBrand === `panini ${token}`) && !set_name) {
      brand = "Panini";
      set_name = canonicalSet;
    }
  }

  if (lowerBrand === "panini") brand = "Panini";
  if (lowerBrand === "topps") brand = "Topps";
  if (lowerBrand === "bowman") brand = "Bowman";
  if (lowerBrand === "upper deck") brand = "Upper Deck";
  if (lowerBrand === "leaf") brand = "Leaf";

  if (!brand && lowerSet.startsWith("panini ")) {
    brand = "Panini";
    set_name = titleCase(set_name.replace(/^panini\s+/i, ""));
  }

  if (brand === "Panini" && lowerSet.startsWith("panini ")) {
    set_name = titleCase(set_name.replace(/^panini\s+/i, ""));
  }

  if (brand === "Topps" && lowerSet.startsWith("topps ")) {
    set_name = titleCase(set_name.replace(/^topps\s+/i, ""));
  }

  if (!brand) brand = titleCase(brandValue || "");
  if (!set_name) set_name = titleCase(setValue || "");

  if (!brand && set_name) {
    const setLower = set_name.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(paniniSets, setLower)) {
      brand = "Panini";
      set_name = paniniSets[setLower];
    }
  }

  return {
    brand: brand ? titleCase(brand) : "",
    set_name: set_name ? titleCase(set_name) : "",
  };
}

export function normalizeCatalogTaxonomy<T extends { brand?: string | null; set_name?: string | null; sport?: string | null }>(card: T): T {
  const normalizedSport = normalizeSportLabel(card.sport);
  const normalizedBrandSet = normalizeBrandAndSet(card.brand, card.set_name);

  return {
    ...card,
    sport: normalizedSport || card.sport,
    brand: normalizedBrandSet.brand || card.brand,
    set_name: normalizedBrandSet.set_name || card.set_name,
  };
}
