import Dexie, { type EntityTable } from "dexie";
import type { LibraryEntry } from "./types";

export type LibraryRecord = {
  id: string;
  rootName: string;
  rootHandle: FileSystemDirectoryHandle | null;
  entries: LibraryEntry[];
  lastOpenedAt: number;
};

export type ViewMode = "gallery" | "explorer";
export type ViewScope = "directory" | "recursive";

export type SortMode = "name-asc" | "name-desc" | "date" | "dimensions" | "color";
export type FileTypeFilter = "images" | "documents" | "text" | "other";

export type PreferencesRecord = {
  id: "main";
  sidebarState: "expanded" | "collapsed" | "hidden";
  activeTags: string[];
  expandedPaths: string[];
  selectedPath: string | null;
  viewMode: ViewMode;
  viewScope: ViewScope;
  sortMode: SortMode;
  topicId: string | null;
  stackVariants: boolean;
  workspaceId: string | null;
};

export type ThumbnailRecord = {
  id: string;
  blob: Blob;
  createdAt: number;
  colorTags?: string[];
  width?: number;
  height?: number;
};

export class LibraryDB extends Dexie {
  libraries!: EntityTable<LibraryRecord, "id">;
  preferences!: EntityTable<PreferencesRecord, "id">;
  thumbnails!: EntityTable<ThumbnailRecord, "id">;
  mapNotes!: EntityTable<{ path: string; notes: string; usages: { date: number; sessionName?: string; note?: string }[]; userTags: string[]; createdAt: number; updatedAt: number }, "path">;
  sessions!: EntityTable<{ id: string; name: string; notes: string; createdAt: number }, "id">;
  sessionItems!: EntityTable<{ sessionId: string; path: string; order: number; note: string; addedAt: number }, "sessionId">;
  ratings!: EntityTable<{ path: string; rating: number; ratedAt: number }, "path">;

  constructor() {
    super("BeforeAftrLibrary");
    this.version(1).stores({
      libraries: "id, lastOpenedAt",
      preferences: "id",
    });
    this.version(2).stores({
      libraries: "id, lastOpenedAt",
      preferences: "id",
      thumbnails: "id, createdAt",
    });
    this.version(3)
      .stores({
        libraries: "id, lastOpenedAt",
        preferences: "id",
        thumbnails: "id, createdAt",
        favorites: "path, addedAt",
        recentlyViewed: "path, viewedAt",
        collections: "id, createdAt",
        collectionItems: "[collectionId+path], collectionId, path, addedAt",
        aiCredits: "id",
        aiTags: "id",
      })
      .upgrade((tx) => {
        return tx
          .table("preferences")
          .toCollection()
          .modify((rec: Record<string, unknown>) => {
            const wasRecursive = rec.galleryRecursive === true;
            rec.viewMode = "gallery";
            rec.viewScope = wasRecursive ? "recursive" : "directory";
            delete rec.galleryRecursive;
          });
      });
    this.version(4).stores({
      libraries: "id, lastOpenedAt",
      preferences: "id",
      thumbnails: "id, createdAt",
      favorites: "path, addedAt",
      recentlyViewed: "path, viewedAt",
      collections: "id, createdAt",
      collectionItems: "[collectionId+path], collectionId, path, addedAt",
      aiCredits: "id",
      aiTags: "id",
      mapNotes: "path",
      sessions: "id, createdAt",
      sessionItems: "[sessionId+path], sessionId",
      ratings: "path",
    });
  }
}

let instance: LibraryDB | null = null;

export function getDB(): LibraryDB {
  if (!instance) instance = new LibraryDB();
  return instance;
}

export const CURRENT_LIBRARY_ID = "current";
export const PREFERENCES_ID = "main" as const;
