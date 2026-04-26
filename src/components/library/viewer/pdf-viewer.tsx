"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveFile } from "@/lib/library/fs-adapter";
import type { LibraryNode } from "@/lib/library/types";
import { ViewerError, ViewerSkeleton } from "./viewer-skeleton";

type PdfDocumentProxy = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPageProxy>;
  destroy: () => Promise<void>;
};

type PdfPageProxy = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

export function PdfViewer({ node }: { node: LibraryNode }) {
  const [doc, setDoc] = useState<PdfDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadedDoc: PdfDocumentProxy | null = null;
    setError(null);
    setDoc(null);
    setPage(1);

    (async () => {
      try {
        const file = await resolveFile(node.entry);
        if (cancelled || !file) return;

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs.worker.min.mjs";

        const buf = await file.arrayBuffer();
        if (cancelled) return;

        const task = pdfjs.getDocument({ data: buf });
        const d = (await task.promise) as unknown as PdfDocumentProxy;
        if (cancelled) {
          await d.destroy();
          return;
        }
        loadedDoc = d;
        setDoc(d);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load PDF",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (loadedDoc) loadedDoc.destroy().catch(() => undefined);
    };
  }, [node]);

  useEffect(() => {
    if (!doc || containerWidth === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const available = containerWidth - 48;
        const fitScale = Math.min(
          2,
          Math.max(0.5, available / baseViewport.width),
        );
        const viewport = pdfPage.getViewport({ scale: fitScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render page",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, page, containerWidth]);

  if (error) return <ViewerError message={error} />;
  if (!doc) return <ViewerSkeleton label="Loading PDF…" />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <span className="truncate text-xs text-neutral-500">{node.name}</span>
        <div className="flex items-center gap-1">
          <PagerBtn
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            label="Previous page"
          >
            <ChevronLeft size={14} strokeWidth={1.8} />
          </PagerBtn>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <input
              type="number"
              value={page}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isFinite(v)) return;
                setPage(Math.max(1, Math.min(doc.numPages, v)));
              }}
              className="h-6 w-10 rounded bg-white/[0.04] text-center text-neutral-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-white/20"
              min={1}
              max={doc.numPages}
            />
            <span className="text-neutral-500">/ {doc.numPages}</span>
          </div>
          <PagerBtn
            onClick={() => setPage((p) => Math.min(doc.numPages, p + 1))}
            disabled={page >= doc.numPages}
            label="Next page"
          >
            <ChevronRight size={14} strokeWidth={1.8} />
          </PagerBtn>
        </div>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="rounded bg-white shadow-lg shadow-black/40"
          />
        </div>
      </div>
    </div>
  );
}

function PagerBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100 disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
