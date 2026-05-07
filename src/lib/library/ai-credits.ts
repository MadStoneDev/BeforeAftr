import { getDB } from "./db";

export const FREE_LIMIT = 50;

export type AiCreditState = {
  freeUsed: number;
  paidRemaining: number;
};

type AiCreditRecord = {
  id: "current";
  freeUsed: number;
  creditKey: string | null;
  paidRemaining: number;
  lastValidated: number;
};

async function getRecord(): Promise<AiCreditRecord> {
  try {
    const rec = await getDB().table("aiCredits").get("current");
    if (rec) return rec as AiCreditRecord;
  } catch {
    /* ignore */
  }
  return {
    id: "current",
    freeUsed: 0,
    creditKey: null,
    paidRemaining: 0,
    lastValidated: 0,
  };
}

export async function getCreditsState(): Promise<{
  freeRemaining: number;
  paidRemaining: number;
  total: number;
}> {
  const rec = await getRecord();
  const freeRemaining = Math.max(0, FREE_LIMIT - rec.freeUsed);
  return {
    freeRemaining,
    paidRemaining: rec.paidRemaining,
    total: freeRemaining + rec.paidRemaining,
  };
}

export async function consumeCredit(): Promise<boolean> {
  const rec = await getRecord();
  const freeRemaining = FREE_LIMIT - rec.freeUsed;
  if (freeRemaining > 0) {
    rec.freeUsed += 1;
    await getDB().table("aiCredits").put(rec);
    return true;
  }
  if (rec.paidRemaining > 0) {
    rec.paidRemaining -= 1;
    await getDB().table("aiCredits").put(rec);
    return true;
  }
  return false;
}

export async function addCredits(count: number): Promise<void> {
  const rec = await getRecord();
  rec.paidRemaining += count;
  await getDB().table("aiCredits").put(rec);
}

export async function applyCreditKey(key: string): Promise<number> {
  const res = await fetch("/api/library/redeem-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to redeem key");
  }
  const { credits } = (await res.json()) as { credits: number };
  const rec = await getRecord();
  rec.paidRemaining += credits;
  rec.creditKey = key;
  rec.lastValidated = Date.now();
  await getDB().table("aiCredits").put(rec);
  return credits;
}
