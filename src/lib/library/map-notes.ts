import { getDB } from "./db";

export type MapNoteRecord = {
  path: string;
  notes: string;
  usages: { date: number; sessionName?: string; note?: string }[];
  userTags: string[];
  createdAt: number;
  updatedAt: number;
};

export async function getMapNote(path: string): Promise<MapNoteRecord | null> {
  try {
    const rec = await getDB().mapNotes.get(path);
    return rec ?? null;
  } catch {
    return null;
  }
}

export async function saveMapNote(
  path: string,
  updates: Partial<Pick<MapNoteRecord, "notes" | "userTags">>,
): Promise<void> {
  try {
    const existing = await getDB().mapNotes.get(path);
    if (existing) {
      await getDB().mapNotes.update(path, {
        ...updates,
        updatedAt: Date.now(),
      });
    } else {
      await getDB().mapNotes.put({
        path,
        notes: updates.notes ?? "",
        usages: [],
        userTags: updates.userTags ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch {
    /* quota error */
  }
}

export async function addUsage(
  path: string,
  sessionName?: string,
  note?: string,
): Promise<void> {
  try {
    const existing = await getDB().mapNotes.get(path);
    const usage = { date: Date.now(), sessionName, note };
    if (existing) {
      await getDB().mapNotes.update(path, {
        usages: [...existing.usages, usage],
        updatedAt: Date.now(),
      });
    } else {
      await getDB().mapNotes.put({
        path,
        notes: "",
        usages: [usage],
        userTags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch {
    /* quota error */
  }
}
