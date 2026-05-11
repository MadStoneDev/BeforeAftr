"use client";

import type { LucideProps } from "lucide-react";
import {
  Camera,
  Palette,
  Swords,
} from "lucide-react";
import {
  BUILTIN_WORKSPACES,
  type WorkspaceDefinition,
} from "@/lib/library/workspaces";

type Props = {
  activeId: string | null;
  onChange: (id: string | null) => void;
};

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  swords: Swords,
  camera: Camera,
  palette: Palette,
};

function WorkspaceIcon({
  workspace,
  size = 13,
}: {
  workspace: WorkspaceDefinition;
  size?: number;
}) {
  const Icon = ICONS[workspace.icon];
  return Icon ? <Icon size={size} strokeWidth={1.8} /> : null;
}

export function WorkspaceSelector({ activeId, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      {BUILTIN_WORKSPACES.map((ws) => {
        const isActive = activeId === ws.id;
        return (
          <button
            key={ws.id}
            type="button"
            onClick={() => onChange(isActive ? null : ws.id)}
            title={ws.name}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors duration-100 ${
              isActive
                ? "bg-white/[0.10] text-neutral-100"
                : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300"
            }`}
          >
            <WorkspaceIcon workspace={ws} />
            <span className="hidden lg:inline">{ws.name}</span>
          </button>
        );
      })}
    </div>
  );
}
