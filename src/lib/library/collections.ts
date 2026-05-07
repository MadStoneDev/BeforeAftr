import { getDB } from "./db";

export type CollectionRecord = {
  id: string;
  name: string;
  createdAt: number;
};

export type CollectionItemRecord = {
  collectionId: string;
  path: string;
  addedAt: number;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createCollection(name: string): Promise<string> {
  const id = generateId();
  await getDB()
    .table("collections")
    .put({ id, name, createdAt: Date.now() });
  return id;
}

export async function deleteCollection(id: string): Promise<void> {
  const db = getDB();
  await db.table("collections").delete(id);
  const items = await db
    .table("collectionItems")
    .where("collectionId")
    .equals(id)
    .toArray();
  if (items.length > 0) {
    await db
      .table("collectionItems")
      .bulkDelete(
        items.map((i: CollectionItemRecord) => [i.collectionId, i.path]),
      );
  }
}

export async function renameCollection(
  id: string,
  name: string,
): Promise<void> {
  const rec = await getDB().table("collections").get(id);
  if (rec) {
    await getDB()
      .table("collections")
      .put({ ...rec, name });
  }
}

export async function addToCollection(
  collectionId: string,
  path: string,
): Promise<void> {
  await getDB()
    .table("collectionItems")
    .put({ collectionId, path, addedAt: Date.now() });
}

export async function removeFromCollection(
  collectionId: string,
  path: string,
): Promise<void> {
  await getDB()
    .table("collectionItems")
    .delete([collectionId, path]);
}

export async function getCollections(): Promise<CollectionRecord[]> {
  try {
    return await getDB()
      .table("collections")
      .orderBy("createdAt")
      .reverse()
      .toArray();
  } catch {
    return [];
  }
}

export async function getCollectionItems(
  collectionId: string,
): Promise<CollectionItemRecord[]> {
  try {
    return await getDB()
      .table("collectionItems")
      .where("collectionId")
      .equals(collectionId)
      .toArray();
  } catch {
    return [];
  }
}
