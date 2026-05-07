"use client";

import { useEffect, useState } from "react";
import type { LibraryNode } from "@/lib/library/types";
import { useFileText } from "@/lib/library/use-file";
import { RichContent } from "./rich-content";
import { ViewerError, ViewerSkeleton } from "./viewer-skeleton";

const MARKDOWN_PREVIEW_MAX_BYTES = 2 * 1024 * 1024;

export function MarkdownViewer({ node }: { node: LibraryNode }) {
  const { text, error, loading } = useFileText(node, {
    maxBytes: MARKDOWN_PREVIEW_MAX_BYTES,
  });
  const [html, setHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (text === null) {
      setHtml(null);
      return;
    }
    let cancelled = false;
    setRenderError(null);

    (async () => {
      try {
        const [markedMod, purifyMod] = await Promise.all([
          import("marked"),
          import("dompurify"),
        ]);
        const parsed = markedMod.marked.parse(text) as string;
        const clean = purifyMod.default.sanitize(parsed);
        if (!cancelled) setHtml(clean);
      } catch (err) {
        if (!cancelled) {
          setRenderError(
            err instanceof Error ? err.message : "Failed to render markdown",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (error) return <ViewerError message={error} />;
  if (renderError) return <ViewerError message={renderError} />;
  if (loading || text === null || html === null) {
    return <ViewerSkeleton label="Rendering markdown…" />;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl p-8">
        <RichContent html={html} />
      </div>
    </div>
  );
}
