"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
import { useObjectUrl } from "@/lib/library/use-file";
import { ViewerError, ViewerSkeleton } from "./viewer-skeleton";

type Props = { node: LibraryNode };

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.15;

export function ImageViewer({ node }: Props) {
  const { url, error, loading } = useObjectUrl(node);
  const [zoom, setZoom] = useState(1);
  const [fitted, setFitted] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setZoom(1);
    setFitted(true);
    setTranslate({ x: 0, y: 0 });
  }, [node]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 + delta)));
      const scaleFactor = newZoom / zoom;

      const offsetX = cursorX - centerX - translate.x;
      const offsetY = cursorY - centerY - translate.y;

      setTranslate({
        x: translate.x - offsetX * (scaleFactor - 1),
        y: translate.y - offsetY * (scaleFactor - 1),
      });
      setZoom(newZoom);
      setFitted(false);
    },
    [zoom, translate],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setFitted(true);
    setTranslate({ x: 0, y: 0 });
  };

  const toggleFit = () => {
    if (fitted) {
      setFitted(false);
    } else {
      resetView();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFit();
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitted]);

  if (error) return <ViewerError message={error} />;
  if (loading || !url) return <ViewerSkeleton />;

  const isZoomed = zoom !== 1 || translate.x !== 0 || translate.y !== 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <span className="truncate text-xs text-neutral-500">{node.name}</span>
        <div className="flex items-center gap-1">
          {isZoomed && (
            <button
              type="button"
              onClick={resetView}
              title="Reset view (0)"
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
            >
              <RotateCcw size={13} strokeWidth={1.8} />
              {Math.round(zoom * 100)}%
            </button>
          )}
          <button
            type="button"
            onClick={toggleFit}
            title="Press F to toggle fit"
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
          >
            {fitted ? (
              <>
                <Maximize2 size={14} strokeWidth={1.8} />
                Actual size
              </>
            ) : (
              <>
                <Minimize2 size={14} strokeWidth={1.8} />
                Fit
              </>
            )}
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={`min-h-0 flex-1 overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: fitted
              ? undefined
              : `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragging ? undefined : "transform 0.1s ease-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={node.name}
            draggable={false}
            className={
              fitted
                ? "max-h-full max-w-full select-none object-contain"
                : "select-none"
            }
          />
        </div>
      </div>
    </div>
  );
}
