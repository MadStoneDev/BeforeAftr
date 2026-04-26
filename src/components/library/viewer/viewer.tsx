"use client";

import { Compass } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
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
  galleryRecursive: boolean;
  onToggleGalleryRecursive: (v: boolean) => void;
};

export function Viewer({
  node,
  onSelect,
  activeTagsLower,
  onToggleTag,
  onClearTags,
  galleryRecursive,
  onToggleGalleryRecursive,
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
        recursive={galleryRecursive}
        onToggleRecursive={onToggleGalleryRecursive}
      />
    );
  }

  switch (node.fileKind) {
    case "image":
      return <ImageViewer node={node} />;
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
