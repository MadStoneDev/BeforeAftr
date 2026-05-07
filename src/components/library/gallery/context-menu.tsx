"use client";

import { useEffect, useRef } from "react";
import { Heart, GitCompareArrows, Plus } from "lucide-react";
import type { CollectionRecord } from "@/lib/library/collections";

type Props = {
  x: number;
  y: number;
  isFavorite: boolean;
  collections: CollectionRecord[];
  onClose: () => void;
  onToggleFavorite: () => void;
  onAddToCollection: (collectionId: string) => void;
  onNewCollection: () => void;
  onCompare: () => void;
};

export function ContextMenu({
  x,
  y,
  isFavorite,
  collections,
  onClose,
  onToggleFavorite,
  onAddToCollection,
  onNewCollection,
  onCompare,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#1a1b1e] py-1 shadow-2xl shadow-black/60"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <MenuItem
        icon={<Heart size={14} fill={isFavorite ? "currentColor" : "none"} />}
        label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={() => {
          onToggleFavorite();
          onClose();
        }}
      />
      <MenuItem
        icon={<GitCompareArrows size={14} />}
        label="Compare with…"
        onClick={() => {
          onCompare();
          onClose();
        }}
      />
      <div className="my-1 border-t border-white/[0.06]" />
      {collections.map((c) => (
        <MenuItem
          key={c.id}
          label={c.name}
          indent
          onClick={() => {
            onAddToCollection(c.id);
            onClose();
          }}
        />
      ))}
      <MenuItem
        icon={<Plus size={14} />}
        label="New collection…"
        onClick={() => {
          onNewCollection();
          onClose();
        }}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  indent,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  indent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition-colors duration-75 hover:bg-white/[0.06] hover:text-neutral-100"
    >
      {icon ? (
        <span className="flex w-4 shrink-0 items-center justify-center text-neutral-500">
          {icon}
        </span>
      ) : indent ? (
        <span className="w-4 shrink-0" />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
