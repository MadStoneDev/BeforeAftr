"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { consumeCredit, getCreditsState } from "@/lib/library/ai-credits";
import { resolveFile } from "@/lib/library/fs-adapter";
import type { LibraryNode } from "@/lib/library/types";
import { CreditKeyInput } from "./credit-key-input";

type Props = {
  node: LibraryNode;
  topicContext: string | null;
  onTagsGenerated: (tags: string[]) => void;
  onClose: () => void;
};

export function AnalyzePanel({
  node,
  topicContext,
  onTagsGenerated,
  onClose,
}: Props) {
  const [credits, setCredits] = useState({ freeRemaining: 0, paidRemaining: 0, total: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | null>(null);

  useEffect(() => {
    getCreditsState().then(setCredits);
  }, []);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const hasCredit = await consumeCredit();
      if (!hasCredit) {
        setError("No credits remaining. Purchase more or enter a credit key.");
        return;
      }

      const file = await resolveFile(node.entry);
      if (!file) {
        setError("Could not read file.");
        return;
      }

      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          "",
        ),
      );

      const res = await fetch("/api/library/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type || "image/jpeg",
          topicContext: topicContext ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Analysis failed (${res.status})`);
      }

      const { tags } = (await res.json()) as { tags: string[] };
      setResult(tags);
      onTagsGenerated(tags);
      const updated = await getCreditsState();
      setCredits(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [node, topicContext, onTagsGenerated]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#141517] p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-100">
          <Sparkles size={16} className="text-amber-400" />
          AI Analysis
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Close
        </button>
      </div>

      <div className="text-xs text-neutral-400">
        Credits: {credits.freeRemaining} free + {credits.paidRemaining} paid
        = <span className="font-medium text-neutral-200">{credits.total}</span> remaining
      </div>

      {result && (
        <div className="flex flex-wrap gap-1.5">
          {result.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={analyzing || credits.total === 0}
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-amber-500 px-4 text-xs font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analyzing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Analyze Image
          </>
        )}
      </button>

      <CreditKeyInput
        onCreditsAdded={(added) => {
          setCredits((prev) => ({
            ...prev,
            paidRemaining: prev.paidRemaining + added,
            total: prev.total + added,
          }));
        }}
      />
    </div>
  );
}
