"use client";

import { Compass } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
import type { SortMode, ViewMode, ViewScope } from "@/lib/library/db";
import type { VariantGroup } from "@/lib/library/variant-grouping";
import { Gallery } from "../gallery/gallery";
import { DocViewer } from "./doc-viewer";
import { ImageViewer } from "./image-viewer";
import { MarkdownViewer } from "./markdown-viewer";
import { PdfViewer } from "./pdf-viewer";
import { TextViewer } from "./text-viewer";
import { UnsupportedViewer } from "./unsupported-viewer";

type Props = {
  node: LibraryNode | null;
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
  searchQuery?: string;
  stackVariants?: boolean;
  onStackVariantsChange?: (v: boolean) => void;
  onSelectVariantGroup?: (group: VariantGroup) => void;
  activeVariantGroup?: VariantGroup | null;
  scrollPositions?: React.RefObject<Map<string, number>>;
};

export function Viewer({
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
  searchQuery,
  stackVariants,
  onStackVariantsChange,
  onSelectVariantGroup,
  activeVariantGroup,
  scrollPositions,
}: Props) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <Compass
          size={48}
          strokeWidth={1.25}
          className="text-neutral-700"
        />
        <p className="text-sm text-neutral-500">
          Select a file or folder from the tree
        </p>
      </div>
    );
  }

  if (node.kind === "directory") {
    return (
      <Gallery
        node={node}
        onSelect={onSelect}
        activeTagsLower={activeTagsLower}
        onToggleTag={onToggleTag}
        onClearTags={onClearTags}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        viewScope={viewScope}
        onViewScopeChange={onViewScopeChange}
        sortMode={sortMode}
        onSortModeChange={onSortModeChange}
        favoritePaths={favoritePaths}
        onToggleFavorite={onToggleFavorite}
        onContextMenu={onContextMenu}
        searchQuery={searchQuery}
        stackVariants={stackVariants}
        onStackVariantsChange={onStackVariantsChange}
        onSelectVariantGroup={onSelectVariantGroup}
        scrollPositions={scrollPositions}
      />
    );
  }

  switch (node.fileKind) {
    case "image":
      return (
        <ImageViewer
          node={node}
          variantGroup={activeVariantGroup ?? undefined}
          onSelectVariant={onSelect}
        />
      );
    case "pdf":
      return <PdfViewer node={node} />;
    case "markdown":
      return <MarkdownViewer node={node} />;
    case "doc":
      return <DocViewer node={node} />;
    case "text":
      return <TextViewer node={node} />;
    default:
      return <UnsupportedViewer node={node} />;
  }
}
