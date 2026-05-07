"use client";

import type { LibraryNode } from "@/lib/library/types";
import { useFileText } from "@/lib/library/use-file";
import { ViewerError, ViewerSkeleton } from "./viewer-skeleton";

const TEXT_PREVIEW_MAX_BYTES = 5 * 1024 * 1024;

export function TextViewer({ node }: { node: LibraryNode }) {
  const { text, error, loading } = useFileText(node, {
    maxBytes: TEXT_PREVIEW_MAX_BYTES,
  });

  if (error) return <ViewerError message={error} />;
  if (loading || text === null) return <ViewerSkeleton />;

  return (
    <div className="h-full overflow-auto">
      <pre className="min-h-full whitespace-pre-wrap break-words p-8 font-mono text-sm leading-relaxed text-neutral-300">
        {text}
      </pre>
    </div>
  );
}
