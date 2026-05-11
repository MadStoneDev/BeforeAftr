"use client";

import { useState } from "react";
import { Check, Clipboard, Download } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
import { resolveFile } from "@/lib/library/fs-adapter";

type Props = {
  node: LibraryNode | null;
};

export function VttExport({ node }: Props) {
  const [copied, setCopied] = useState(false);

  if (!node || node.kind !== "file" || node.fileKind !== "image") {
    return (
      <p className="text-[10px] text-neutral-600">
        Select an image to export for VTT.
      </p>
    );
  }

  const handleCopy = async () => {
    try {
      const file = await resolveFile(node.entry);
      if (!file) return;

      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const file = await resolveFile(node.entry);
        if (!file) return;
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = node.name;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        /* swallow */
      }
    }
  };

  const handleDownload = async () => {
    try {
      const file = await resolveFile(node.entry);
      if (!file) return;
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = node.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* swallow */
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="truncate text-[10px] text-neutral-500">{node.name}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-white/[0.06] text-[11px] font-medium text-neutral-300 transition-colors hover:bg-white/[0.10] hover:text-neutral-100"
      >
        {copied ? (
          <>
            <Check size={12} strokeWidth={2} className="text-green-400" />
            Copied to clipboard
          </>
        ) : (
          <>
            <Clipboard size={12} strokeWidth={1.8} />
            Copy for VTT
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="flex h-7 items-center justify-center gap-1.5 rounded-md text-[11px] text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-300"
      >
        <Download size={11} strokeWidth={1.8} />
        Download original
      </button>
    </div>
  );
}
