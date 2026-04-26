"use client";

import { X } from "lucide-react";
import { TagChip } from "../tag-chip";

type Props = {
  tags: string[];
  activeTagsLower: ReadonlySet<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
};

export function TagFilterBar({
  tags,
  activeTagsLower,
  onToggle,
  onClear,
}: Props) {
  const hasActive = activeTagsLower.size > 0;
  if (tags.length === 0 && !hasActive) return null;

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.06] px-4">
      <div className="relative min-w-0 flex-1">
        <div
          className="flex gap-1.5 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {tags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              active={activeTagsLower.has(tag.toLowerCase())}
              onClick={() => onToggle(tag)}
            />
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0E0F11] to-transparent"
        />
      </div>
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 text-xs text-neutral-300 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
        >
          <X size={12} strokeWidth={1.8} />
          Clear
        </button>
      )}
    </div>
  );
}
