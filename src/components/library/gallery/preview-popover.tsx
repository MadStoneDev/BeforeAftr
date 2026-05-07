"use client";

import { useEffect, useRef, useState } from "react";
import { resolveFile } from "@/lib/library/fs-adapter";
import type { LibraryNode } from "@/lib/library/types";

type Props = {
  node: LibraryNode;
  anchorRect: DOMRect;
};

export function PreviewPopover({ node, anchorRect }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;

    (async () => {
      try {
        const file = await resolveFile(node.entry);
        if (cancelled || !file) return;
        created = URL.createObjectURL(file);
        setUrl(created);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [node]);

  const top = anchorRect.top;
  const left = anchorRect.right + 8;
  const fitsRight = left + 400 < window.innerWidth;
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.max(8, Math.min(top, window.innerHeight - 408)),
    left: fitsRight ? left : anchorRect.left - 408,
    zIndex: 60,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="pointer-events-none overflow-hidden rounded-lg border border-white/10 bg-[#141517] shadow-2xl shadow-black/60"
    >
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={node.name}
          className="block max-h-[400px] max-w-[400px] object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex h-[200px] w-[200px] items-center justify-center">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}
