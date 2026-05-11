import type { LibraryNode } from "./types";

const VARIANT_SUFFIXES = new Set([
  "day", "night", "dawn", "dusk", "evening", "morning", "midnight",
  "rain", "rainy", "snow", "snowy", "fog", "foggy", "storm", "stormy",
  "fey", "feywild", "shadowfell", "hellscape", "void", "astral", "ethereal",
  "clean", "simple", "plain", "bare", "empty",
  "ruined", "ruins", "destroyed", "abandoned", "overgrown",
  "lit", "unlit", "dark", "bright", "dim",
  "spring", "summer", "autumn", "fall", "winter",
  "grid", "gridless", "nogrid", "no-grid", "gridded",
  "4k", "2k", "1080p", "hd", "lowres",
  "original", "alt", "alternate", "variant", "v1", "v2", "v3", "v4", "v5",
  "a", "b", "c", "d",
]);

const DIMENSION_RE = /^\d{2,5}x\d{2,5}$/i;
const PURE_NUMERIC = /^\d+$/;
const RESOLUTION_RE = /^\d{2,5}(px|ppi|dpi)$/i;

export type VariantGroup = {
  baseName: string;
  representative: LibraryNode;
  variants: LibraryNode[];
};

export function extractBaseName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");

  const tokens = base
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .split(/[\s_\-.,;:!?()[\]{}]+/)
    .filter(Boolean);

  const meaningful: string[] = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (VARIANT_SUFFIXES.has(lower)) continue;
    if (DIMENSION_RE.test(lower)) continue;
    if (PURE_NUMERIC.test(lower)) continue;
    if (RESOLUTION_RE.test(lower)) continue;
    meaningful.push(lower);
  }

  return meaningful.join("_") || base.toLowerCase();
}

export function extractVariantLabel(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const tokens = base
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .split(/[\s_\-.,;:!?()[\]{}]+/)
    .filter(Boolean);

  const labels: string[] = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (VARIANT_SUFFIXES.has(lower) && !lower.match(/^(v\d|[a-d])$/)) {
      labels.push(token.charAt(0).toUpperCase() + token.slice(1).toLowerCase());
    }
  }

  return labels.length > 0 ? labels.join(" · ") : "Original";
}

export function groupVariants(nodes: LibraryNode[]): (LibraryNode | VariantGroup)[] {
  const images = nodes.filter(
    (n) => n.kind === "file" && n.fileKind === "image",
  );
  const nonImages = nodes.filter(
    (n) => n.kind !== "file" || n.fileKind !== "image",
  );

  const dirGroups = new Map<string, Map<string, LibraryNode[]>>();
  for (const img of images) {
    const dir = img.path.substring(0, img.path.lastIndexOf("/"));
    if (!dirGroups.has(dir)) dirGroups.set(dir, new Map());
    const dirMap = dirGroups.get(dir)!;
    const base = extractBaseName(img.name);
    if (!dirMap.has(base)) dirMap.set(base, []);
    dirMap.get(base)!.push(img);
  }

  const result: (LibraryNode | VariantGroup)[] = [...nonImages];

  const grouped = new Set<string>();
  for (const [, dirMap] of dirGroups) {
    for (const [baseName, group] of dirMap) {
      if (group.length < 2) continue;
      group.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
      );
      result.push({
        baseName,
        representative: group[0],
        variants: group,
      });
      for (const g of group) grouped.add(g.path);
    }
  }

  for (const img of images) {
    if (!grouped.has(img.path)) result.push(img);
  }

  return result;
}

export function isVariantGroup(
  item: LibraryNode | VariantGroup,
): item is VariantGroup {
  return "variants" in item && "representative" in item;
}
