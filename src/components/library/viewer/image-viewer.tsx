"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
import { useObjectUrl } from "@/lib/library/use-file";
import { ViewerError, ViewerSkeleton } from "./viewer-skeleton";

type Props = { node: LibraryNode };

export function ImageViewer({ node }: Props) {
  const { url, error, loading } = useObjectUrl(node);
  const [actualSize, setActualSize] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const ae = document.activeElement;
      if (
        ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          (ae as HTMLElement).isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setActualSize((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (error) return <ViewerError message={error} />;
  if (loading || !url) return <ViewerSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <span className="truncate text-xs text-neutral-500">{node.name}</span>
        <button
          type="button"
          onClick={() => setActualSize((v) => !v)}
          aria-label={actualSize ? "Fit to pane" : "Actual size"}
          title={`Press F to toggle (${actualSize ? "currently actual size" : "currently fit"})`}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
        >
          {actualSize ? (
            <>
              <Minimize2 size={14} strokeWidth={1.8} />
              Fit
            </>
          ) : (
            <>
              <Maximize2 size={14} strokeWidth={1.8} />
              Actual size
            </>
          )}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className={
            actualSize
              ? "min-h-full min-w-max p-6"
              : "flex h-full w-full items-center justify-center p-6"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={node.name}
            draggable={false}
            className={
              actualSize
                ? "select-none"
                : "max-h-full max-w-full select-none object-contain"
            }
          />
        </div>
      </div>
    </div>
  );
}
