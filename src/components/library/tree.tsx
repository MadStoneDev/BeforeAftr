"use client";

import type { LibraryNode } from "@/lib/library/types";
import { TreeNode } from "./tree-node";

type Props = {
  root: LibraryNode;
  selectedPath: string | null;
  expandedPaths: ReadonlySet<string>;
  onToggleExpand: (path: string) => void;
  onSelect: (node: LibraryNode) => void;
};

export function Tree({
  root,
  selectedPath,
  expandedPaths,
  onToggleExpand,
  onSelect,
}: Props) {
  return (
    <div
      role="tree"
      aria-label="Library folders"
      className="group/tree select-none py-2"
    >
      <TreeNode
        node={root}
        depth={0}
        expanded={expandedPaths}
        selectedPath={selectedPath}
        onToggle={onToggleExpand}
        onSelect={onSelect}
      />
    </div>
  );
}
