import { getTopicById, matchTopicKeywords } from "./topics";

const LEADING_COUNT = /^(\d+[+]?[\s._-]*)(.+)$/;
const HAS_LETTERS = /[a-zA-Z]/;
const PURE_NUMERIC = /^\d+$/;
const DIMENSION_RE = /^\d{2,5}x\d{2,5}$/i;
const NOISE = new Set([
  "grid", "nogrid", "no-grid", "gridless", "gridded",
  "v1", "v2", "v3", "v4", "final", "draft", "copy", "backup",
  "hd", "hq", "lq", "web", "print", "original", "edit", "edited",
]);

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

export function deriveTagsFromFilename(
  name: string,
  topicId?: string | null,
): string[] {
  const base = name.replace(/\.[^.]+$/, "");
  const tokens = base
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_\-.,;:!?()[\]{}]+/)
    .filter(Boolean);

  const meaningful: string[] = [];
  for (const raw of tokens) {
    const t = raw.toLowerCase();
    if (PURE_NUMERIC.test(t)) continue;
    if (DIMENSION_RE.test(t)) continue;
    if (NOISE.has(t)) continue;
    if (t.length < 2) continue;
    meaningful.push(t);
  }

  const tags: string[] = [];

  if (topicId) {
    const topic = getTopicById(topicId);
    if (topic) {
      const matched = matchTopicKeywords(meaningful, topic);
      tags.push(...matched);
    }
  }

  return tags;
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

  // -lves → -lf (wolves → wolf, shelves → shelf, elves → elf, selves → self).
  // Other -ves shapes (-ives / -aves / -ieves) are left alone — they fall
  // through to the -s rule, which is wrong for knife/leaf/thief but right for
  // olives/graves/sleeves; folder names skew toward the latter.
  if (lower.endsWith("lves")) {
    return word.slice(0, -3) + (isUpper(word, word.length - 3) ? "F" : "f");
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
