"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
import type { WorkspaceDefinition } from "@/lib/library/workspaces";
import { ToolSection } from "./tool-section";
import { EncounterFilters } from "./tools/encounter-filters";
import { SessionPrep } from "./tools/session-prep";
import { MapNotesPanel } from "./tools/map-notes-panel";
import { VttExport } from "./tools/vtt-export";
import { StarRating } from "./tools/star-rating";
import { ColorPalettePanel } from "./tools/color-palette-panel";

type Props = {
  workspace: WorkspaceDefinition;
  open: boolean;
  onToggle: () => void;
  selectedNode: LibraryNode | null;
  activeTagsLower: ReadonlySet<string>;
  onTogglePresetTags: (tags: string[]) => void;
};

export function WorkspaceSidebar({
  workspace,
  open,
  onToggle,
  selectedNode,
  activeTagsLower,
  onTogglePresetTags,
}: Props) {
  const isImage =
    selectedNode?.kind === "file" && selectedNode.fileKind === "image";
  const filePath = selectedNode?.kind === "file" ? selectedNode.path : null;
  const fileName = selectedNode?.kind === "file" ? selectedNode.name : null;

  const tools = workspace.tools;

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-l border-white/[0.06] bg-[#141517] transition-[width] duration-200"
      style={{ width: open ? 260 : 36 }}
    >
      {!open ? (
        <div className="flex h-full flex-col items-center pt-2">
          <button
            type="button"
            onClick={onToggle}
            title="Open workspace tools"
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <ChevronsLeft size={14} strokeWidth={1.8} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
              {workspace.name}
            </span>
            <button
              type="button"
              onClick={onToggle}
              title="Close workspace panel"
              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
            >
              <ChevronsRight size={12} strokeWidth={1.8} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tools.includes("encounter-filters") &&
              workspace.quickFilterPresets.length > 0 && (
                <ToolSection title="Quick Filters" defaultOpen>
                  <EncounterFilters
                    presets={workspace.quickFilterPresets}
                    activeTagsLower={activeTagsLower}
                    onTogglePreset={onTogglePresetTags}
                  />
                </ToolSection>
              )}

            {tools.includes("session-prep") && (
              <ToolSection title="Session Prep">
                <SessionPrep
                  selectedPath={filePath}
                  selectedName={fileName}
                  isImage={isImage}
                />
              </ToolSection>
            )}

            {tools.includes("star-rating") && (
              <ToolSection title="Rating" defaultOpen>
                <StarRating path={filePath} />
              </ToolSection>
            )}

            {tools.includes("map-notes") && (
              <ToolSection title="Map Notes">
                <MapNotesPanel path={filePath} name={fileName} />
              </ToolSection>
            )}

            {tools.includes("color-palette") && (
              <ToolSection title="Colors">
                <ColorPalettePanel node={selectedNode} />
              </ToolSection>
            )}

            {tools.includes("vtt-export") && (
              <ToolSection title="VTT Export">
                <VttExport node={selectedNode} />
              </ToolSection>
            )}

            {tools.includes("grid-info") && isImage && (
              <ToolSection title="Grid Info">
                <div className="flex flex-col gap-1 text-[10px] text-neutral-500">
                  {selectedNode?.entry.size && (
                    <p>
                      File size:{" "}
                      {(selectedNode.entry.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                  <p className="text-neutral-600 italic">
                    Grid detection coming soon — will auto-detect grid spacing
                    and report square count.
                  </p>
                </div>
              </ToolSection>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
