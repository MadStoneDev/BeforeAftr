const LEADING_COUNT = /^(\d+[+]?[\s._-]*)(.+)$/;
const HAS_LETTERS = /[a-zA-Z]/;
const PURE_NUMERIC = /^\d+$/;

export function deriveTagFromFolderName(rawName: string): string | null {
  const name = rawName.trim();
  if (!name) return null;
  if (PURE_NUMERIC.test(name)) return null;

  let core = name;
  const m = name.match(LEADING_COUNT);
  if (m) {
    const remainder = m[2].trim();
    if (HAS_LETTERS.test(remainder)) {
      core = remainder;
    }
  }

  if (!HAS_LETTERS.test(core)) return null;

  const words = core.split(/\s+/);
  if (words.length === 0) return null;
  const lastIndex = words.length - 1;
  words[lastIndex] = singularize(words[lastIndex]);
  return words.join(" ");
}

export function deriveTagsFromPath(path: string): string[] {
  if (!path) return [];
  const segments = path.split("/");
  const ancestors = segments.slice(0, -1);
  const seen = new Map<string, string>(); // lowercase → first-encountered display
  for (const seg of ancestors) {
    const tag = deriveTagFromFolderName(seg);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (!seen.has(key)) seen.set(key, tag);
  }
  return Array.from(seen.values());
}

export function mergeTagList(lists: readonly (readonly string[])[]): string[] {
  const seen = new Map<string, string>();
  for (const list of lists) {
    for (const tag of list) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) seen.set(key, tag);
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function singularize(word: string): string {
  if (word.length <= 2) return word;
  const lower = word.toLowerCase();

  // -ies → -y (cities → city)
  if (lower.endsWith("ies")) {
    return word.slice(0, -3) + (isUpper(word, word.length - 3) ? "Y" : "y");
  }

  // -ses / -xes / -zes / -ches / -shes → strip "es"
  if (/(s|x|z|ch|sh)es$/i.test(word)) {
    return word.slice(0, -2);
  }

  // -oes → strip "es" (heroes → hero, but NOT shoes → sho; allow false positives for now)
  if (lower.endsWith("oes")) {
    return word.slice(0, -2);
  }

  // -s (but not -ss, -us, -is, -os — those are typically not plurals)
  if (lower.endsWith("s") && !/(s|u|i|o)s$/i.test(word)) {
    return word.slice(0, -1);
  }

  return word;
}

function isUpper(s: string, index: number): boolean {
  const c = s[index];
  return c >= "A" && c <= "Z";
}
