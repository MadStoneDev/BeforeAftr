import { getDB } from "./db";

export type RecentRecord = {
  path: string;
  viewedAt: number;
};

const MAX_RECENTS = 50;

export async function recordView(path: string): Promise<void> {
  try {
    const db = getDB();
    await db.table("recentlyViewed").put({ path, viewedAt: Date.now() });
    const count = await db.table("recentlyViewed").count();
    if (count > MAX_RECENTS) {
      const oldest = await db
        .table("recentlyViewed")
        .orderBy("viewedAt")
        .limit(count - MAX_RECENTS)
        .toArray();
      await db
        .table("recentlyViewed")
        .bulkDelete(oldest.map((r: RecentRecord) => r.path));
    }
  } catch {
    /* ignore */
  }
}

export async function getRecent(limit = MAX_RECENTS): Promise<RecentRecord[]> {
  try {
    return await getDB()
      .table("recentlyViewed")
      .orderBy("viewedAt")
      .reverse()
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}

export async function clearRecents(): Promise<void> {
  try {
    await getDB().table("recentlyViewed").clear();
  } catch {
    /* ignore */
  }
}
