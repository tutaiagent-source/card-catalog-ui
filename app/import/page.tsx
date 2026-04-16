"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { normalizeBrandAndSet, normalizeCatalogTaxonomy } from "@/lib/cardTaxonomy";
import { GradeCompany, parseGradeCompany, parseGradeNumber, upsertGradeCompanyInNotes, upsertNotesLines } from "@/lib/gradeNotes";
import CardCatMobileNav from "@/components/CardCatMobileNav";
import CardCatLogo from "@/components/CardCatLogo";

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
  graded: YesNo;
  grade: number | null;
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
};

type ImportField =
  | "__ignore"
  | "player_name"
  | "year"
  | "brand"
  | "set_name"
  | "parallel"
  | "card_number"
  | "team"
  | "sport"
  | "competition"
  | "rookie"
  | "is_autograph"
  | "has_memorabilia"
  | "graded"
  | "grade"
  | "grade_company"
  | "cert_number"
  | "serial_number_text"
  | "quantity"
  | "estimated_price"
  | "status"
  | "asking_price"
  | "listed_at"
  | "sold_price"
  | "sold_at"
  | "sale_platform"
  | "purchase_price"
  | "storage_location"
  | "notes"
  | "image_url"
  | "back_image_url";

type Mapping = Record<string, ImportField>;
type RawRow = Record<string, string>;

type PreviewRow = {
  rowNumber: number;
  source: RawRow;
  payload: Partial<Card>;
  action: "create" | "update" | "needs_attention" | "skip";
  issues: string[];
  matchId?: string;
  matchedCard?: Card;
};

const REQUIRED_FIELDS: Array<keyof Pick<Card, "player_name" | "year" | "brand" | "set_name" | "card_number" | "team" | "sport">> = [
  "player_name",
  "year",
  "brand",
  "set_name",
  "card_number",
  "team",
  "sport",
];

const FIELD_LABELS: Record<ImportField, string> = {
  __ignore: "Ignore",
  player_name: "Player name",
  year: "Year",
  brand: "Brand",
  set_name: "Set name",
  parallel: "Parallel / Insert",
  card_number: "Card number",
  team: "Team",
  sport: "Sport",
  competition: "Competition",
  rookie: "Rookie",
  is_autograph: "Autograph",
  has_memorabilia: "Memorabilia",
  graded: "Graded",
  grade: "Grade",
  grade_company: "Grading company",
  cert_number: "Cert #",
  serial_number_text: "Serial",
  purchase_price: "Purchase price",
  storage_location: "Storage location",
  quantity: "Quantity",
  estimated_price: "Estimated price",
  status: "Status",
  asking_price: "Asking price",
  listed_at: "Listed date",
  sold_price: "Sold price",
  sold_at: "Sold date",
  sale_platform: "Platform",
  notes: "Notes",
  image_url: "Front image URL",
  back_image_url: "Back image URL",
};

const FIELD_OPTIONS: ImportField[] = [
  "__ignore",
  "player_name",
  "year",
  "brand",
  "set_name",
  "parallel",
  "card_number",
  "team",
  "sport",
  "competition",
  "rookie",
  "is_autograph",
  "has_memorabilia",
  "graded",
  "grade",
  "grade_company",
  "cert_number",
  "serial_number_text",
  "purchase_price",
  "storage_location",
  "quantity",
  "estimated_price",
  "status",
  "asking_price",
  "listed_at",
  "sold_price",
  "sold_at",
  "sale_platform",
  "notes",
  "image_url",
  "back_image_url",
];

const FIELD_ALIASES: Record<Exclude<ImportField, "__ignore">, string[]> = {
  player_name: ["player", "player name", "name", "athlete", "subject"],
  year: ["year", "season"],
  brand: ["brand", "manufacturer", "maker", "company"],
  set_name: ["set", "set name", "series", "product", "product line"],
  parallel: ["parallel", "insert", "subset", "theme", "parallel/insert", "variant", "version", "colorway", "variation"],
  card_number: ["card number", "card #", "number", "checklist number", "card no", "cardnum", "card_num", "no on card", "no. on card"],
  team: ["team", "franchise", "club", "school"],
  sport: ["sport"],
  competition: ["competition", "league", "tournament", "event"],
  rookie: ["rookie", "rc", "rookie card", "rookie_card", "rookie tag"],
  is_autograph: ["autograph", "auto", "auto included", "is autograph", "signed"],
  has_memorabilia: ["memorabilia", "mem", "patch", "jersey", "relic", "patch/relic", "patch / relic"],
  graded: ["graded", "is graded"],
  grade: ["grade", "grade number", "grading", "slab grade", "numeric grade"],
  grade_company: ["grader", "grading co", "grading company"],
  cert_number: ["cert", "cert #", "certification number", "certification #"],
  purchase_price: ["cost", "paid", "purchase price", "buy price"],
  storage_location: ["location", "box", "binder", "storage spot"],
  serial_number_text: ["serial", "serial number", "serial #", "sn", "#d", "#'d", "numbered", "serial_number_text"],
  quantity: ["qty", "quantity", "count"],
  estimated_price: ["estimated price", "estimated value", "market value", "comp value", "value", "price", "est price"],
  status: ["status", "collection status"],
  asking_price: ["asking price", "ask", "list price", "listed price", "bin price"],
  listed_at: ["listed date", "listed at", "date listed"],
  sold_price: ["sold price", "sale price"],
  sold_at: ["sold date", "sold at", "date sold"],
  sale_platform: ["listed on", "platform", "site", "app", "marketplace"],
  notes: ["notes", "note", "comment", "comments", "remarks", "description"],
  image_url: ["image", "image url", "front image", "front image url"],
  back_image_url: ["back image", "back image url"],
};

