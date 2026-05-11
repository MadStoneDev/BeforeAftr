"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronsRight } from "lucide-react";
import {
  buildTree,
  countFiles,
  findNodeByPath,
} from "@/lib/library/tree-builder";
import { scanWithFileSystemAPI } from "@/lib/library/fs-adapter";
import type { LibraryNode, ScanResult } from "@/lib/library/types";
import type { SortMode, ViewMode, ViewScope } from "@/lib/library/db";
import {
  clearLibrary,
  loadLibrary,
  loadPreferences,
  queryHandlePermission,
  requestHandlePermission,
  saveLibrary,
  savePreferences,
} from "@/lib/library/persistence";
import { clearThumbnails } from "@/lib/library/thumbnails";
import {
  addFavorite,
  getAllFavorites,
  removeFavorite,
} from "@/lib/library/favorites";
import { recordView } from "@/lib/library/recents";
import {
  addToCollection,
  createCollection,
  getCollections,
  type CollectionRecord,
} from "@/lib/library/collections";
import { expandAllTokens } from "@/lib/library/synonyms";
import type { VariantGroup } from "@/lib/library/variant-grouping";
import { getWorkspaceById } from "@/lib/library/workspaces";
import { DirectoryPicker } from "./directory-picker";
import { Modal } from "./modal";
import { Sidebar, type SidebarState } from "./sidebar";
import { TagChip } from "./tag-chip";
import { Viewer } from "./viewer/viewer";
import { CompareViewer } from "./viewer/compare-viewer";
import { ContextMenu } from "./gallery/context-menu";
import { WorkspaceSelector } from "./workspace/workspace-selector";
import { WorkspaceSidebar } from "./workspace/workspace-sidebar";

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
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [viewScope, setViewScope] = useState<ViewScope>("directory");
  const [booting, setBooting] = useState(true);
  const [savedLibrary, setSavedLibrary] = useState<SavedLibrary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [topicId, setTopicId] = useState<string | null>("dnd-maps");
  const [favoritePaths, setFavoritePaths] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [compareTarget, setCompareTarget] = useState<LibraryNode | null>(null);
  const [comparePicking, setComparePicking] = useState<LibraryNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: LibraryNode;
  } | null>(null);
  const [stackVariants, setStackVariants] = useState(true);
  const [activeVariantGroup, setActiveVariantGroup] =
    useState<VariantGroup | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>("dnd-maps");
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(true);
  const activeWorkspace = workspaceId ? getWorkspaceById(workspaceId) : null;

  const lastNonHidden = useRef<SidebarState>("expanded");

  useEffect(() => {
    if (sidebarState !== "hidden") {
      lastNonHidden.current = sidebarState;
    }
  }, [sidebarState]);

  const tree = useMemo(
    () =>
      scanResult
        ? buildTree(scanResult.rootName || "Library", scanResult.entries, topicId)
        : null,
    [scanResult, topicId],
  );

  const fileCount = useMemo(
    () => (tree ? countFiles(tree) : 0),
    [tree],
  );

  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  const trimmedQuery = debouncedQuery;
  const searchActive = trimmedQuery.length > 0;

  const synonymData = useMemo(() => {
    if (!searchActive) return null;
    const tokens = trimmedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    if (tokens.length === 0) return null;
    return expandAllTokens(tokens);
  }, [searchActive, trimmedQuery]);

  const synonymHints = synonymData?.hints ?? null;

  const searchVisibleSet = useMemo(() => {
    if (!tree || !searchActive || !synonymData) return null;
    const { expanded } = synonymData;
    if (expanded.length === 0) return null;

    const visible = new Set<string>();

    const nodeMatchesTokenGroup = (
      node: LibraryNode,
      tokenGroup: string[],
    ): boolean => {
      const nameLower = node.name.toLowerCase();
      const tagsLower = node.tags.map((t) => t.toLowerCase());
      const pathSegments = node.path.toLowerCase().split("/");
      for (const token of tokenGroup) {
        if (nameLower.includes(token)) return true;
        if (tagsLower.some((t) => t.includes(token))) return true;
        if (pathSegments.some((seg) => seg.includes(token))) return true;
      }
      return false;
    };

    const walk = (node: LibraryNode, ancestors: string[]): boolean => {
      const matchCount = expanded.filter((group) =>
        nodeMatchesTokenGroup(node, group),
      ).length;
      const selfMatches = matchCount > 0;

      let childMatched = false;
      if (node.children) {
        const next = [...ancestors, node.path];
        for (const c of node.children) {
          if (walk(c, next)) childMatched = true;
        }
      }

      if (selfMatches || childMatched) {
        visible.add(node.path);
        for (const a of ancestors) visible.add(a);
        return true;
      }
      return false;
    };
    walk(tree, []);
    return visible;
  }, [tree, searchActive, synonymData]);

  const searchHasResults =
    searchVisibleSet === null || searchVisibleSet.size > 0;

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
          setViewMode(prefs.viewMode);
          setViewScope(prefs.viewScope);
          if (prefs.sortMode) setSortMode(prefs.sortMode);
          if (prefs.topicId !== undefined) setTopicId(prefs.topicId);
          if (prefs.stackVariants !== undefined) setStackVariants(prefs.stackVariants);
          if (prefs.workspaceId !== undefined) setWorkspaceId(prefs.workspaceId);
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
        const [favs, colls] = await Promise.all([
          getAllFavorites(),
          getCollections(),
        ]);
        if (!cancelled) {
          setFavoritePaths(favs);
          setCollections(colls);
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
        viewMode,
        viewScope,
        sortMode,
        topicId,
        stackVariants,
        workspaceId,
      }).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(id);
  }, [
    booting,
    sidebarState,
    activeTags,
    expandedPaths,
    selected,
    viewMode,
    viewScope,
    sortMode,
    topicId,
    stackVariants,
    workspaceId,
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

  // Back button protection — prevent accidental exit.
  useEffect(() => {
    history.pushState({ library: true }, "", window.location.href);
    const onPop = () => {
      history.pushState({ library: true }, "", window.location.href);
      setShowExitConfirm(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    window.removeEventListener("popstate", () => {});
    history.go(-2);
  };

  const handlePicked = (result: ScanResult) => {
    setScanResult(result);
    setSelected(null);
    setActiveTags(new Set());
    setExpandedPaths(new Set());
    setViewMode("gallery");
    setViewScope("directory");
    setSavedLibrary(null);
    void clearThumbnails();
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
    setViewMode("gallery");
    setViewScope("directory");
    setSavedLibrary(null);
    setSearchQuery("");
    void clearLibrary();
    void clearThumbnails();
  };

  const handleRefresh = useCallback(async () => {
    if (!scanResult?.rootHandle || refreshing) return;
    setRefreshing(true);
    void clearThumbnails();
    try {
      let perm = await queryHandlePermission(scanResult.rootHandle);
      if (perm !== "granted") {
        perm = await requestHandlePermission(scanResult.rootHandle);
        if (perm !== "granted") return;
      }
      const result = await scanWithFileSystemAPI(scanResult.rootHandle, {
        recursive: true,
      });
      const oldPath = selected?.path ?? null;
      setSelected(null);
      setScanResult(result);
      void saveLibrary(result);
      if (oldPath !== null) setPendingSelectedPath(oldPath);
    } catch {
      /* swallow — user can re-pick if something is broken */
    } finally {
      setRefreshing(false);
    }
  }, [scanResult, refreshing, selected]);

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

  const togglePresetTags = useCallback((tags: string[]) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      const allActive = tags.every((t) => next.has(t.toLowerCase()));
      if (allActive) {
        for (const t of tags) next.delete(t.toLowerCase());
      } else {
        for (const t of tags) next.add(t.toLowerCase());
      }
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((path: string) => {
    setFavoritePaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
        void removeFavorite(path);
      } else {
        next.add(path);
        void addFavorite(path);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (node: LibraryNode) => {
      if (comparePicking) {
        if (node.kind === "file" && node.fileKind === "image") {
          setCompareTarget(node);
          setComparePicking(null);
        }
        return;
      }
      if (
        activeVariantGroup &&
        activeVariantGroup.variants.some((v) => v.path === node.path)
      ) {
        setSelected(node);
      } else {
        setActiveVariantGroup(null);
        setSelected(node);
      }
      if (node.kind === "file") {
        void recordView(node.path);
      }
    },
    [comparePicking, activeVariantGroup],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: LibraryNode) => {
      setContextMenu({ x: e.clientX, y: e.clientY, node });
    },
    [],
  );

  const handleAddToCollection = useCallback(
    async (collectionId: string, path: string) => {
      await addToCollection(collectionId, path);
    },
    [],
  );

  const handleNewCollection = useCallback(
    async (path: string) => {
      const name = prompt("Collection name:");
      if (!name?.trim()) return;
      const id = await createCollection(name.trim());
      await addToCollection(id, path);
      setCollections(await getCollections());
    },
    [],
  );

  const handleSelectVariantGroup = useCallback(
    (group: VariantGroup) => {
      setActiveVariantGroup(group);
      setSelected(group.representative);
      void recordView(group.representative.path);
    },
    [],
  );

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
        onSelect={handleSelect}
        onChangeFolder={handleChangeFolder}
        onRefresh={scanResult?.rootHandle ? handleRefresh : undefined}
        refreshing={refreshing}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchVisibleSet={searchVisibleSet}
        searchActive={searchActive}
        searchHasResults={searchHasResults}
        synonymHints={synonymHints}
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

          <WorkspaceSelector
            activeId={workspaceId}
            onChange={setWorkspaceId}
          />
        </header>
        <div className="min-h-0 flex-1">
          {comparePicking && selected && (
            <div className="flex h-9 items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 text-xs text-amber-300">
              <span>Click an image to compare with {comparePicking.name}</span>
              <button
                type="button"
                onClick={() => setComparePicking(null)}
                className="ml-auto rounded px-2 py-0.5 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200"
              >
                Cancel
              </button>
            </div>
          )}
          {compareTarget && comparePicking === null && selected?.kind === "file" ? (
            <CompareViewer
              left={compareTarget}
              right={selected}
              onClose={() => setCompareTarget(null)}
            />
          ) : (
            <Viewer
              node={selected}
              onSelect={handleSelect}
              activeTagsLower={activeTags}
              onToggleTag={toggleTag}
              onClearTags={clearTags}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              viewScope={viewScope}
              onViewScopeChange={setViewScope}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              favoritePaths={favoritePaths}
              onToggleFavorite={toggleFavorite}
              onContextMenu={handleContextMenu}
              searchQuery={searchQuery}
              stackVariants={stackVariants}
              onStackVariantsChange={setStackVariants}
              onSelectVariantGroup={handleSelectVariantGroup}
              activeVariantGroup={activeVariantGroup}
            />
          )}
        </div>
      </main>

      {activeWorkspace && (
        <WorkspaceSidebar
          workspace={activeWorkspace}
          open={workspaceSidebarOpen}
          onToggle={() => setWorkspaceSidebarOpen((p) => !p)}
          selectedNode={selected}
          activeTagsLower={activeTags}
          onTogglePresetTags={togglePresetTags}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isFavorite={favoritePaths.has(contextMenu.node.path)}
          collections={collections}
          onClose={() => setContextMenu(null)}
          onToggleFavorite={() => toggleFavorite(contextMenu.node.path)}
          onAddToCollection={(collId) => {
            void handleAddToCollection(collId, contextMenu.node.path);
          }}
          onNewCollection={() => {
            void handleNewCollection(contextMenu.node.path);
          }}
          onCompare={() => {
            setComparePicking(contextMenu.node);
          }}
        />
      )}

      <Modal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Leave Library?"
        primaryAction={{
          label: "Stay",
          onClick: () => setShowExitConfirm(false),
        }}
        secondaryAction={{
          label: "Leave",
          onClick: handleConfirmExit,
        }}
      >
        You&apos;ll lose your current browsing context if you navigate away.
      </Modal>
    </div>
  );
}
