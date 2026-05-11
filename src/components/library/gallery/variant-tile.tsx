"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { resolveFile } from "@/lib/library/fs-adapter";
import {
  generateThumbnail,
  getThumbnailKey,
  loadThumbnail,
  saveThumbnail,
} from "@/lib/library/thumbnails";
import type { VariantGroup } from "@/lib/library/variant-grouping";
import { extractVariantLabel } from "@/lib/library/variant-grouping";

type Props = {
  group: VariantGroup;
  onSelect: (group: VariantGroup) => void;
};

export function VariantTile({ group, onSelect }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const rep = group.representative;

  useEffect(() => {
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
          const file = await resolveFile(rep.entry);
          if (cancelled || !file) return;

          const key = getThumbnailKey(
            rep.path,
            file.size,
            file.lastModified,
          );

          const cached = await loadThumbnail(key);
          if (cancelled) return;
          if (cached) {
            setBlobUrl(cached.blob);
            return;
          }

          const result = await generateThumbnail(file);
          if (cancelled) return;
          if (result) {
            setBlobUrl(result.blob);
            void saveThumbnail(key, result);
          } else {
            setBlobUrl(file);
          }
        } catch {
          /* swallow */
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
  }, [rep]);

  const handleClick = useCallback(() => {
    onSelect(group);
  }, [group, onSelect]);

  const variantLabel = extractVariantLabel(rep.name);
  const displayName = group.baseName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      title={`${displayName} (${group.variants.length} variants)`}
      className="group relative flex h-[220px] shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02] transition-all duration-[180ms] hover:border-white/15 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={displayName}
          className="h-full w-auto select-none object-cover"
          draggable={false}
          loading="lazy"
        />
      ) : (
        <div className="h-full w-[160px] animate-pulse bg-white/[0.03]" />
      )}

      {/* Stacked card effect */}
      <div className="pointer-events-none absolute inset-0 rounded-md shadow-[2px_2px_0_0_rgba(255,255,255,0.04),-2px_-2px_0_0_rgba(255,255,255,0.02)]" />

      {/* Variant count badge */}
      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
        <Layers size={10} strokeWidth={2} />
        {group.variants.length}
      </span>

      {/* Name overlay */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-6 text-left text-xs text-neutral-100 opacity-0 transition duration-[180ms] group-hover:translate-y-0 group-hover:opacity-100">
        <span className="block truncate font-medium">{displayName}</span>
        <span className="block truncate text-[10px] text-neutral-400">
          {variantLabel} + {group.variants.length - 1} more
        </span>
      </span>
    </button>
  );
}
