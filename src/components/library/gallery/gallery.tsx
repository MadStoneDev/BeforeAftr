"use client";

import { useMemo } from "react";
import type { LibraryNode } from "@/lib/library/types";
import { GalleryTile } from "./gallery-tile";
import { TagFilterBar } from "./tag-filter-bar";

type Props = {
  node: LibraryNode;
  onSelect: (node: LibraryNode) => void;
  activeTagsLower: ReadonlySet<string>;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  recursive: boolean;
  onToggleRecursive: (v: boolean) => void;
};

export function Gallery({
  node,
  onSelect,
  activeTagsLower,
  onToggleTag,
  onClearTags,
  recursive,
  onToggleRecursive,
}: Props) {
  const items = useMemo(() => {
    const out: LibraryNode[] = [];
    const walk = (n: LibraryNode, includeDirs: boolean) => {
      if (!n.children) return;
      for (const child of n.children) {
        if (child.kind === "directory") {
          if (includeDirs) out.push(child);
          if (recursive) walk(child, false);
        } else {
          out.push(child);
        }
      }
    };
    walk(node, !recursive);
    return out;
  }, [node, recursive]);

  const tagsInScope = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      for (const t of item.tags) {
        const k = t.toLowerCase();
        if (!seen.has(k)) seen.set(k, t);
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [items]);

  const filtered = useMemo(() => {
    if (activeTagsLower.size === 0) return items;
    return items.filter((item) => {
      const itemLower = new Set(item.tags.map((t) => t.toLowerCase()));
      for (const active of activeTagsLower) {
        if (!itemLower.has(active)) return false;
      }
      return true;
    });
  }, [items, activeTagsLower]);

  const fileCount = filtered.filter((t) => t.kind === "file").length;
  const dirCount = filtered.filter((t) => t.kind === "directory").length;
  const hasActive = activeTagsLower.size > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="text-xs text-neutral-500">
          {fileCount.toLocaleString()}{" "}
          {fileCount === 1 ? "file" : "files"}
          {!recursive && dirCount > 0 && (
            <>
              {" · "}
              {dirCount.toLocaleString()}{" "}
              {dirCount === 1 ? "folder" : "folders"}
            </>
          )}
          {recursive && " (recursive)"}
          {hasActive && " (filtered)"}
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => onToggleRecursive(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.04] text-white focus:ring-1 focus:ring-white/30 focus:ring-offset-0"
          />
          Include subfolders
        </label>
      </div>

      <TagFilterBar
        tags={tagsInScope}
        activeTagsLower={activeTagsLower}
        onToggle={onToggleTag}
        onClear={onClearTags}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-neutral-500">
              {hasActive
                ? "No files match the active filters."
                : "This folder is empty."}
            </p>
            {hasActive && (
              <button
                type="button"
                onClick={onClearTags}
                className="inline-flex h-7 items-center rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-neutral-300 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((tile) => (
              <GalleryTile
                key={tile.path}
                node={tile}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
