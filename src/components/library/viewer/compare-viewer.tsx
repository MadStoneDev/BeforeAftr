"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryNode } from "@/lib/library/types";
import { useObjectUrl } from "@/lib/library/use-file";
import { ViewerSkeleton } from "./viewer-skeleton";

type Props = {
  left: LibraryNode;
  right: LibraryNode;
  onClose: () => void;
};

export function CompareViewer({ left, right, onClose }: Props) {
  const leftObj = useObjectUrl(left);
  const rightObj = useObjectUrl(right);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  if (leftObj.loading || rightObj.loading) return <ViewerSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="truncate max-w-[200px]" title={left.name}>
            {left.name}
          </span>
          <span className="text-neutral-600">vs</span>
          <span className="truncate max-w-[200px]" title={right.name}>
            {right.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 items-center rounded-md px-2.5 text-xs text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
        >
          Close
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 select-none overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        {rightObj.url && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rightObj.url}
              alt={right.name}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
        )}
        {leftObj.url && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${position}%` }}
          >
            <div className="absolute inset-0" style={{ width: containerRef.current?.offsetWidth ?? "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leftObj.url}
                alt={left.name}
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>
          </div>
        )}
        <div
          className="absolute top-0 bottom-0 z-10 cursor-col-resize touch-none"
          style={{ left: `${position}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
        >
          <div className="absolute left-0 h-full w-0.5 bg-white" />
          <div className="absolute left-0 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
            <span className="text-[10px] text-black">⇔</span>
          </div>
        </div>
      </div>
    </div>
  );
}