function normalizeHeader(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function guessField(header: string): ImportField {
  const normalized = normalizeHeader(header);
  if (!normalized) return "__ignore";

  const headerTokens = normalized.split(" ").filter(Boolean);

  let bestField: ImportField = "__ignore";
  let bestScore = 0;

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<[Exclude<ImportField, "__ignore">, string[]]>) {
    let fieldBest = 0;

    for (const alias of aliases) {
      const aliasNorm = normalizeHeader(alias);
      if (!aliasNorm) continue;

      if (aliasNorm === normalized) fieldBest = Math.max(fieldBest, 100);
      if (normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) fieldBest = Math.max(fieldBest, 70);

      const aliasTokens = aliasNorm.split(" ").filter(Boolean);
      const shared = aliasTokens.filter((t) => headerTokens.includes(t));
      const overlap = aliasTokens.length ? shared.length / aliasTokens.length : 0;
      const tokenScore = overlap * 60;
      if (tokenScore) fieldBest = Math.max(fieldBest, tokenScore);
    }

    if (fieldBest > bestScore) {
      bestScore = fieldBest;
      bestField = field;
    }
  }

  // Keep conservative to avoid wrong mappings.
  return bestScore >= 45 ? bestField : "__ignore";
}

function normalizeYesNo(value: string): { value?: YesNo; issue?: string } {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return {};
  if (["yes", "y", "true", "1", "t", "sure", "yeah", "yup"].includes(raw)) return { value: "yes" };
  if (["no", "n", "false", "0", "f", "nope", "nah"].includes(raw)) return { value: "no" };
  return { issue: `Could not read yes/no value "${value}".` };
}

function normalizeStatus(value: string): { value?: CardStatus; issue?: string } {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return {};
  if (["collection", "incoming", "in collection", "owned", "pc"].includes(raw)) return { value: "Collection" };
  if (["listed", "for sale", "sale", "on sale", "market", "active", "listing", "available"].includes(raw)) return { value: "Listed" };
  if (["sold", "completed", "purchased", "win", "won"].includes(raw)) return { value: "Sold" };
  return { issue: `Unknown status "${value}".` };
}

