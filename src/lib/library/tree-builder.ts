import { deriveTagsFromPath } from "./tagging";
import type { LibraryEntry, LibraryNode } from "./types";

export function buildTree(
  rootName: string,
  entries: LibraryEntry[],
): LibraryNode {
  const root: LibraryNode = {
    path: "",
    name: rootName,
    kind: "directory",
    children: [],
    entry: { path: "", name: rootName, kind: "directory" },
    tags: [],
  };

  const byPath = new Map<string, LibraryNode>();
  byPath.set("", root);

  const ensureDir = (dirPath: string): LibraryNode => {
    const existing = byPath.get(dirPath);
    if (existing) return existing;
    const slash = dirPath.lastIndexOf("/");
    const parentPath = slash < 0 ? "" : dirPath.slice(0, slash);
    const name = slash < 0 ? dirPath : dirPath.slice(slash + 1);
    const parent = ensureDir(parentPath);
    const node: LibraryNode = {
      path: dirPath,
      name,
      kind: "directory",
      children: [],
      entry: { path: dirPath, name, kind: "directory" },
      tags: deriveTagsFromPath(dirPath),
    };
    parent.children!.push(node);
    byPath.set(dirPath, node);
    return node;
  };

  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));

  for (const entry of sorted) {
    const slash = entry.path.lastIndexOf("/");
    const parentPath = slash < 0 ? "" : entry.path.slice(0, slash);
    const parent = ensureDir(parentPath);

    if (entry.kind === "directory") {
      if (byPath.has(entry.path)) {
        byPath.get(entry.path)!.entry = entry;
        continue;
      }
      const node: LibraryNode = {
        path: entry.path,
        name: entry.name,
        kind: "directory",
        children: [],
        entry,
        tags: deriveTagsFromPath(entry.path),
      };
      parent.children!.push(node);
      byPath.set(entry.path, node);
    } else {
      const node: LibraryNode = {
        path: entry.path,
        name: entry.name,
        kind: "file",
        fileKind: entry.fileKind,
        entry,
        tags: deriveTagsFromPath(entry.path),
      };
      parent.children!.push(node);
    }
  }

  const sortChildren = (node: LibraryNode) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
    for (const child of node.children) sortChildren(child);
  };
  sortChildren(root);

  return root;
}

export function countFiles(node: LibraryNode): number {
  if (node.kind === "file") return 1;
  return (node.children ?? []).reduce((sum, c) => sum + countFiles(c), 0);
}

export function findNodeByPath(
  root: LibraryNode,
  path: string,
): LibraryNode | null {
  if (root.path === path) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }
  return null;
}
