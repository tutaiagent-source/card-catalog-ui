"use client";

import Papa from "papaparse";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import CardCatMobileNav from "@/components/CardCatMobileNav";

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
  | "rookie"
  | "is_autograph"
  | "has_memorabilia"
  | "graded"
  | "grade"
  | "serial_number_text"
  | "quantity"
  | "estimated_price"
  | "status"
  | "asking_price"
  | "listed_at"
  | "sold_price"
  | "sold_at"
  | "sale_platform"
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
  rookie: "Rookie",
  is_autograph: "Autograph",
  has_memorabilia: "Memorabilia",
  graded: "Graded",
  grade: "Grade",
  serial_number_text: "Serial",
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
  "rookie",
  "is_autograph",
  "has_memorabilia",
  "graded",
  "grade",
  "serial_number_text",
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
  player_name: ["player", "player name", "name", "athlete"],
  year: ["year", "season"],
  brand: ["brand", "manufacturer", "company"],
  set_name: ["set", "set name", "series", "product"],
  parallel: ["parallel", "insert", "parallel/insert", "variation"],
  card_number: ["card number", "card #", "number", "card no", "cardnum", "card_num"],
  team: ["team", "club"],
  sport: ["sport", "league"],
  rookie: ["rookie", "rc"],
  is_autograph: ["autograph", "auto", "is autograph", "signed"],
  has_memorabilia: ["memorabilia", "mem", "patch", "jersey", "relic"],
  graded: ["graded", "is graded"],
  grade: ["grade", "grade number", "grading"],
  serial_number_text: ["serial", "serial number", "serial #", "numbered", "serial_number_text"],
  quantity: ["qty", "quantity", "count"],
  estimated_price: ["estimated price", "estimated value", "value", "price", "est price"],
  status: ["status", "collection status"],
  asking_price: ["asking price", "list price", "listed price"],
  listed_at: ["listed date", "listed at", "date listed"],
  sold_price: ["sold price", "sale price"],
  sold_at: ["sold date", "sold at", "date sold"],
  sale_platform: ["platform", "site", "app", "marketplace"],
  notes: ["notes", "comment", "comments", "description"],
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
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<[Exclude<ImportField, "__ignore">, string[]]>) {
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) return field;
  }
  return "__ignore";
}

function normalizeYesNo(value: string): { value?: YesNo; issue?: string } {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return {};
  if (["yes", "y", "true", "1"].includes(raw)) return { value: "yes" };
  if (["no", "n", "false", "0"].includes(raw)) return { value: "no" };
  return { issue: `Could not read yes/no value "${value}".` };
}

function normalizeStatus(value: string): { value?: CardStatus; issue?: string } {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return {};
  if (["collection", "incoming"].includes(raw)) return { value: "Collection" };
  if (raw === "listed") return { value: "Listed" };
  if (raw === "sold") return { value: "Sold" };
  return { issue: `Unknown status "${value}".` };
}

function normalizeNumber(value: string): { value?: number; issue?: string } {
  const raw = String(value || "").trim();
  if (!raw) return {};
  const numeric = Number(raw.replace(/[$,]/g, ""));
  if (Number.isFinite(numeric)) return { value: numeric };
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
  const parsed = normalizeNumber(value);
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
  const parts = [
    values.player_name,
    values.year,
    values.brand,
    values.set_name,
    values.parallel || "n/a",
    values.card_number,
    values.team,
    values.sport,
  ].map((part) => cleanText(String(part || "")).toLowerCase());

  if (parts.some((part) => !part)) return null;
  return parts.join("|");
}

function rowHasAnyData(row: RawRow) {
  return Object.values(row).some((value) => cleanText(value) !== "");
}

