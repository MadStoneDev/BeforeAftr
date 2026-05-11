"use client";

import type { LibraryNode } from "@/lib/library/types";

type Props = {
  node: LibraryNode | null;
};

const COLOR_MAP: Record<string, string> = {
  "Blue/Water": "bg-blue-500",
  "Green/Forest": "bg-green-600",
  "Brown/Earth": "bg-amber-700",
  "Gray/Stone": "bg-neutral-500",
  "Red/Fire": "bg-red-500",
  "White/Snow": "bg-neutral-200",
  "Black/Dark": "bg-neutral-900",
  "Gold/Sand": "bg-amber-400",
  "Purple/Magic": "bg-purple-500",
};

export function ColorPalettePanel({ node }: Props) {
  if (!node || node.kind !== "file") {
    return (
      <p className="text-[10px] text-neutral-600">
        Select a file to see its color palette.
      </p>
    );
  }

  const colorTags = node.tags.filter((t) => t in COLOR_MAP);

  if (colorTags.length === 0) {
    return (
      <p className="text-[10px] text-neutral-600">
        No color data available. Colors are detected during thumbnail generation.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {colorTags.map((tag) => (
          <div key={tag} className="flex flex-col items-center gap-1">
            <div
              className={`h-8 w-8 rounded-md ${COLOR_MAP[tag]} ring-1 ring-white/10`}
            />
            <span className="text-[9px] text-neutral-500">
              {tag.split("/")[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
