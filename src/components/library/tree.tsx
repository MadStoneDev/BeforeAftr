"use client";

import { useCallback, useRef } from "react";
import type { LibraryNode } from "@/lib/library/types";
import { TreeNode } from "./tree-node";

type Props = {
  root: LibraryNode;
  selectedPath: string | null;
  expandedPaths: ReadonlySet<string>;
  onToggleExpand: (path: string) => void;
  onSelect: (node: LibraryNode) => void;
  visibleSet?: ReadonlySet<string> | null;
  forceExpand?: boolean;
};

function flattenVisible(
  node: LibraryNode,
  expanded: ReadonlySet<string>,
  visibleSet: ReadonlySet<string> | null,
  forceExpand: boolean,
  out: LibraryNode[],
): void {
  out.push(node);
  if (node.kind !== "directory") return;
  const expandedHere = forceExpand || expanded.has(node.path);
  if (!expandedHere) return;
  const children = node.children ?? [];
  for (const c of children) {
    if (visibleSet && !visibleSet.has(c.path)) continue;
    flattenVisible(c, expanded, visibleSet, forceExpand, out);
  }
}

export function Tree({
  root,
  selectedPath,
  expandedPaths,
  onToggleExpand,
  onSelect,
  visibleSet = null,
  forceExpand = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const focusContainer = useCallback(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const navKeys = ["ArrowDown", "ArrowUp", "Home", "End", "ArrowLeft", "ArrowRight"];
    if (!navKeys.includes(e.key)) return;

    const list: LibraryNode[] = [];
    flattenVisible(root, expandedPaths, visibleSet, forceExpand, list);
    if (list.length === 0) return;

    e.preventDefault();
    const idx = selectedPath !== null
      ? list.findIndex((n) => n.path === selectedPath)
      : -1;

    switch (e.key) {
      case "ArrowDown":
        onSelect(list[idx < 0 ? 0 : Math.min(list.length - 1, idx + 1)]);
        break;
      case "ArrowUp":
        onSelect(list[idx <= 0 ? 0 : idx - 1]);
        break;
      case "Home":
        onSelect(list[0]);
        break;
      case "End":
        onSelect(list[list.length - 1]);
        break;
      case "ArrowRight": {
        if (idx < 0) {
          onSelect(list[0]);
          break;
        }
        const cur = list[idx];
        if (cur.kind !== "directory") break;
        const isExp = forceExpand || expandedPaths.has(cur.path);
        if (!isExp && !forceExpand) {
          onToggleExpand(cur.path);
        } else {
          const child = (cur.children ?? []).find(
            (c) => !visibleSet || visibleSet.has(c.path),
          );
          if (child) onSelect(child);
        }
        break;
      }
      case "ArrowLeft": {
        if (idx < 0) break;
        const cur = list[idx];
        const isExpDir =
          cur.kind === "directory" && expandedPaths.has(cur.path) && !forceExpand;
        if (isExpDir) {
          onToggleExpand(cur.path);
        } else {
          const slash = cur.path.lastIndexOf("/");
          const parentPath = slash < 0 ? "" : cur.path.slice(0, slash);
          const parent = list.find((n) => n.path === parentPath);
          if (parent && parent.path !== cur.path) onSelect(parent);
        }
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label="Library folders"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group/tree select-none py-2 focus:outline-none"
    >
      <TreeNode
        node={root}
        depth={0}
        expanded={expandedPaths}
        selectedPath={selectedPath}
        onToggle={onToggleExpand}
        onSelect={onSelect}
        onAfterSelect={focusContainer}
        visibleSet={visibleSet}
        forceExpand={forceExpand}
      />
    </div>
  );
}
