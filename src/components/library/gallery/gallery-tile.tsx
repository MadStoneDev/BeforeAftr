"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  File as FileIcon,
  FileText,
  FileType,
  Folder,
  Heart,
} from "lucide-react";
import { resolveFile } from "@/lib/library/fs-adapter";
import {
  generateThumbnail,
  getThumbnailKey,
  loadThumbnail,
  saveThumbnail,
} from "@/lib/library/thumbnails";
import type { LibraryNode } from "@/lib/library/types";
import { PreviewPopover } from "./preview-popover";

type Props = {
  node: LibraryNode;
  onSelect: (node: LibraryNode) => void;
  dimensions?: { width: number; height: number } | null;
  isFavorite?: boolean;
  onToggleFavorite?: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, node: LibraryNode) => void;
};

const HOVER_DELAY = 300;

export function GalleryTile({
  node,
  onSelect,
  dimensions,
  isFavorite,
  onToggleFavorite,
  onContextMenu,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isImage = node.kind === "file" && node.fileKind === "image";
  const isPdf = node.kind === "file" && node.fileKind === "pdf";

  useEffect(() => {
    if (!isImage) return;
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let created: string | null = null;

    const setBlobUrl = (blob: Blob) => {
      if (cancelled) return;
      created = URL.createObjectURL(blob);
      setUrl(created);
    };

    const obs = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        try {
          const file = await resolveFile(node.entry);
          if (cancelled || !file) return;

          const key = getThumbnailKey(
            node.path,
            file.size,
            file.lastModified,
          );

          const cached = await loadThumbnail(key);
          if (cancelled) return;
          if (cached) {
            setBlobUrl(cached.blob);
            return;
          }

          setBlobUrl(file);

          const result = await generateThumbnail(file);
          if (cancelled) return;
          if (result) void saveThumbnail(key, result);
        } catch {
          /* swallow — tile stays as placeholder */
        }
      },
      { rootMargin: "300px" },
    );

    obs.observe(el);

    return () => {
      cancelled = true;
      obs.disconnect();
      if (created) URL.revokeObjectURL(created);
    };
  }, [node, isImage]);

  const handleMouseEnter = useCallback(() => {
    if (!isImage) return;
    hoverTimer.current = setTimeout(() => {
      if (ref.current) {
        setAnchorRect(ref.current.getBoundingClientRect());
        setShowPreview(true);
      }
    }, HOVER_DELAY);
  }, [isImage]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowPreview(false);
  }, []);

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => onSelect(node)}
        onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, node); } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={node.name}
        className="group relative flex h-[220px] shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02] transition-all duration-[180ms] hover:border-white/15 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        {isImage ? (
          url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt={node.name}
              className="h-full w-auto select-none object-cover"
              draggable={false}
              loading="lazy"
            />
          ) : (
            <div className="h-full w-[160px] animate-pulse bg-white/[0.03]" />
          )
        ) : (
          <NonImageBody node={node} isPdf={isPdf} />
        )}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-6 text-left text-xs text-neutral-100 opacity-0 transition duration-[180ms] group-hover:translate-y-0 group-hover:opacity-100">
          <span className="block truncate">{node.name}</span>
        </span>

        {isPdf && (
          <span className="absolute left-2 bottom-2 rounded-full bg-[#F5BE63] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
            PDF
          </span>
        )}

        {isImage && dimensions && (
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-300">
            {dimensions.width}×{dimensions.height}
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(node.path);
            }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 ${
              isFavorite
                ? "bg-red-500/80 text-white opacity-100"
                : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60"
            }`}
          >
            <Heart size={12} strokeWidth={1.8} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </button>
      {showPreview && anchorRect && isImage && (
        <PreviewPopover node={node} anchorRect={anchorRect} />
      )}
    </>
  );
}

function NonImageBody({
  node,
  isPdf,
}: {
  node: LibraryNode;
  isPdf: boolean;
}) {
  const Icon =
    node.kind === "directory"
      ? Folder
      : isPdf
        ? FileType
        : node.fileKind === "markdown" ||
            node.fileKind === "text" ||
            node.fileKind === "doc"
          ? FileText
          : FileIcon;

  return (
    <div className="flex h-full w-[180px] flex-col items-center justify-center gap-3 px-4">
      <Icon
        size={36}
        strokeWidth={1.25}
        className="text-neutral-500"
      />
      <span className="w-full truncate text-center text-xs text-neutral-300">
        {node.name}
      </span>
    </div>
  );
}
