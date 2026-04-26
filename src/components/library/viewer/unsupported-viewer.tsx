"use client";

import { FileQuestion } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";

export function UnsupportedViewer({ node }: { node: LibraryNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <FileQuestion
        size={48}
        strokeWidth={1.25}
        className="text-neutral-700"
      />
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
          {node.name}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">{node.path}</p>
      </div>
      <p className="max-w-sm text-sm text-neutral-500">
        Preview isn&apos;t available for this file type yet.
      </p>
    </div>
  );
}
