"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LibraryNode } from "@/lib/library/types";
import type { FileTypeFilter, SortMode, ViewMode, ViewScope } from "@/lib/library/db";
import { ChevronDown, ImageIcon, FileText, File } from "lucide-react";
import { GalleryTile } from "./gallery-tile";
import { TagFilterBar } from "./tag-filter-bar";

const BATCH_SIZE = 60;
const MAX_VISIBLE = 500;

type Props = {
  node: LibraryNode;
  onSelect: (node: LibraryNode) => void;
  activeTagsLower: ReadonlySet<string>;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  viewScope: ViewScope;
  onViewScopeChange: (v: ViewScope) => void;
  sortMode: SortMode;
  onSortModeChange: (v: SortMode) => void;
  favoritePaths: ReadonlySet<string>;
  onToggleFavorite: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, node: LibraryNode) => void;
};

type ToggleOption<T extends string> = { value: T; label: string };

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ToggleOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex h-7 items-stretch rounded-md border border-white/[0.08] bg-white/[0.02]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 text-[11px] font-medium transition-colors duration-100 first:rounded-l-[5px] last:rounded-r-[5px] ${
            value === opt.value
              ? "bg-white/[0.10] text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const VIEW_MODE_OPTIONS: ToggleOption<ViewMode>[] = [
  { value: "gallery", label: "Gallery" },
  { value: "explorer", label: "Explorer" },
];

const VIEW_SCOPE_OPTIONS: ToggleOption<ViewScope>[] = [
  { value: "directory", label: "This Folder" },
  { value: "recursive", label: "All Files" },
];

export function Gallery({
  node,
  onSelect,
  activeTagsLower,
  onToggleTag,
  onClearTags,
  viewMode,
  onViewModeChange,
  viewScope,
  onViewScopeChange,
  sortMode,
  onSortModeChange,
  favoritePaths,
  onToggleFavorite,
  onContextMenu,
}: Props) {
  const isRecursive = viewScope === "recursive";
  const isExplorer = viewMode === "explorer";

  const ALL_TYPE_FILTERS: FileTypeFilter[] = ["images", "documents", "text", "other"];
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<FileTypeFilter>>(
    () => new Set(ALL_TYPE_FILTERS),
  );

  const toggleTypeFilter = (filter: FileTypeFilter) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        if (next.size === 1) return prev;
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const allTypesActive = activeTypeFilters.size === ALL_TYPE_FILTERS.length;

  const items = useMemo(() => {
    const out: LibraryNode[] = [];
    const walk = (n: LibraryNode, depth: number) => {
      if (!n.children) return;
      for (const child of n.children) {
        if (child.kind === "directory") {
          if (isExplorer) out.push(child);
          if (isRecursive) walk(child, depth + 1);
        } else {
          out.push(child);
        }
      }
    };
    walk(node, 0);
    return out;
  }, [node, isRecursive, isExplorer]);

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
    let result = items;

    if (!allTypesActive) {
      result = result.filter((item) => {
        if (item.kind === "directory") return true;
        const fk = item.fileKind;
        if (activeTypeFilters.has("images") && fk === "image") return true;
        if (activeTypeFilters.has("documents") && (fk === "pdf" || fk === "doc")) return true;
        if (activeTypeFilters.has("text") && (fk === "text" || fk === "markdown")) return true;
        if (activeTypeFilters.has("other") && fk === "other") return true;
        return false;
      });
    }

    if (activeTagsLower.size > 0) {
      result = result.filter((item) => {
        const itemLower = new Set(item.tags.map((t) => t.toLowerCase()));
        for (const active of activeTagsLower) {
          if (!itemLower.has(active)) return false;
        }
        return true;
      });
    }
    const sorted = [...result];
    switch (sortMode) {
      case "name-asc":
        sorted.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" }),
        );
        break;
      case "date":
        sorted.sort(
          (a, b) => (b.entry.lastModified ?? 0) - (a.entry.lastModified ?? 0),
        );
        break;
      case "dimensions":
        sorted.sort(
          (a, b) => (b.entry.size ?? 0) - (a.entry.size ?? 0),
        );
        break;
      case "color":
        break;
    }
    return sorted;
  }, [items, activeTagsLower, sortMode, activeTypeFilters, allTypesActive]);

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [node, activeTagsLower, viewMode, viewScope, sortMode, activeTypeFilters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, MAX_VISIBLE, filtered.length),
          );
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);
  const capped = filtered.length > MAX_VISIBLE && visibleCount >= MAX_VISIBLE;
  const hasMore = visibleCount < filtered.length && !capped;

  const fileCount = filtered.filter((t) => t.kind === "file").length;
  const dirCount = filtered.filter((t) => t.kind === "directory").length;
  const hasActive = activeTagsLower.size > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4">
        <div className="text-xs text-neutral-500">
          {fileCount.toLocaleString()}{" "}
          {fileCount === 1 ? "file" : "files"}
          {isExplorer && dirCount > 0 && (
            <>
              {" · "}
              {dirCount.toLocaleString()}{" "}
              {dirCount === 1 ? "folder" : "folders"}
            </>
          )}
          {hasActive && " (filtered)"}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as SortMode)}
              className="h-7 appearance-none rounded-md border border-white/[0.08] bg-white/[0.02] pl-2.5 pr-7 text-[11px] font-medium text-neutral-300 transition-colors duration-100 hover:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="date">Date</option>
              <option value="dimensions">Size</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
          </div>
          <SegmentedToggle
            options={VIEW_MODE_OPTIONS}
            value={viewMode}
            onChange={onViewModeChange}
          />
          <SegmentedToggle
            options={VIEW_SCOPE_OPTIONS}
            value={viewScope}
            onChange={onViewScopeChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-1.5">
        {(
          [
            { key: "images", label: "Images", icon: ImageIcon },
            { key: "documents", label: "Docs", icon: File },
            { key: "text", label: "Text", icon: FileText },
            { key: "other", label: "Other", icon: File },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleTypeFilter(key)}
            className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-colors duration-100 ${
              activeTypeFilters.has(key)
                ? "bg-white/[0.10] text-neutral-100"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
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
          <>
            <div className="flex flex-wrap gap-2">
              {visible.map((tile) => (
                <GalleryTile
                  key={tile.path}
                  node={tile}
                  onSelect={onSelect}
                  isFavorite={favoritePaths.has(tile.path)}
                  onToggleFavorite={onToggleFavorite}
                  onContextMenu={onContextMenu}
                />
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
            {capped && (
              <p className="mt-4 text-center text-xs text-neutral-500">
                Showing {MAX_VISIBLE.toLocaleString()} of{" "}
                {filtered.length.toLocaleString()} — use search or tags to
                narrow down
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
