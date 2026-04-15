export type CardSellerMeta = {
  costBasis: number | null;
  shippingCost: number | null;
  platformFee: number | null;
};

const START = "[[cardcat:seller-meta]]";
const END = "[[/cardcat:seller-meta]]";

function toMoney(value: unknown) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function parseSellerMeta(notes?: string | null) {
  const raw = String(notes || "");
  const start = raw.indexOf(START);
  const end = raw.indexOf(END);

  if (start === -1 || end === -1 || end < start) {
    return {
      publicNotes: raw.trim(),
      meta: {
        costBasis: null,
        shippingCost: null,
        platformFee: null,
      } satisfies CardSellerMeta,
    };
  }

  const jsonText = raw.slice(start + START.length, end).trim();
  let parsed: Partial<CardSellerMeta> = {};

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    parsed = {};
  }

  const publicNotes = `${raw.slice(0, start)}${raw.slice(end + END.length)}`.trim();

  return {
    publicNotes,
    meta: {
      costBasis: toMoney(parsed.costBasis),
      shippingCost: toMoney(parsed.shippingCost),
      platformFee: toMoney(parsed.platformFee),
    } satisfies CardSellerMeta,
  };
}

export function buildSellerNotes(notes: string | null | undefined, meta: CardSellerMeta) {
  const publicNotes = String(notes || "").trim();
  const cleanedMeta = {
    costBasis: toMoney(meta.costBasis),
    shippingCost: toMoney(meta.shippingCost),
    platformFee: toMoney(meta.platformFee),
  };

  const hasMeta = Object.values(cleanedMeta).some((value) => value != null && value !== 0);
  if (!hasMeta) return publicNotes;

  const metaBlock = `${START}\n${JSON.stringify(cleanedMeta)}\n${END}`;
  return publicNotes ? `${metaBlock}\n\n${publicNotes}` : metaBlock;
}

export function computeSaleMetrics(input: {
  grossSale: number;
  costBasis?: number | null;
  shippingCost?: number | null;
  platformFee?: number | null;
}) {
  const grossSale = Number(input.grossSale || 0);
  const costBasis = Number(input.costBasis || 0);
  const shippingCost = Number(input.shippingCost || 0);
  const platformFee = Number(input.platformFee || 0);
  const netProfit = grossSale - costBasis - shippingCost - platformFee;
  const roi = costBasis > 0 ? (netProfit / costBasis) * 100 : null;

  return {
    grossSale,
    costBasis,
    shippingCost,
    platformFee,
    netProfit,
    roi,
  };
}
