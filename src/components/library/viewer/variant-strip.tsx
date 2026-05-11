"use client";

import { useEffect, useRef, useState } from "react";
import { resolveFile } from "@/lib/library/fs-adapter";
import {
  generateThumbnail,
  getThumbnailKey,
  loadThumbnail,
  saveThumbnail,
} from "@/lib/library/thumbnails";
import type { LibraryNode } from "@/lib/library/types";
import { extractVariantLabel } from "@/lib/library/variant-grouping";

type Props = {
  variants: LibraryNode[];
  activeVariant: LibraryNode;
  onSelect: (node: LibraryNode) => void;
};

export function VariantStrip({ variants, activeVariant, onSelect }: Props) {
  return (
    <div className="flex h-[72px] shrink-0 items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-white/[0.02] px-3 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {variants.map((v) => (
        <VariantThumb
          key={v.path}
          node={v}
          active={v.path === activeVariant.path}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function VariantThumb({
  node,
  active,
  onSelect,
}: {
  node: LibraryNode;
  active: boolean;
  onSelect: (node: LibraryNode) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;

    (async () => {
      try {
        const file = await resolveFile(node.entry);
        if (cancelled || !file) return;

        const key = getThumbnailKey(node.path, file.size, file.lastModified);
        const cached = await loadThumbnail(key);
        if (cancelled) return;
        if (cached) {
          created = URL.createObjectURL(cached.blob);
          setUrl(created);
          return;
        }

        const result = await generateThumbnail(file);
        if (cancelled) return;
        if (result) {
          created = URL.createObjectURL(result.blob);
          setUrl(created);
          void saveThumbnail(key, result);
        }
      } catch {
        /* swallow */
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [node]);

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [active]);

  const label = extractVariantLabel(node.name);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(node)}
      title={node.name}
      className={`group flex h-14 shrink-0 flex-col items-center gap-0.5 rounded-md px-1 transition-all duration-100 ${
        active
          ? "bg-white/[0.08]"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <div
        className={`h-9 w-14 shrink-0 overflow-hidden rounded border transition-colors duration-100 ${
          active ? "border-white/30" : "border-white/[0.06]"
        }`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="h-full w-full select-none object-cover"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-white/[0.03]" />
        )}
      </div>
      <span
        className={`max-w-[56px] truncate text-[9px] leading-tight ${
          active ? "font-medium text-neutral-200" : "text-neutral-500"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
