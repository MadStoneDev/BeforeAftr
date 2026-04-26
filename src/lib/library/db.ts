import Dexie, { type EntityTable } from "dexie";
import type { LibraryEntry } from "./types";

export type LibraryRecord = {
  id: string;
  rootName: string;
  rootHandle: FileSystemDirectoryHandle | null;
  entries: LibraryEntry[];
  lastOpenedAt: number;
};

export type PreferencesRecord = {
  id: "main";
  sidebarState: "expanded" | "collapsed" | "hidden";
  activeTags: string[];
  expandedPaths: string[];
  selectedPath: string | null;
  galleryRecursive: boolean;
};

export class LibraryDB extends Dexie {
  libraries!: EntityTable<LibraryRecord, "id">;
  preferences!: EntityTable<PreferencesRecord, "id">;

  constructor() {
    super("BeforeAftrLibrary");
    this.version(1).stores({
      libraries: "id, lastOpenedAt",
      preferences: "id",
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
