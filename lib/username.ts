export function normalizeUsername(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export function validateUsername(value: string) {
  const username = String(value || "").trim().toLowerCase();

  if (!username) return "Choose a username.";
  if (!/^[a-z0-9_]+$/.test(username)) return "Use only lowercase letters, numbers, and underscores.";
  if (username.length < 3) return "Use at least 3 characters.";
  if (username.length > 24) return "Use 24 characters or fewer.";

  return "";
}
