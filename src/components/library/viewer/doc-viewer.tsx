"use client";

import { useEffect, useState } from "react";
import type { LibraryNode } from "@/lib/library/types";
import { useFileBuffer } from "@/lib/library/use-file";
import { RichContent } from "./rich-content";
import { ViewerError, ViewerSkeleton } from "./viewer-skeleton";
import { UnsupportedViewer } from "./unsupported-viewer";

export function DocViewer({ node }: { node: LibraryNode }) {
  const ext = node.name.split(".").pop()?.toLowerCase();
  const supported = ext === "docx";

  const { buffer, error, loading } = useFileBuffer(supported ? node : null);
  const [html, setHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!buffer) {
      setHtml(null);
      return;
    }
    let cancelled = false;
    setRenderError(null);

    (async () => {
      try {
        const [mammothMod, purifyMod] = await Promise.all([
          import("mammoth"),
          import("dompurify"),
        ]);
        const result = await mammothMod.default.convertToHtml({
          arrayBuffer: buffer,
        });
        const clean = purifyMod.default.sanitize(result.value);
        if (!cancelled) setHtml(clean);
      } catch (err) {
        if (!cancelled) {
          setRenderError(
            err instanceof Error ? err.message : "Failed to parse document",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buffer]);

  if (!supported) return <UnsupportedViewer node={node} />;
  if (error) return <ViewerError message={error} />;
  if (renderError) return <ViewerError message={renderError} />;
  if (loading || !buffer || html === null) {
    return <ViewerSkeleton label="Rendering document…" />;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl p-8">
        <RichContent html={html} />
      </div>
    </div>
  );
}
