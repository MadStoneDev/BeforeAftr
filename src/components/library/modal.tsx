"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Action = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary" | "destructive";
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
};

const EASE = "cubic-bezier(0.16,1,0.3,1)";

export function Modal({
  open,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
}: Props) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = setTimeout(() => primaryRef.current?.focus(), 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const primaryClass =
    primaryAction?.tone === "destructive"
      ? "bg-[#E86F6F] text-white hover:bg-[#d95e5e] focus:ring-[#E86F6F]/40"
      : "bg-white text-black hover:bg-neutral-200 focus:ring-white/30";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        aria-hidden
        className={[
          "absolute inset-0 bg-black/60 backdrop-blur-sm",
          "transition-opacity",
          entered ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
        }}
      />
      <div
        className={[
          "relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#141517] shadow-2xl shadow-black/60",
          entered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-1",
        ].join(" ")}
        style={{
          transition: `opacity 200ms ${EASE}, transform 200ms ${EASE}`,
        }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3
            id="modal-title"
            className="text-sm font-semibold tracking-tight text-neutral-100"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-5 py-4 text-sm leading-relaxed text-neutral-300">
          {children}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-white/[0.01] px-5 py-3">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex h-8 items-center rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-xs font-medium text-neutral-300 transition-colors duration-[120ms] hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                ref={primaryRef}
                type="button"
                onClick={primaryAction.onClick}
                className={[
                  "inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition-colors duration-[120ms] focus:outline-none focus:ring-2",
                  primaryClass,
                ].join(" ")}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
