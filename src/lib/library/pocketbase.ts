import PocketBase from "pocketbase";

let pb: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (!pb) {
    const url = process.env.POCKETBASE_URL;
    if (!url) throw new Error("POCKETBASE_URL not configured");
    pb = new PocketBase(url);
  }
  return pb;
}
