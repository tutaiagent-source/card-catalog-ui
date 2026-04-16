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

export const SPORT_OPTIONS = [
  "Baseball",
  "Basketball",
  "Football",
  "Hockey",
  "Soccer",
  "Golf",
  "Racing",
  "Wrestling",
  "MMA",
  "Tennis",
  "Other",
] as const;

export const SOCCER_COMPETITION_OPTIONS = [
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "MLS",
  "NWSL",
  "Liga F",
  "Saudi Pro League",
  "UEFA Champions League",
  "UEFA Europa League",
  "FIFA World Cup",
  "UEFA Euro",
  "Copa América",
  "Women's World Cup",
  "Other",
] as const;

const SOCCER_COMPETITION_ALIASES: Array<[string, string[]]> = [
  ["Premier League", ["premier league", "english premier league", "epl"]],
  ["La Liga", ["la liga", "laliga"]],
  ["Bundesliga", ["bundesliga"]],
  ["Serie A", ["serie a"]],
  ["Ligue 1", ["ligue 1"]],
  ["MLS", ["mls", "major league soccer"]],
  ["NWSL", ["nwsl", "national women's soccer league", "national womens soccer league"]],
  ["Liga F", ["liga f"]],
  ["Saudi Pro League", ["saudi pro league", "spl"]],
  ["UEFA Champions League", ["uefa champions league", "champions league", "ucl"]],
  ["UEFA Europa League", ["uefa europa league", "europa league"]],
  ["FIFA World Cup", ["fifa world cup", "world cup"]],
  ["UEFA Euro", ["uefa euro", "euro"]],
  ["Copa América", ["copa america", "copa américa"]],
  ["Women's World Cup", ["women's world cup", "womens world cup", "fifa women's world cup", "fifa womens world cup"]],
];

function normalizeSoccerCompetition(value: string | undefined | null) {
  const raw = clean(value);
  if (!raw) return "";
  const lower = raw.toLowerCase();

  for (const [canonical, aliases] of SOCCER_COMPETITION_ALIASES) {
    if (aliases.includes(lower)) return canonical;
  }

  return "";
}

export function normalizeSportLabel(value: string | undefined | null) {
  const raw = clean(value);
  if (!raw) return "";

  const competitionMatch = normalizeSoccerCompetition(raw);
  if (competitionMatch) return "Soccer";

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
  if (lower === "other") return "Other";

  return titleCase(raw);
}

export function normalizeCompetitionLabel(value: string | undefined | null, sport?: string | undefined | null) {
  const raw = clean(value);
  if (!raw) return "";

  const soccerMatch = normalizeSoccerCompetition(raw);
  if (soccerMatch) return soccerMatch;

  const normalizedSport = normalizeSportLabel(sport);
  if (normalizedSport === "Soccer") return titleCase(raw);

  return titleCase(raw);
}

export function normalizeBrandAndSet(brandValue: string | undefined | null, setValue: string | undefined | null) {
  let brand = clean(brandValue);
  let set_name = clean(setValue);

  const lowerBrand = brand.toLowerCase();
  const lowerSet = set_name.toLowerCase();

  const manufacturerPrefixes: Array<[string, string]> = [
    ["panini", "Panini"],
    ["topps", "Topps"],
    ["bowman", "Bowman"],
    ["upper deck", "Upper Deck"],
    ["leaf", "Leaf"],
  ];

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

  for (const [prefix, canonicalBrand] of manufacturerPrefixes) {
    if (!lowerBrand.startsWith(`${prefix} `)) continue;

    const remainder = clean(brand.slice(prefix.length));
    const remainderLower = remainder.toLowerCase();

    brand = canonicalBrand;

    if (!set_name || lowerSet === remainderLower || lowerSet === `${prefix} ${remainderLower}`) {
      set_name = titleCase(remainder);
    }

    break;
  }

  for (const [token, canonicalSet] of Object.entries(paniniSets)) {
    if (lowerBrand === token || lowerBrand === `panini ${token}`) {
      brand = "Panini";
      if (!set_name || lowerSet === token || lowerSet === `panini ${token}`) {
        set_name = canonicalSet;
      }
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

  for (const [token, canonicalSet] of Object.entries(paniniSets)) {
    if (lowerSet === `panini ${token}`) {
      if (!brand || brand === "Panini") brand = "Panini";
      set_name = canonicalSet;
    }
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

export function normalizeCatalogTaxonomy<
  T extends { brand?: string | null; set_name?: string | null; sport?: string | null; competition?: string | null }
>(card: T): T {
  const rawSport = clean(card.sport);
  const rawCompetition = clean(card.competition);

  let normalizedSport = normalizeSportLabel(rawSport);
  let normalizedCompetition = rawCompetition;

  const sportAsCompetition = normalizeSoccerCompetition(rawSport);
  if (sportAsCompetition) {
    normalizedSport = "Soccer";
    if (!normalizedCompetition) normalizedCompetition = sportAsCompetition;
  }

  const competitionAsSoccer = normalizeSoccerCompetition(rawCompetition);
  if (competitionAsSoccer) {
    normalizedCompetition = competitionAsSoccer;
    if (!normalizedSport) normalizedSport = "Soccer";
  }

  normalizedCompetition = normalizeCompetitionLabel(normalizedCompetition, normalizedSport);

  const normalizedBrandSet = normalizeBrandAndSet(card.brand, card.set_name);

  return {
    ...card,
    sport: normalizedSport || card.sport,
    competition: normalizedCompetition || undefined,
    brand: normalizedBrandSet.brand || card.brand,
    set_name: normalizedBrandSet.set_name || card.set_name,
  };
}
