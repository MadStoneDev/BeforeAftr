"use client";

import { useState } from "react";
import { Key } from "lucide-react";
import { applyCreditKey } from "@/lib/library/ai-credits";

type Props = {
  onCreditsAdded: (count: number) => void;
};

export function CreditKeyInput({ onCreditsAdded }: Props) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleRedeem = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const credits = await applyCreditKey(key.trim());
      setMessage({ text: `${credits} credits added!`, type: "success" });
      onCreditsAdded(credits);
      setKey("");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to redeem key",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3">
      <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
        <Key size={12} />
        Credit Key
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="h-7 flex-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
        />
        <button
          type="button"
          onClick={handleRedeem}
          disabled={!key.trim() || loading}
          className="h-7 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-neutral-300 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          {loading ? "…" : "Redeem"}
        </button>
      </div>
      {message && (
        <p
          className={`text-[11px] ${message.type === "success" ? "text-green-400" : "text-red-400"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
