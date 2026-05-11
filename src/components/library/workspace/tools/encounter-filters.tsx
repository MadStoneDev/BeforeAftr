"use client";

import type { LucideProps } from "lucide-react";
import {
  Building2,
  Compass,
  Mountain,
  Sparkles,
  Swords,
  Trees,
} from "lucide-react";
import type { QuickFilterPreset } from "@/lib/library/workspaces";

type Props = {
  presets: QuickFilterPreset[];
  activeTagsLower: ReadonlySet<string>;
  onTogglePreset: (tags: string[]) => void;
};

const PRESET_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  trees: Trees,
  mountain: Mountain,
  "building-2": Building2,
  compass: Compass,
  sparkles: Sparkles,
  swords: Swords,
};

export function EncounterFilters({
  presets,
  activeTagsLower,
  onTogglePreset,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {presets.map((preset) => {
        const Icon = PRESET_ICONS[preset.icon];
        const isActive = preset.tags.some((t) => activeTagsLower.has(t));
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onTogglePreset(preset.tags)}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors duration-100 ${
              isActive
                ? "bg-white/[0.12] text-neutral-100 ring-1 ring-white/20"
                : "bg-white/[0.03] text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300"
            }`}
          >
            {Icon && <Icon size={18} strokeWidth={1.5} />}
            <span className="text-[10px] font-medium leading-tight">
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
