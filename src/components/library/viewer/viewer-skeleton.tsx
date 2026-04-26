"use client";

import { AlertCircle, Loader2 } from "lucide-react";

export function ViewerSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-neutral-500">
      <Loader2 size={16} className="animate-spin" strokeWidth={1.8} />
      {label}
    </div>
  );
}

export function ViewerError({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <AlertCircle
          size={32}
          strokeWidth={1.5}
          className="text-[#E86F6F]"
        />
        <p className="text-sm text-neutral-300">{message}</p>
      </div>
    </div>
  );
}
