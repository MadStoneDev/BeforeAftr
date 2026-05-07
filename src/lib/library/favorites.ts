import { getDB } from "./db";

export type FavoriteRecord = {
  path: string;
  addedAt: number;
};

export async function addFavorite(path: string): Promise<void> {
  try {
    await getDB().table("favorites").put({ path, addedAt: Date.now() });
  } catch {
    /* ignore */
  }
}

export async function removeFavorite(path: string): Promise<void> {
  try {
    await getDB().table("favorites").delete(path);
  } catch {
    /* ignore */
  }
}

export async function isFavorite(path: string): Promise<boolean> {
  try {
    const rec = await getDB().table("favorites").get(path);
    return !!rec;
  } catch {
    return false;
  }
}

export async function getAllFavorites(): Promise<Set<string>> {
  try {
    const recs = await getDB().table("favorites").toArray();
    return new Set(recs.map((r: FavoriteRecord) => r.path));
  } catch {
    return new Set();
  }
}

export async function clearFavorites(): Promise<void> {
  try {
    await getDB().table("favorites").clear();
  } catch {
    /* ignore */
  }
}
