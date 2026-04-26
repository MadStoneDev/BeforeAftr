"use client";

import { useEffect, useRef } from "react";
import {
  ChevronRight,
  Folder,
  FileImage,
  FileText,
  FileType,
  File as FileIcon,
} from "lucide-react";
import type { FileKind, LibraryNode } from "@/lib/library/types";

type Props = {
  node: LibraryNode;
  depth: number;
  expanded: ReadonlySet<string>;
  selectedPath: string | null;
  onToggle: (path: string) => void;
  onSelect: (node: LibraryNode) => void;
};

function iconForFile(kind: FileKind | undefined) {
  switch (kind) {
    case "image":
      return FileImage;
    case "pdf":
      return FileType;
    case "markdown":
    case "text":
      return FileText;
    case "doc":
      return FileType;
    default:
      return FileIcon;
  }
}

export function TreeNode({
  node,
  depth,
  expanded,
  selectedPath,
  onToggle,
  onSelect,
}: Props) {
  const isDir = node.kind === "directory";
  const isExpanded = expanded.has(node.path);
  const isSelected = selectedPath === node.path;
  const hasChildren = isDir && (node.children?.length ?? 0) > 0;

  const FileIconComp = iconForFile(node.fileKind);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [isSelected]);

  const handleClick = () => {
    if (isDir) {
      onToggle(node.path);
      onSelect(node);
    } else {
      onSelect(node);
    }
  };

  return (
    <>
      <div
        ref={rowRef}
        role="treeitem"
        aria-expanded={isDir ? isExpanded : undefined}
        aria-selected={isSelected}
        tabIndex={-1}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className={[
          "group/row relative flex h-8 cursor-pointer items-center pr-2 text-[13px] leading-5 transition-colors duration-[120ms]",
          isSelected
            ? "bg-white/[0.08] text-neutral-50"
            : "text-neutral-300 hover:bg-white/[0.04]",
        ].join(" ")}
      >
        {isSelected && (
          <span
            aria-hidden
            className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-white/60"
          />
        )}

        {/* Indent guides: one per ancestor level */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="h-full w-4 shrink-0 border-l border-transparent group-hover/tree:border-white/[0.08]"
          />
        ))}

        {/* Chevron slot — always 20px for alignment */}
        <span
          className="flex h-full w-5 shrink-0 items-center justify-center text-neutral-500"
          onClick={
            hasChildren
              ? (e) => {
                  e.stopPropagation();
                  onToggle(node.path);
                }
              : undefined
          }
        >
          {hasChildren && (
            <ChevronRight
              size={14}
              strokeWidth={2}
              className={`transition-transform duration-150 ease-out ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
        </span>

        <span
          className={[
            "mr-2 flex shrink-0 items-center justify-center",
            isSelected ? "text-neutral-100" : "text-neutral-400",
          ].join(" ")}
        >
          {isDir ? (
            <Folder size={16} strokeWidth={1.6} />
          ) : (
            <FileIconComp size={16} strokeWidth={1.6} />
          )}
        </span>

        <span
          className={[
            "truncate",
            isDir ? "font-medium" : "font-normal",
          ].join(" ")}
          title={node.name}
        >
          {node.name}
        </span>
      </div>

      {isDir && isExpanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          selectedPath={selectedPath}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