function normalizeNumber(value: string): { value?: number; issue?: string } {
  const raw = String(value || "").trim();
  if (!raw) return {};

  const cleanedPercent = raw.replace(/%\s*$/g, "");

  // Handle negatives in parentheses: "($12.34)"
  const isParenNegative = /^\(.*\)$/.test(cleanedPercent.trim());
  const cleaned = cleanedPercent
    .replace(/^\((.*)\)$/, "$1")
    .replace(/[$€£¥₹,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const numeric = Number(cleaned.replace(/\s/g, ""));
  if (Number.isFinite(numeric)) return { value: isParenNegative ? -numeric : numeric };

  return { issue: `Could not read number "${value}".` };
}

function normalizeQuantity(value: string): { value?: number; issue?: string } {
  const parsed = normalizeNumber(value);
  if (parsed.issue) return parsed;
  if (parsed.value == null) return {};
  const qty = Math.max(1, Math.round(parsed.value));
  return { value: qty };
}

function normalizeGrade(value: string): { value?: number | null; issue?: string } {
  const raw = String(value || "").trim();
  if (!raw) return {};

  // Handle "7/10" (optionally "7 / 10") or "7-10"
  const frac = raw.match(/^\s*(\d+(?:\.\d+)?)\s*[\/-]\s*10\s*$/i);
  if (frac) {
    const num = Number(frac[1]);
    if (Number.isFinite(num) && num >= 1 && num <= 10) return { value: Math.round(num) };
    return { issue: `Grade must be between 1 and 10. Got "${value}".` };
  }

  // Handle "7 of 10"
  const of10 = raw.match(/^\s*(\d+(?:\.\d+)?)\s*of\s*10\s*$/i);
  if (of10) {
    const num = Number(of10[1]);
    if (Number.isFinite(num) && num >= 1 && num <= 10) return { value: Math.round(num) };
    return { issue: `Grade must be between 1 and 10. Got "${value}".` };
  }

  const parsed = normalizeNumber(raw);
  if (parsed.issue) return parsed;
  if (parsed.value == null) return {};
  if (parsed.value < 1 || parsed.value > 10) return { issue: `Grade must be between 1 and 10. Got "${value}".` };
  return { value: Math.round(parsed.value) };
}

function normalizeDate(value: string): { value?: string; issue?: string } {
  const raw = String(value || "").trim();
  if (!raw) return {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { value: raw };
  const parts = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) {
    const [, month, day, year] = parts;
    return { value: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` };
  }
  return { issue: `Could not read date "${value}". Use YYYY-MM-DD or MM/DD/YYYY.` };
}

function cleanText(value: string) {
  return String(value || "").trim();
}

function buildIdentityKey(values: Partial<Card>) {
  const coreParts = [
    values.player_name,
    values.year,
    values.brand,
    values.set_name,
    values.parallel || "n/a",
    values.card_number,
    values.team,
    values.sport,
  ].map((part) => cleanText(String(part || "")).toLowerCase());

  if (coreParts.some((part) => !part)) return null;

  const competition = cleanText(String(values.competition || "")).toLowerCase();
  return [...coreParts, competition].join("|");
}

function rowHasAnyData(row: RawRow) {
  return Object.values(row).some((value) => cleanText(value) !== "");
}

function buildRowPayload(row: RawRow, mapping: Mapping, gradeCompanyOverride?: GradeCompany | "") {
  const payload: Partial<Card> = {};
  const issues: string[] = [];
  let gradeCompanyUsed: GradeCompany | null = null;
  let gradeTextUsed: string | null = null;
  let certNumberUsed: string | null = null;
  let purchasePriceUsed: string | null = null;
  let storageLocationUsed: string | null = null;

  for (const [header, target] of Object.entries(mapping)) {
    if (!target || target === "__ignore") continue;
    const rawValue = cleanText(row[header] || "");
    if (!rawValue) continue;

    switch (target) {
      case "player_name":
      case "year":
      case "brand":
      case "set_name":
      case "parallel":
      case "card_number":
      case "team":
      case "sport":
      case "serial_number_text":
      case "sale_platform":
      case "notes":
      case "image_url":
      case "back_image_url":
        (payload as any)[target] = rawValue;
        break;
      case "rookie":
      case "is_autograph":
      case "has_memorabilia":
      case "graded": {
        const normalized = normalizeYesNo(rawValue);
        if (normalized.value) {
          (payload as any)[target] = normalized.value;
        } else if (target === "graded" && parseGradeNumber(rawValue).gradeNumber != null) {
          payload.graded = "yes";
        }
        break;
      }
      case "status": {
        const normalized = normalizeStatus(rawValue);
        if (normalized.value) payload.status = normalized.value;
        break;
      }
      case "quantity": {
        const normalized = normalizeQuantity(rawValue);
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value != null) payload.quantity = normalized.value;
        break;
      }
      case "grade": {
        const parsed = parseGradeNumber(rawValue);
        if (parsed.issue) {
          issues.push(parsed.issue);
        } else if (parsed.gradeNumber != null) {
          payload.grade = Math.round(parsed.gradeNumber);
          gradeTextUsed = parsed.gradeText ?? String(parsed.gradeNumber);

          const parsedCompany = parseGradeCompany(rawValue);
          const hasOverride = gradeCompanyOverride != null && gradeCompanyOverride !== "";

          // Only store a company when it’s explicit in the grade text or the user provided an override.
          if (parsedCompany !== "Other") gradeCompanyUsed = parsedCompany;
          else if (hasOverride) gradeCompanyUsed = gradeCompanyOverride as GradeCompany;
        }
        break;
      }
      case "grade_company": {
        gradeCompanyUsed = parseGradeCompany(rawValue);
        break;
      }
      case "cert_number": {
        certNumberUsed = rawValue;
        break;
      }
      case "purchase_price": {
        purchasePriceUsed = rawValue;
        break;
      }
      case "storage_location": {
        storageLocationUsed = rawValue;
        break;
      }
      case "estimated_price":
      case "asking_price":
      case "sold_price": {
        const normalized = normalizeNumber(rawValue);
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value != null) (payload as any)[target] = normalized.value;
        break;
      }
      case "listed_at":
      case "sold_at": {
        const normalized = normalizeDate(rawValue);
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value) (payload as any)[target] = normalized.value;
        break;
      }
    }
  }

  if (gradeCompanyUsed) {
    payload.notes = upsertGradeCompanyInNotes({
      notes: payload.notes,
      gradeCompany: gradeCompanyUsed,
      gradeText: gradeTextUsed,
    });
  }

  if (certNumberUsed) {
    payload.notes = upsertNotesLines(payload.notes, [`Cert #: ${certNumberUsed}`]);
  }

  if (purchasePriceUsed) {
    payload.notes = upsertNotesLines(payload.notes, [`Purchase price: ${purchasePriceUsed}`]);
  }

  if (storageLocationUsed) {
    payload.notes = upsertNotesLines(payload.notes, [`Storage location: ${storageLocationUsed}`]);
  }

  if (!payload.parallel) payload.parallel = "n/a";
  if (!payload.serial_number_text) payload.serial_number_text = "";

  const normalizedBrandSet = normalizeBrandAndSet(payload.brand, payload.set_name);
  payload.brand = normalizedBrandSet.brand;
  payload.set_name = normalizedBrandSet.set_name;

  const normalizedTaxonomy = normalizeCatalogTaxonomy({
    sport: payload.sport,
    competition: payload.competition,
    brand: payload.brand,
    set_name: payload.set_name,
  });

  payload.sport = normalizedTaxonomy.sport;
  payload.competition = normalizedTaxonomy.competition;
  payload.brand = normalizedTaxonomy.brand;
  payload.set_name = normalizedTaxonomy.set_name;

  return { payload, issues };
}

function createInsertPayload(payload: Partial<Card>, userId: string) {
  return {
    user_id: userId,
    player_name: payload.player_name || "",
    year: payload.year || "",
    brand: payload.brand || "",
    set_name: payload.set_name || "",
    parallel: payload.parallel || "n/a",
    card_number: payload.card_number || "",
    team: payload.team || "",
    sport: payload.sport || "",
    ...(payload.competition ? { competition: payload.competition } : {}),
    rookie: payload.rookie || "no",
    is_autograph: payload.is_autograph || "no",
    has_memorabilia: payload.has_memorabilia || "no",
    graded: payload.graded || "no",
    grade: payload.grade ?? null,
    serial_number_text: payload.serial_number_text || "",
    quantity: payload.quantity ?? 1,
    estimated_price: payload.estimated_price ?? null,
    image_url: payload.image_url || null,
    back_image_url: payload.back_image_url || null,
    status: payload.status || "Collection",
    asking_price: payload.asking_price ?? null,
    listed_at: payload.listed_at || null,
    sold_price: payload.sold_price ?? null,
    sold_at: payload.sold_at || null,
    sale_platform: payload.sale_platform || null,
    notes: payload.notes || "",
    date_added: new Date().toISOString(),
  };
}

function compactUpdatePayload(payload: Partial<Card>) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries);
}

function taxonomyDiff(card: Card) {
  const normalized = normalizeCatalogTaxonomy(card);
  const changes: Partial<Card> = {};

  if (cleanText(card.sport) !== cleanText(normalized.sport)) changes.sport = normalized.sport;
  if (cleanText(card.competition || "") !== cleanText(normalized.competition || "")) changes.competition = normalized.competition || null;
  if (cleanText(card.brand) !== cleanText(normalized.brand)) changes.brand = normalized.brand;
  if (cleanText(card.set_name) !== cleanText(normalized.set_name)) changes.set_name = normalized.set_name;

  return { normalized, changes };
}

export default function ImportPage() {
  const { user, loading } = useSupabaseUser();
  const previewSectionRef = useRef<HTMLElement | null>(null);
  const [existingCards, setExistingCards] = useState<Card[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [rows, setRows] = useState<RawRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<string>("");
  const [cleanupSummary, setCleanupSummary] = useState<string>("");
  const [gradeCompanyOverride, setGradeCompanyOverride] = useState<GradeCompany | "">("");
  const [duplicateChoices, setDuplicateChoices] = useState<Record<number, "update" | "add_quantity" | "skip">>({});
  const [importing, setImporting] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [previewFocus, setPreviewFocus] = useState<"all" | PreviewRow["action"]>("all");

  const loadExistingCards = async () => {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    const { data, error } = await supabase.from("cards").select("*").eq("user_id", user.id);
    if (error) {
      setParseErrors([`Could not load existing cards: ${error.message}`]);
      return;
    }
    setExistingCards((data ?? []) as Card[]);
  };

  useEffect(() => {
    loadExistingCards();
  }, [user?.id]);

  const existingByKey = useMemo(() => {
    const map = new Map<string, Card>();
    for (const card of existingCards) {
      const normalizedCard = normalizeCatalogTaxonomy(card);
      const key = buildIdentityKey(normalizedCard);
      if (key) map.set(key, card);
    }
    return map;
  }, [existingCards]);

  const cleanupCandidates = useMemo(() => {
    return existingCards
      .map((card) => ({ card, ...taxonomyDiff(card) }))
      .filter((entry) => Object.keys(entry.changes).length > 0);
  }, [existingCards]);

  const previewRows = useMemo(() => {
    const seenImportKeys = new Set<string>();

    return rows.map((row, index) => {
      if (!rowHasAnyData(row)) {
        return { rowNumber: index + 2, source: row, payload: {}, action: "skip", issues: [] } as PreviewRow;
      }

      const { payload, issues } = buildRowPayload(row, mapping, gradeCompanyOverride);

      for (const field of REQUIRED_FIELDS) {
        if (!cleanText(String((payload as any)[field] || ""))) {
          issues.push(`Missing required field: ${FIELD_LABELS[field as ImportField]}.`);
        }
      }

      const identityKey = buildIdentityKey(payload);
      if (identityKey) {
        if (seenImportKeys.has(identityKey)) {
          issues.push("This row duplicates another row in the same import file.");
        } else {
          seenImportKeys.add(identityKey);
        }
      }

      const matched = identityKey ? existingByKey.get(identityKey) : undefined;
      const action: PreviewRow["action"] = issues.length ? "needs_attention" : matched ? "update" : "create";

      return {
        rowNumber: index + 2,
        source: row,
        payload,
        action,
        issues,
        matchId: matched?.id,
        matchedCard: matched,
      } as PreviewRow;
    });
  }, [rows, mapping, existingByKey, gradeCompanyOverride]);

  const stats = useMemo(() => {
    const createCount = previewRows.filter((row) => row.action === "create").length;
    const updateCount = previewRows.filter((row) => row.action === "update").length;
    const flaggedCount = previewRows.filter((row) => row.action === "needs_attention").length;
    const skippedCount = previewRows.filter((row) => row.action === "skip").length;
    return { createCount, updateCount, flaggedCount, skippedCount };
  }, [previewRows]);

  const focusedPreviewRows = useMemo(() => {
    if (previewFocus === "all") return previewRows;
    return previewRows.filter((row) => row.action === previewFocus);
  }, [previewRows, previewFocus]);

  const focusPreviewRows = (nextFocus: "all" | PreviewRow["action"]) => {
    setPreviewFocus(nextFocus);
    requestAnimationFrame(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportSummary("");
    setParseErrors([]);

    if (!file) return;
    setFileName(file.name);

    const ext = file.name.toLowerCase().replace(/^.*\./, "");
    const isXlsx = ext === "xlsx" || ext === "xls";

    if (!isXlsx) {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const nextHeaders = (results.meta.fields || []).filter(Boolean);
          const cleanedRows = (results.data || []).map((row) => {
            const cleaned: RawRow = {};
            nextHeaders.forEach((header) => {
              cleaned[header] = cleanText((row as any)[header] || "");
            });
            return cleaned;
          });

          const nextMapping: Mapping = {};
          nextHeaders.forEach((header) => {
            nextMapping[header] = guessField(header);
          });

          setHeaders(nextHeaders);
          setMapping(nextMapping);
          setRows(cleanedRows);
          setDuplicateChoices({});
          setParseErrors((results.errors || []).map((error) => `Row ${error.row}: ${error.message}`));
        },
        error: (error) => {
          setParseErrors([error.message]);
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setParseErrors(["No worksheets found in spreadsheet."]);
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];

        // header row = first row
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: "" });
        if (!matrix.length) {
          setParseErrors(["Spreadsheet is empty."]);
          return;
        }
        const headerRow = (matrix[0] || []).map((h) => cleanText(String(h || "")));
        const nextHeaders = headerRow.map((h) => (h ? h : "")).filter((h) => h !== "");
        if (!nextHeaders.length) {
          setParseErrors(["Could not find header row (first row must contain column names)."]);
          return;
        }

        const cleanedRows: RawRow[] = [];
        // Build column index mapping based on the original headerRow positions
        const headerIndexMap: Array<{ header: string; index: number }> = [];
        headerRow.forEach((h, idx) => {
          if (h) headerIndexMap.push({ header: h, index: idx });
        });

        for (let r = 1; r < matrix.length; r++) {
          const rowArr = matrix[r] || [];
          const cleaned: RawRow = {};
          headerIndexMap.forEach(({ header, index }) => {
            cleaned[header] = cleanText(String(rowArr[index] ?? ""));
          });
          if (Object.values(cleaned).some((v) => cleanText(v) !== "")) cleanedRows.push(cleaned);
        }

        const nextMapping: Mapping = {};
        headerIndexMap.forEach(({ header }) => {
          nextMapping[header] = guessField(header);
        });

        setHeaders(headerIndexMap.map((h) => h.header));
        setMapping(nextMapping);
        setRows(cleanedRows);
        setDuplicateChoices({});
      } catch (e: any) {
        setParseErrors([e?.message || "Failed to parse spreadsheet."]);
      }
    };
    reader.onerror = () => setParseErrors(["Failed to read spreadsheet file."]);
    reader.readAsArrayBuffer(file);
  };

  const onImport = async () => {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    const readyRows = previewRows.filter((row) => {
      if (row.action === "create") return true;
      if (row.action === "update") return (duplicateChoices[row.rowNumber] || "add_quantity") !== "skip";
      return false;
    });
    if (!readyRows.length) {
      setImportSummary("No ready rows to import yet. Fix flagged rows or upload a different file.");
      return;
    }

    setImporting(true);
    let created = 0;
    let updated = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const row of readyRows) {
      if (row.action === "create") {
        const { error } = await supabase.from("cards").insert(createInsertPayload(row.payload, user.id));
        if (error) {
          failed += 1;
          failures.push(`Row ${row.rowNumber}: ${error.message}`);
        } else {
          created += 1;
        }
      }

      if (row.action === "update" && row.matchId) {
        const choice = duplicateChoices[row.rowNumber] || "add_quantity";
        const existingQty = Number(row.matchedCard?.quantity || 0);
        const importQty = Number(row.payload.quantity || 1);
        const payload =
          choice === "add_quantity"
            ? compactUpdatePayload({ ...row.payload, quantity: existingQty + importQty })
            : compactUpdatePayload(row.payload);

        const { error } = await supabase
          .from("cards")
          .update(payload)
          .eq("id", row.matchId)
          .eq("user_id", user.id);

        if (error) {
          failed += 1;
          failures.push(`Row ${row.rowNumber}: ${error.message}`);
        } else {
          updated += 1;
        }
      }
    }

    setImporting(false);
    setImportSummary(
      `${created} created, ${updated} updated, ${failed} failed.${stats.flaggedCount ? ` ${stats.flaggedCount} flagged row(s) still need attention.` : ""}`
    );
    setParseErrors(failures);

    await loadExistingCards();
  };

  const onCleanupTaxonomy = async () => {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    if (!cleanupCandidates.length) {
      setCleanupSummary("No taxonomy cleanup is needed right now.");
      return;
    }

    setCleaningUp(true);
    let updated = 0;
    const failures: string[] = [];

    for (const entry of cleanupCandidates) {
      const { error } = await supabase
        .from("cards")
        .update(entry.changes)
        .eq("id", entry.card.id)
        .eq("user_id", user.id);

      if (error) failures.push(`${entry.card.player_name}: ${error.message}`);
      else updated += 1;
    }

    setCleaningUp(false);
    setCleanupSummary(
      failures.length ? `${updated} card(s) cleaned up, ${failures.length} failed.` : `${updated} card(s) cleaned up.`
    );
    if (failures.length) setParseErrors(failures);
    await loadExistingCards();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 text-slate-300">Loading import tools...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Sign in required</h1>
          <p className="mt-3 text-slate-300">Please sign in to import a collection.</p>
          <a href="/login" className="mt-6 inline-flex rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]">Go to sign in</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardCatLogo />
            <h1 className="mt-3 text-2xl font-bold">Import collection</h1>
            <div className="mt-1 text-sm text-slate-400">Upload a CSV, review the mapping, then import only the rows that are ready.</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/catalog" className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700">Catalog</a>
            <a href="/add-card" className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700">Add Card</a>
            <button className="rounded-lg bg-[#d50000] px-4 py-2 font-semibold hover:bg-[#b80000]" onClick={onImport} disabled={importing || !previewRows.some((row) => row.action === "create" || row.action === "update")}>
              {importing ? "Importing..." : "Import ready rows"}
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-lg font-semibold">Import with confidence</div>
              <p className="mt-1 text-sm text-slate-400">CardCat is designed to be seller-friendly, not lock-in friendly. Review the preview first, import only ready rows, and keep a CSV backup whenever you want.</p>
            </div>
            <a href="/catalog" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700">Back to catalog</a>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-sm font-semibold text-slate-100">1. Start simple</div>
              <div className="mt-1 text-sm text-slate-400">Map the required fields first. You can leave extra columns ignored until the core import looks right.</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-sm font-semibold text-slate-100">2. Review before writing</div>
              <div className="mt-1 text-sm text-slate-400">Every row gets a preview state so you can catch missing years, bad statuses, or duplicate identities before import.</div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
              <div className="text-sm font-semibold text-slate-100">3. Keep your backup</div>
              <div className="mt-1 text-sm text-slate-300">After importing, use Export CSV from Catalog anytime for a portable backup and easy cleanup in Sheets or Excel.</div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="text-lg font-semibold">1. Upload CSV</div>
          <p className="mt-2 text-sm text-slate-400">If the structure is close to CardCat already, this should be quick. If not, you can remap columns below.</p>
          <input
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="mt-4 block w-full text-sm text-slate-300"
            onChange={onFileChange}
          />
          {fileName ? <div className="mt-3 text-sm text-slate-300">Loaded file: {fileName}</div> : null}
          {importSummary ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3 text-sm text-emerald-200">{importSummary}</div> : null}
          {parseErrors.length ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3 text-sm text-red-200">
              <div className="font-semibold">Import notes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {parseErrors.slice(0, 10).map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {headers.length > 0 && (
          <>
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold">2. Map columns</div>
                  <p className="mt-1 text-sm text-slate-400">We guessed the closest CardCat fields. Change anything that looks wrong before importing.</p>
                </div>
                <div className="text-sm text-slate-400">{rows.length} row(s) detected</div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-slate-200">Required fields</div>
                    <div className="text-xs text-slate-400">Only show dropdowns for what we need (edit more below).</div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {REQUIRED_FIELDS.map((field) => {
                      const assignedHeader = headers.find((h) => mapping[h] === field) || "";
                      return (
                        <label key={field} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                          <div className="text-sm font-semibold text-slate-200">{FIELD_LABELS[field as ImportField]}</div>
                          <select
                            className="mt-2 w-full rounded bg-slate-900 px-3 py-2 text-sm"
                            value={assignedHeader}
                            onChange={(e) => {
                              const nextHeader = e.target.value;
                              setMapping((prev) => {
                                const next: Mapping = { ...prev };
                                // Unassign this field from any other header.
                                for (const h of headers) {
                                  if (next[h] === field) next[h] = "__ignore";
                                }
                                if (nextHeader) next[nextHeader] = field;
                                return next;
                              });
                            }}
                          >
                            <option value="">(not mapped)</option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    {(() => {
                      const assignedHeader = headers.find((h) => mapping[h] === "grade") || "";
                      return (
                        <label className="rounded-xl border border-white/10 bg-slate-950/70 p-3 block">
                          <div className="text-sm font-semibold text-slate-200">{FIELD_LABELS.grade}</div>
                          <select
                            className="mt-2 w-full rounded bg-slate-900 px-3 py-2 text-sm"
                            value={assignedHeader}
                            onChange={(e) => {
                              const nextHeader = e.target.value;
                              setMapping((prev) => {
                                const next: Mapping = { ...prev };
                                for (const h of headers) {
                                  if (next[h] === "grade") next[h] = "__ignore";
                                }
                                if (nextHeader) next[nextHeader] = "grade";
                                return next;
                              });
                            }}
                          >
                            <option value="">(optional, not mapped)</option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 text-xs text-slate-400">If you mapped Grade, we’ll apply it when present.</div>
                        </label>
                      );
                    })()}
                  </div>
                </div>

                <details className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">
                    Advanced mapping (show all columns)
                    <span className="ml-2 text-xs text-slate-400">(power users)</span>
                  </summary>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {headers.map((header) => (
                      <label key={header} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                        <div className="text-sm font-semibold text-slate-200">{header}</div>
                        <select
                          className="mt-2 w-full rounded bg-slate-900 px-3 py-2 text-sm"
                          value={mapping[header] || "__ignore"}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value as ImportField }))}
                        >
                          {FIELD_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {FIELD_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </details>
              </div>

              {Object.values(mapping).includes("grade") && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-200">Grade company (optional)</label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      className="w-full rounded bg-slate-900 px-3 py-2 text-sm"
                      value={gradeCompanyOverride}
                      onChange={(e) => setGradeCompanyOverride(e.target.value as GradeCompany | "")} 
                    >
                      <option value="">Auto-detect from grade text</option>
                      <option value="PSA">PSA</option>
                      <option value="BGS">BGS</option>
                      <option value="CSG">CSG</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Used only when the grade text doesn’t include PSA/BGS/CSG.
                  </div>
                </div>
              )}
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition-colors ${previewFocus === "create" ? "border-emerald-400/40 bg-emerald-500/[0.14]" : "border-emerald-500/20 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]"}`}
                onClick={() => focusPreviewRows("create")}
              >
                <div className="text-sm text-slate-300">Create</div>
                <div className="mt-2 text-2xl font-bold">{stats.createCount}</div>
                <div className="mt-2 text-xs text-slate-400">Show rows ready to create</div>
              </button>
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition-colors ${previewFocus === "update" ? "border-blue-400/40 bg-blue-500/[0.14]" : "border-blue-500/20 bg-blue-500/[0.08] hover:bg-blue-500/[0.12]"}`}
                onClick={() => focusPreviewRows("update")}
              >
                <div className="text-sm text-slate-300">Possible duplicates</div>
                <div className="mt-2 text-2xl font-bold">{stats.updateCount}</div>
                <div className="mt-2 text-xs text-slate-400">Review and choose how to merge</div>
              </button>
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition-colors ${previewFocus === "needs_attention" ? "border-amber-400/40 bg-amber-500/[0.14]" : "border-amber-500/20 bg-amber-500/[0.08] hover:bg-amber-500/[0.12]"}`}
                onClick={() => focusPreviewRows("needs_attention")}
              >
                <div className="text-sm text-slate-300">Needs attention</div>
                <div className="mt-2 text-2xl font-bold">{stats.flaggedCount}</div>
                <div className="mt-2 text-xs text-slate-400">Jump to the rows blocking import</div>
              </button>
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition-colors ${previewFocus === "skip" ? "border-white/20 bg-white/[0.08]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"}`}
                onClick={() => focusPreviewRows("skip")}
              >
                <div className="text-sm text-slate-300">Skipped</div>
                <div className="mt-2 text-2xl font-bold">{stats.skippedCount}</div>
                <div className="mt-2 text-xs text-slate-400">See rows currently marked to skip</div>
              </button>
            </section>

            <section ref={previewSectionRef} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-lg font-semibold">3. Preview</div>
              <p className="mt-2 text-sm text-slate-400">Ready rows can import now. Flagged rows are held back until the file or mapping is fixed.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {([
                  ["all", `All rows (${previewRows.length})`],
                  ["create", `Create (${stats.createCount})`],
                  ["update", `Possible duplicates (${stats.updateCount})`],
                  ["needs_attention", `Needs attention (${stats.flaggedCount})`],
                  ["skip", `Skipped (${stats.skippedCount})`],
                ] as const).map(([value, label]) => {
                  const active = previewFocus === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${active ? "bg-[#d50000] text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
                      onClick={() => focusPreviewRows(value)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-sm text-slate-400">
                Showing {focusedPreviewRows.length} of {previewRows.length} preview row{previewRows.length === 1 ? "" : "s"}.
              </div>

              <div className="mt-4 space-y-3">
                {focusedPreviewRows.map((row) => (
                  <div key={row.rowNumber} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Row {row.rowNumber}</div>
                        <div className="mt-1 text-sm text-slate-300">
                          {row.payload.player_name || "(no player)"} · {row.payload.year || "(no year)"} · {row.payload.brand || "(no brand)"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {row.payload.set_name || "(no set)"} · #{row.payload.card_number || "?"}
                        </div>
                      </div>
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.action === "create" ? "bg-emerald-500/15 text-emerald-200" : row.action === "update" ? "bg-blue-500/15 text-blue-200" : row.action === "needs_attention" ? "bg-amber-500/15 text-amber-200" : "bg-slate-800 text-slate-300"}`}>
                        {row.action === "create" ? "Create" : row.action === "update" ? "Update" : row.action === "needs_attention" ? "Needs attention" : "Skip"}
                      </div>
                    </div>

                    {row.issues.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-200">
                        {row.issues.map((issue, index) => (
                          <li key={`${issue}-${index}`}>{issue}</li>
                        ))}
                      </ul>
                    ) : row.action === "update" && row.matchedCard ? (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Import row</div>
                            <div className="mt-2 text-slate-200">{row.payload.player_name} · {row.payload.year}</div>
                            <div className="text-slate-400">{row.payload.brand} · {row.payload.set_name} · {row.payload.parallel}</div>
                            <div className="text-slate-400">#{row.payload.card_number} · Qty {row.payload.quantity || 1}</div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Existing card</div>
                            <div className="mt-2 text-slate-200">{row.matchedCard.player_name} · {row.matchedCard.year}</div>
                            <div className="text-slate-400">{row.matchedCard.brand} · {row.matchedCard.set_name} · {row.matchedCard.parallel}</div>
                            <div className="text-slate-400">#{row.matchedCard.card_number} · Qty {row.matchedCard.quantity || 1}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {([
                            ["add_quantity", "Add quantity"],
                            ["update", "Update existing"],
                            ["skip", "Skip row"],
                          ] as const).map(([value, label]) => {
                            const active = (duplicateChoices[row.rowNumber] || "add_quantity") === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-amber-500/15 text-amber-200" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                                onClick={() => setDuplicateChoices((prev) => ({ ...prev, [row.rowNumber]: value }))}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-sm text-slate-400">
                          {(duplicateChoices[row.rowNumber] || "add_quantity") === "add_quantity"
                            ? "This will add the imported quantity onto the existing card instead of creating a duplicate."
                            : (duplicateChoices[row.rowNumber] || "add_quantity") === "update"
                              ? "This will update the existing card with the mapped import values."
                              : "This row will be skipped during import."}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-400">
                        {row.action === "create" ? "Ready to create a new card." : "Blank row."}
                      </div>
                    )}
                  </div>
                ))}
                {focusedPreviewRows.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                    No rows in this bucket right now.
                  </div>
                ) : null}
              </div>

              {previewRows.length > 25 ? <div className="mt-4 text-sm text-slate-400">Showing first 25 preview rows.</div> : null}
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold">4. Cleanup naming</div>
                  <p className="mt-1 text-sm text-slate-400">Use this after import to normalize duplicate taxonomy like NFL / Football or Panini Prizm / Prizm.</p>
                </div>
                <button
                  className="rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700 disabled:opacity-50"
                  onClick={onCleanupTaxonomy}
                  disabled={cleaningUp || cleanupCandidates.length === 0}
                >
                  {cleaningUp ? "Cleaning up..." : `Apply cleanup (${cleanupCandidates.length})`}
                </button>
              </div>

              {cleanupSummary ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3 text-sm text-emerald-200">{cleanupSummary}</div> : null}

              {cleanupCandidates.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {cleanupCandidates.slice(0, 10).map((entry) => (
                    <div key={entry.card.id || `${entry.card.player_name}-${entry.card.card_number}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="font-semibold text-slate-200">{entry.card.player_name}</div>
                      <div className="mt-1 text-sm text-slate-400">{entry.card.year} · {entry.card.brand} · {entry.card.set_name}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {entry.changes.sport ? <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-200">Sport: {entry.card.sport || "-"} → {entry.changes.sport}</span> : null}
                        {entry.changes.brand ? <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-200">Brand: {entry.card.brand || "-"} → {entry.changes.brand}</span> : null}
                        {entry.changes.set_name ? <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-200">Set: {entry.card.set_name || "-"} → {entry.changes.set_name}</span> : null}
                      </div>
                    </div>
                  ))}
                  {cleanupCandidates.length > 10 ? <div className="text-sm text-slate-400">Showing first 10 cleanup suggestions.</div> : null}
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-400">No cleanup suggestions right now.</div>
              )}
            </section>
          </>
        )}
      </div>
      <CardCatMobileNav />
    </main>
  );
}
