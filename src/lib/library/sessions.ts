import { getDB } from "./db";

export type SessionRecord = {
  id: string;
  name: string;
  notes: string;
  createdAt: number;
};

export type SessionItemRecord = {
  sessionId: string;
  path: string;
  order: number;
  note: string;
  addedAt: number;
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function getSessions(): Promise<SessionRecord[]> {
  try {
    return await getDB().sessions.orderBy("createdAt").reverse().toArray();
  } catch {
    return [];
  }
}

export async function createSession(name: string): Promise<string> {
  const id = generateId();
  await getDB().sessions.put({
    id,
    name,
    notes: "",
    createdAt: Date.now(),
  });
  return id;
}

export async function updateSessionNotes(
  id: string,
  notes: string,
): Promise<void> {
  try {
    await getDB().sessions.update(id, { notes });
  } catch {
    /* ignore */
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await getDB().sessions.delete(id);
    await getDB().sessionItems.where("sessionId").equals(id).delete();
  } catch {
    /* ignore */
  }
}

export async function getSessionItems(
  sessionId: string,
): Promise<SessionItemRecord[]> {
  try {
    const items = await getDB()
      .sessionItems.where("sessionId")
      .equals(sessionId)
      .toArray();
    return items.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function addSessionItem(
  sessionId: string,
  path: string,
): Promise<void> {
  try {
    const existing = await getDB()
      .sessionItems.where("sessionId")
      .equals(sessionId)
      .toArray();
    const maxOrder = existing.reduce(
      (max, item) => Math.max(max, item.order),
      -1,
    );
    await getDB().sessionItems.put({
      sessionId,
      path,
      order: maxOrder + 1,
      note: "",
      addedAt: Date.now(),
    });
  } catch {
    /* ignore */
  }
}

export async function removeSessionItem(
  sessionId: string,
  path: string,
): Promise<void> {
  try {
    await getDB().sessionItems.where({ sessionId, path }).delete();
  } catch {
    /* ignore */
  }
}

export async function reorderSessionItems(
  sessionId: string,
  paths: string[],
): Promise<void> {
  try {
    const db = getDB();
    await db.transaction("rw", db.sessionItems, async () => {
      for (let i = 0; i < paths.length; i++) {
        await db.sessionItems.where({ sessionId, path: paths[i] }).modify({
          order: i,
        });
      }
    });
  } catch {
    /* ignore */
  }
}
