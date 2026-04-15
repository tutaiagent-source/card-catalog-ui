export type GradeCompany = "PSA" | "BGS" | "CSG" | "Other";

function clean(s: string) {
  return String(s || "").trim();
}

export function parseGradeCompany(raw: string): GradeCompany {
  const s = clean(raw).toLowerCase();
  if (!s) return "Other";
  if (s.includes("psa")) return "PSA";
  if (s.includes("bgs") || s.includes("becket")) return "BGS";
  if (s.includes("csg")) return "CSG";
  return "Other";
}

export function parseGradeNumber(raw: string): { gradeNumber?: number; gradeText?: string; issue?: string } {
  const s = clean(raw);
  if (!s) return {};

  // Find first number, allowing decimals.
  const m = s.match(/(\d+(?:[\.,]\d+)?)/);
  if (!m) return { issue: `Could not read number "${raw}".` };

  const numText = m[1].replace(",", ".");
  const num = Number(numText);
  if (!Number.isFinite(num)) return { issue: `Could not read number "${raw}".` };

  if (num < 1 || num > 10) {
    return { issue: `Grade must be between 1 and 10. Got "${raw}".` };
  }

  return { gradeNumber: num, gradeText: numText };
}

export function upsertNotesLines(notes: string | null | undefined, lines: string[]): string {
  const base = String(notes || "");
  const baseLines = base
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "");

  const newLines = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l);

  // Remove any existing lines with the same prefix key.
  const keys = new Set(newLines.map((l) => l.split(":")[0].trim()));
  const kept = baseLines.filter((l) => !keys.has(l.split(":")[0].trim()));

  return [...newLines, ...kept].join("\n");
}

export function upsertGradeCompanyInNotes(params: {
  notes?: string | null;
  gradeCompany?: GradeCompany | null;
  gradeText?: string | null;
}): string {
  const { notes, gradeCompany, gradeText } = params;

  const lineCompany = gradeCompany ? `Grade company: ${gradeCompany}` : null;
  const lineValue = gradeText && String(gradeText).includes(".") ? `Grade value: ${gradeText}` : null;

  const lines = [lineCompany, lineValue].filter(Boolean) as string[];
  if (!lines.length) return String(notes || "");

  return upsertNotesLines(notes, lines);
}

export function parseGradeCompanyFromNotes(notes?: string | null): GradeCompany | null {
  const s = String(notes || "");
  const m = s.match(/Grade company:\s*(PSA|BGS|CSG|Other)/i);
  if (!m) return null;
  const v = m[1].toUpperCase();
  if (v === "PSA" || v === "BGS" || v === "CSG") return v as GradeCompany;
  return "Other";
}
