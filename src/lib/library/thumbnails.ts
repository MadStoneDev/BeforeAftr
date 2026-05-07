import { getDB, type ThumbnailRecord } from "./db";
import { analyzeColors } from "./color-analysis";

const THUMB_VERSION = 3;
const THUMBNAIL_MIN_SIDE = 300;
const THUMBNAIL_MAX_LONG = 600;
const THUMBNAIL_QUALITY = 0.75;

export type ThumbnailResult = {
  blob: Blob;
  colorTags: string[];
  width: number;
  height: number;
};

export function getThumbnailKey(
  path: string,
  size: number,
  lastModified: number,
): string {
  return `v${THUMB_VERSION}|${path}|${size}|${lastModified}`;
}

export async function loadThumbnail(key: string): Promise<ThumbnailRecord | null> {
  try {
    const rec = await getDB().thumbnails.get(key);
    return rec ?? null;
  } catch {
    return null;
  }
}

export async function saveThumbnail(
  key: string,
  result: ThumbnailResult,
): Promise<void> {
  try {
    await getDB().thumbnails.put({
      id: key,
      blob: result.blob,
      createdAt: Date.now(),
      colorTags: result.colorTags,
      width: result.width,
      height: result.height,
    });
  } catch {
    /* quota or clone error — skip silently */
  }
}

export async function clearThumbnails(): Promise<void> {
  try {
    await getDB().thumbnails.clear();
  } catch {
    /* ignore */
  }
}

export function deriveDimensionTags(width: number, height: number): string[] {
  const tags: string[] = [];
  const ratio = width / height;
  if (ratio >= 0.9 && ratio <= 1.1) tags.push("Square");
  else if (ratio > 1.5) tags.push("Wide");
  else if (ratio < 0.67) tags.push("Tall");
  const longest = Math.max(width, height);
  if (longest >= 4000) tags.push("Large");
  return tags;
}

export async function generateThumbnail(file: File): Promise<ThumbnailResult | null> {
  if (file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) {
    return null;
  }

  if (typeof createImageBitmap !== "function") return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  try {
    const origW = bitmap.width;
    const origH = bitmap.height;
    const shortest = Math.min(origW, origH);
    const longest = Math.max(origW, origH);

    if (shortest <= THUMBNAIL_MIN_SIDE) {
      return null;
    }

    // Scale so the short side is at least THUMBNAIL_MIN_SIDE
    // but the long side doesn't exceed THUMBNAIL_MAX_LONG
    const ratioByShort = THUMBNAIL_MIN_SIDE / shortest;
    const ratioByLong = THUMBNAIL_MAX_LONG / longest;
    const ratio = Math.min(ratioByShort, ratioByLong);

    const w = Math.max(1, Math.round(origW * ratio));
    const h = Math.max(1, Math.round(origH * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, w, h);

    const colorTags = analyzeColors(canvas);

    let blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", THUMBNAIL_QUALITY);
    });

    if (!blob) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", THUMBNAIL_QUALITY);
      });
    }

    if (!blob) return null;

    return { blob, colorTags, width: origW, height: origH };
  } finally {
    bitmap.close();
  }
}
