import {
  CURRENT_LIBRARY_ID,
  PREFERENCES_ID,
  getDB,
  type LibraryRecord,
  type PreferencesRecord,
} from "./db";
import type { LibraryEntry, ScanResult } from "./types";

type DirHandleWithPerms = FileSystemDirectoryHandle & {
  queryPermission: (opts: {
    mode: "read" | "readwrite";
  }) => Promise<"granted" | "denied" | "prompt">;
  requestPermission: (opts: {
    mode: "read" | "readwrite";
  }) => Promise<"granted" | "denied" | "prompt">;
};

export async function saveLibrary(result: ScanResult): Promise<void> {
  if (!result.rootHandle) return;

  const entries = result.entries.map(stripFile);
  const record: LibraryRecord = {
    id: CURRENT_LIBRARY_ID,
    rootName: result.rootName,
    rootHandle: result.rootHandle,
    entries,
    lastOpenedAt: Date.now(),
  };

  try {
    await getDB().libraries.put(record);
  } catch {
    /* quota or clone error — skip silently */
  }
}

function stripFile(entry: LibraryEntry): LibraryEntry {
  if (!entry.file) return entry;
  const { file: _file, ...rest } = entry;
  return rest;
}

export async function loadLibrary(): Promise<LibraryRecord | null> {
  try {
    const rec = await getDB().libraries.get(CURRENT_LIBRARY_ID);
    return rec ?? null;
  } catch {
    return null;
  }
}

export async function clearLibrary(): Promise<void> {
  try {
    await getDB().libraries.delete(CURRENT_LIBRARY_ID);
  } catch {
    /* ignore */
  }
}

export async function savePreferences(
  prefs: Omit<PreferencesRecord, "id">,
): Promise<void> {
  try {
    await getDB().preferences.put({ ...prefs, id: PREFERENCES_ID });
  } catch {
    /* ignore */
  }
}

export async function loadPreferences(): Promise<PreferencesRecord | null> {
  try {
    const rec = await getDB().preferences.get(PREFERENCES_ID);
    return rec ?? null;
  } catch {
    return null;
  }
}

export async function queryHandlePermission(
  handle: FileSystemDirectoryHandle,
): Promise<"granted" | "denied" | "prompt"> {
  try {
    return await (handle as DirHandleWithPerms).queryPermission({
      mode: "read",
    });
  } catch {
    return "prompt";
  }
}

export async function requestHandlePermission(
  handle: FileSystemDirectoryHandle,
): Promise<"granted" | "denied" | "prompt"> {
  try {
    return await (handle as DirHandleWithPerms).requestPermission({
      mode: "read",
    });
  } catch {
    return "denied";
  }
}
