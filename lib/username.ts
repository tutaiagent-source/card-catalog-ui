import { RESERVED_USERNAMES_SEED } from "./reservedUsernames";

export function normalizeUsername(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

const RESERVED_TOKENS = (() => {
  const raw = RESERVED_USERNAMES_SEED.split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const normalized = raw.map((t) => normalizeUsername(t));
  const exact = new Set<string>();
  const substring = new Set<string>();

  for (const t of normalized) {
    if (!t) continue;
    if (t.length <= 3) exact.add(t);
    else substring.add(t);
  }

  return { exact, substring };
})();

export function validateUsername(value: string) {
  const username = String(value || "").trim().toLowerCase();

  if (!username) return "Choose a username.";
  if (!/^[a-z0-9_]+$/.test(username)) return "Use only lowercase letters, numbers, and underscores.";
  if (username.length < 3) return "Use at least 3 characters.";
  if (username.length > 24) return "Use 24 characters or fewer.";

  if (RESERVED_TOKENS.exact.has(username)) {
    return "That username is reserved. Try something else.";
  }

  for (const t of RESERVED_TOKENS.substring) {
    if (username.includes(t)) {
      return "That username is reserved. Try something else.";
    }
  }

  return "";
}
