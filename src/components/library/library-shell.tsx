"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronsRight } from "lucide-react";
import {
  buildTree,
  countFiles,
  findNodeByPath,
} from "@/lib/library/tree-builder";
import type { LibraryNode, ScanResult } from "@/lib/library/types";
import {
  clearLibrary,
  loadLibrary,
  loadPreferences,
  queryHandlePermission,
  requestHandlePermission,
  saveLibrary,
  savePreferences,
} from "@/lib/library/persistence";
import { DirectoryPicker } from "./directory-picker";
import { Sidebar, type SidebarState } from "./sidebar";
import { TagChip } from "./tag-chip";
import { Viewer } from "./viewer/viewer";

type SavedLibrary = {
  rootName: string;
  rootHandle: FileSystemDirectoryHandle;
  entries: ScanResult["entries"];
};

export function LibraryShell() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selected, setSelected] = useState<LibraryNode | null>(null);
  const [pendingSelectedPath, setPendingSelectedPath] = useState<string | null>(
    null,
  );
  const [sidebarState, setSidebarState] = useState<SidebarState>("expanded");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [galleryRecursive, setGalleryRecursive] = useState(false);
  const [booting, setBooting] = useState(true);
  const [savedLibrary, setSavedLibrary] = useState<SavedLibrary | null>(null);

  const lastNonHidden = useRef<SidebarState>("expanded");

  useEffect(() => {
    if (sidebarState !== "hidden") {
      lastNonHidden.current = sidebarState;
    }
  }, [sidebarState]);

  const tree = useMemo(
    () =>
      scanResult
        ? buildTree(scanResult.rootName || "Library", scanResult.entries)
        : null,
    [scanResult],
  );

  const fileCount = useMemo(
    () => (tree ? countFiles(tree) : 0),
    [tree],
  );

  // Load persisted state on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lib, prefs] = await Promise.all([
          loadLibrary(),
          loadPreferences(),
        ]);

        if (cancelled) return;

        if (prefs) {
          setSidebarState(prefs.sidebarState);
          if (prefs.sidebarState !== "hidden") {
            lastNonHidden.current = prefs.sidebarState;
          }
          setActiveTags(new Set(prefs.activeTags));
          setExpandedPaths(new Set(prefs.expandedPaths));
          setGalleryRecursive(prefs.galleryRecursive);
          setPendingSelectedPath(prefs.selectedPath);
        }

        if (lib?.rootHandle) {
          const perm = await queryHandlePermission(lib.rootHandle);
          if (cancelled) return;
          if (perm === "granted") {
            setScanResult({
              rootName: lib.rootName,
              entries: lib.entries,
              rootHandle: lib.rootHandle,
            });
          } else {
            setSavedLibrary({
              rootName: lib.rootName,
              rootHandle: lib.rootHandle,
              entries: lib.entries,
            });
          }
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Ensure root is in expandedPaths once tree is built.
  useEffect(() => {
    if (!tree) return;
    setExpandedPaths((prev) => {
      if (prev.has(tree.path)) return prev;
      const next = new Set(prev);
      next.add(tree.path);
      return next;
    });
  }, [tree]);

  // Resolve pending selection after tree is built.
  useEffect(() => {
    if (!tree || pendingSelectedPath === null) return;
    const node = findNodeByPath(tree, pendingSelectedPath);
    if (node) setSelected(node);
    setPendingSelectedPath(null);
  }, [tree, pendingSelectedPath]);

  // Auto-select root once tree is available and nothing else is selected.
  useEffect(() => {
    if (!tree || pendingSelectedPath !== null || selected) return;
    setSelected(tree);
  }, [tree, pendingSelectedPath, selected]);

  // Save preferences (debounced) whenever persistable state changes.
  const firstSaveSkip = useRef(true);
  useEffect(() => {
    if (booting) return;
    if (firstSaveSkip.current) {
      firstSaveSkip.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      savePreferences({
        sidebarState,
        activeTags: Array.from(activeTags),
        expandedPaths: Array.from(expandedPaths),
        selectedPath: selected?.path ?? null,
        galleryRecursive,
      }).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(id);
  }, [
    booting,
    sidebarState,
    activeTags,
    expandedPaths,
    selected,
    galleryRecursive,
  ]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.code !== "Backslash") return;
      e.preventDefault();
      if (e.shiftKey) {
        setSidebarState((s) =>
          s === "hidden" ? lastNonHidden.current : "hidden",
        );
      } else {
        setSidebarState((s) => {
          if (s === "hidden") return lastNonHidden.current;
          return s === "expanded" ? "collapsed" : "expanded";
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handlePicked = (result: ScanResult) => {
    setScanResult(result);
    setSelected(null);
    setActiveTags(new Set());
    setExpandedPaths(new Set());
    setGalleryRecursive(false);
    setSavedLibrary(null);
    void saveLibrary(result);
  };

  const handleReopen = async () => {
    if (!savedLibrary) return;
    const perm = await requestHandlePermission(savedLibrary.rootHandle);
    if (perm !== "granted") {
      throw new Error("Permission denied. Try again or choose a new folder.");
    }
    setScanResult({
      rootName: savedLibrary.rootName,
      entries: savedLibrary.entries,
      rootHandle: savedLibrary.rootHandle,
    });
    setSavedLibrary(null);
  };

  const handleChangeFolder = () => {
    setScanResult(null);
    setSelected(null);
    setActiveTags(new Set());
    setExpandedPaths(new Set());
    setGalleryRecursive(false);
    setSavedLibrary(null);
    void clearLibrary();
  };

  const toggleSidebar = () =>
    setSidebarState((s) => {
      if (s === "hidden") return lastNonHidden.current;
      return s === "expanded" ? "collapsed" : "expanded";
    });

  const showSidebar = () => {
    setSidebarState(lastNonHidden.current);
  };

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      const key = tag.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearTags = useCallback(() => {
    setActiveTags(new Set());
  }, []);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  if (booting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0E0F11] text-neutral-500">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/30" />
          Loading library…
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="h-screen w-full overflow-hidden bg-[#0E0F11] text-neutral-100">
        <DirectoryPicker
          onPicked={handlePicked}
          savedLibrary={
            savedLibrary ? { rootName: savedLibrary.rootName } : null
          }
          onReopen={savedLibrary ? handleReopen : undefined}
        />
      </div>
    );
  }

  const showTagsInHeader =
    selected?.kind === "file" && selected.tags.length > 0;
  const sidebarHidden = sidebarState === "hidden";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0E0F11] text-neutral-100">
      <Sidebar
        state={sidebarState}
        onToggle={toggleSidebar}
        tree={tree}
        selectedPath={selected?.path ?? null}
        expandedPaths={expandedPaths}
        onToggleExpand={toggleExpand}
        onSelect={setSelected}
        onChangeFolder={handleChangeFolder}
      />
      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-4 border-b border-white/[0.06] px-6">
          {sidebarHidden && (
            <button
              type="button"
              onClick={showSidebar}
              aria-label="Show sidebar"
              title="Show sidebar (Cmd/Ctrl+Shift+\\)"
              className="-ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors duration-[120ms] hover:bg-white/[0.06] hover:text-neutral-100"
            >
              <ChevronsRight size={14} strokeWidth={1.8} />
            </button>
          )}
          <h1 className="shrink-0 truncate text-sm font-medium text-neutral-200">
            {selected?.name ?? tree.name}
          </h1>

          {showTagsInHeader ? (
            <div className="relative min-w-0 flex-1">
              <div
                className="flex items-center gap-1.5 overflow-x-auto pr-6 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {selected!.tags.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    size="sm"
                    active={activeTags.has(tag.toLowerCase())}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0E0F11] to-transparent"
              />
            </div>
          ) : (
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
              {selected?.kind === "directory"
                ? `${fileCount.toLocaleString()} ${fileCount === 1 ? "file" : "files"} total`
                : (selected?.path ??
                  `${fileCount.toLocaleString()} ${fileCount === 1 ? "file" : "files"} total`)}
            </span>
          )}

          <span className="hidden shrink-0 text-[11px] uppercase tracking-[0.08em] text-neutral-600 lg:inline">
            Cmd/Ctrl + \\ · Shift for full-width
          </span>
        </header>
        <div className="min-h-0 flex-1">
          <Viewer
            node={selected}
            onSelect={setSelected}
            activeTagsLower={activeTags}
            onToggleTag={toggleTag}
            onClearTags={clearTags}
            galleryRecursive={galleryRecursive}
            onToggleGalleryRecursive={setGalleryRecursive}
          />
        </div>
      </main>
    </div>
  );
}
