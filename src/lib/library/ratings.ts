import { getDB } from "./db";

export type RatingRecord = {
  path: string;
  rating: number;
  ratedAt: number;
};

export async function getRating(path: string): Promise<number> {
  try {
    const rec = await getDB().ratings.get(path);
    return rec?.rating ?? 0;
  } catch {
    return 0;
  }
}

export async function setRating(path: string, rating: number): Promise<void> {
  try {
    if (rating === 0) {
      await getDB().ratings.delete(path);
    } else {
      await getDB().ratings.put({ path, rating, ratedAt: Date.now() });
    }
  } catch {
    /* ignore */
  }
}

export async function getAllRatings(): Promise<Map<string, number>> {
  try {
    const all = await getDB().ratings.toArray();
    return new Map(all.map((r) => [r.path, r.rating]));
  } catch {
    return new Map();
  }
}
