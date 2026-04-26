"use client";

type Props = {
  tag: string;
  active?: boolean;
  onClick?: (tag: string, event: React.MouseEvent) => void;
  size?: "sm" | "md";
};

export function TagChip({ tag, active = false, onClick, size = "md" }: Props) {
  const sizing =
    size === "sm"
      ? "h-6 px-2.5 text-[11px]"
      : "h-7 px-3 text-xs";

  return (
    <button
      type="button"
      onClick={onClick ? (e) => onClick(tag, e) : undefined}
      className={[
        "inline-flex shrink-0 items-center rounded-full border font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        sizing,
        active
          ? "border-white/25 bg-white/[0.12] text-neutral-50"
          : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/[0.08] hover:text-neutral-100",
      ].join(" ")}
      aria-pressed={active}
    >
      {tag}
    </button>
  );
}
