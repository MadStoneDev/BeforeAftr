"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
  Library,
} from "lucide-react";
import type { LibraryNode } from "@/lib/library/types";
import { Tree } from "./tree";

export type SidebarState = "expanded" | "collapsed" | "hidden";

type Props = {
  state: SidebarState;
  onToggle: () => void;
  tree: LibraryNode;
  selectedPath: string | null;
  expandedPaths: ReadonlySet<string>;
  onToggleExpand: (path: string) => void;
  onSelect: (node: LibraryNode) => void;
  onChangeFolder: () => void;
};

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const PEEK_IN_DELAY = 150;
const PEEK_OUT_DELAY = 300;

export function Sidebar({
  state,
  onToggle,
  tree,
  selectedPath,
  expandedPaths,
  onToggleExpand,
  onSelect,
  onChangeFolder,
}: Props) {
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPeekTimer = () => {
    if (peekTimer.current) {
      clearTimeout(peekTimer.current);
      peekTimer.current = null;
    }
  };

  const scheduleEnter = () => {
    if (state !== "collapsed") return;
    clearPeekTimer();
    peekTimer.current = setTimeout(() => setPeek(true), PEEK_IN_DELAY);
  };

  const scheduleLeave = () => {
    if (state !== "collapsed") return;
    clearPeekTimer();
    peekTimer.current = setTimeout(() => setPeek(false), PEEK_OUT_DELAY);
  };

  useEffect(() => {
    if (state === "expanded") {
      clearPeekTimer();
      setPeek(false);
    }
    return () => clearPeekTimer();
  }, [state]);

  const panelVisible = state === "expanded" || peek;
  const isPeek = state === "collapsed" && peek;

  const width =
    state === "expanded" ? 280 : state === "collapsed" ? 48 : 0;

  return (
    <aside
      onMouseEnter={scheduleEnter}
      onMouseLeave={scheduleLeave}
      className="relative h-full shrink-0 overflow-hidden"
      style={{
        width,
        transition: `width 200ms ${EASE}`,
      }}
    >
      {/* Rail layer */}
      <div
        className={[
          "absolute inset-y-0 left-0 z-10 flex w-12 flex-col items-center border-r border-white/[0.06] bg-white/[0.02] py-3",
          state === "collapsed" ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        style={{ transition: `opacity 200ms ${EASE}` }}
        aria-hidden={state !== "collapsed"}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
        >
          <ChevronsRight size={16} strokeWidth={1.8} />
        </button>

        <div className="mt-2 flex h-9 w-9 items-center justify-center text-neutral-500">
          <Library size={16} strokeWidth={1.6} />
        </div>
      </div>

      {/* Panel layer */}
      <div
        className={[
          "absolute inset-y-0 left-0 z-20 flex w-[280px] flex-col border-r border-white/[0.06] bg-[#141517]",
          panelVisible
            ? "translate-x-0 opacity-100"
            : "-translate-x-2 opacity-0 pointer-events-none",
          isPeek ? "shadow-2xl shadow-black/40" : "",
        ].join(" ")}
        style={{
          transition: `transform 200ms ${EASE}, opacity 200ms ${EASE}`,
        }}
        aria-hidden={!panelVisible}
      >
        {/* Header */}
        <div className="flex h-12 items-center gap-2 border-b border-white/[0.06] px-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-neutral-400"
            aria-hidden
          >
            <Library size={14} strokeWidth={1.8} />
          </span>
          <span
            className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-100"
            title={tree.name}
          >
            {tree.name || "Library"}
          </span>
          <button
            type="button"
            onClick={onChangeFolder}
            aria-label="Change folder"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <FolderOpen size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <ChevronsLeft size={14} strokeWidth={1.8} />
          </button>
        </div>

        {/* Section label */}
        <div className="px-3 pt-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Folders
          </span>
        </div>

        {/* Tree */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <Tree
            root={tree}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
          />
        </div>
      </div>
    </aside>
  );
}