function buildRowPayload(row: RawRow, mapping: Mapping) {
  const payload: Partial<Card> = {};
  const issues: string[] = [];

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
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value) (payload as any)[target] = normalized.value;
        break;
      }
      case "status": {
        const normalized = normalizeStatus(rawValue);
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value) payload.status = normalized.value;
        break;
      }
      case "quantity": {
        const normalized = normalizeQuantity(rawValue);
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value != null) payload.quantity = normalized.value;
        break;
      }
      case "grade": {
        const normalized = normalizeGrade(rawValue);
        if (normalized.issue) issues.push(normalized.issue);
        else if (normalized.value != null) payload.grade = normalized.value;
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

  if (!payload.parallel) payload.parallel = "n/a";
  if (!payload.serial_number_text) payload.serial_number_text = "";

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

export default function ImportPage() {
  const { user, loading } = useSupabaseUser();
  const [existingCards, setExistingCards] = useState<Card[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [rows, setRows] = useState<RawRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<string>("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !supabase) return;

    (async () => {
      const { data, error } = await supabase.from("cards").select("*").eq("user_id", user.id);
      if (error) {
        setParseErrors([`Could not load existing cards: ${error.message}`]);
        return;
      }
      setExistingCards((data ?? []) as Card[]);
    })();
  }, [user?.id]);

  const existingByKey = useMemo(() => {
    const map = new Map<string, Card>();
    for (const card of existingCards) {
      const key = buildIdentityKey(card);
      if (key) map.set(key, card);
    }
    return map;
  }, [existingCards]);

  const previewRows = useMemo(() => {
    const seenImportKeys = new Set<string>();

    return rows.map((row, index) => {
      if (!rowHasAnyData(row)) {
        return { rowNumber: index + 2, source: row, payload: {}, action: "skip", issues: [] } as PreviewRow;
      }

      const { payload, issues } = buildRowPayload(row, mapping);

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
      } as PreviewRow;
    });
  }, [rows, mapping, existingByKey]);

  const stats = useMemo(() => {
    const createCount = previewRows.filter((row) => row.action === "create").length;
    const updateCount = previewRows.filter((row) => row.action === "update").length;
    const flaggedCount = previewRows.filter((row) => row.action === "needs_attention").length;
    const skippedCount = previewRows.filter((row) => row.action === "skip").length;
    return { createCount, updateCount, flaggedCount, skippedCount };
  }, [previewRows]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportSummary("");
    setParseErrors([]);

    if (!file) return;
    setFileName(file.name);

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
        setParseErrors((results.errors || []).map((error) => `Row ${error.row}: ${error.message}`));
      },
      error: (error) => {
        setParseErrors([error.message]);
      },
    });
  };

  const onImport = async () => {
    if (!user?.id || !supabaseConfigured || !supabase) return;
    const readyRows = previewRows.filter((row) => row.action === "create" || row.action === "update");
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
        const { error } = await supabase
          .from("cards")
          .update(compactUpdatePayload(row.payload))
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

    const { data } = await supabase.from("cards").select("*").eq("user_id", user.id);
    setExistingCards((data ?? []) as Card[]);
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
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              CardCat.io
            </div>
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
          <div className="text-lg font-semibold">1. Upload CSV</div>
          <p className="mt-2 text-sm text-slate-400">If the structure is close to CardCat already, this should be quick. If not, you can remap columns below.</p>
          <input type="file" accept=".csv,text/csv" className="mt-4 block w-full text-sm text-slate-300" onChange={onFileChange} />
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
                        <option key={option} value={option}>{FIELD_LABELS[option]}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                <div className="text-sm text-slate-300">Create</div>
                <div className="mt-2 text-2xl font-bold">{stats.createCount}</div>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
                <div className="text-sm text-slate-300">Update</div>
                <div className="mt-2 text-2xl font-bold">{stats.updateCount}</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4">
                <div className="text-sm text-slate-300">Needs attention</div>
                <div className="mt-2 text-2xl font-bold">{stats.flaggedCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm text-slate-300">Skipped</div>
                <div className="mt-2 text-2xl font-bold">{stats.skippedCount}</div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-lg font-semibold">3. Preview</div>
              <p className="mt-2 text-sm text-slate-400">Ready rows can import now. Flagged rows are held back until the file or mapping is fixed.</p>

              <div className="mt-4 space-y-3">
                {previewRows.slice(0, 25).map((row) => (
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
                    ) : (
                      <div className="mt-3 text-sm text-slate-400">
                        {row.action === "update" ? "Matched an existing card and will update only the mapped fields." : row.action === "create" ? "Ready to create a new card." : "Blank row."}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {previewRows.length > 25 ? <div className="mt-4 text-sm text-slate-400">Showing first 25 preview rows.</div> : null}
            </section>
          </>
        )}
      </div>
      <CardCatMobileNav />
    </main>
  );
}
