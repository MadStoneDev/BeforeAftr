type ColorCategory = {
  name: string;
  match: (h: number, s: number, l: number) => boolean;
};

const CATEGORIES: ColorCategory[] = [
  { name: "Black", match: (_h, _s, l) => l < 15 },
  { name: "White", match: (_h, s, l) => s < 15 && l > 75 },
  { name: "Gray", match: (_h, s, l) => s < 15 && l >= 15 && l <= 75 },
  { name: "Red", match: (h, s) => s > 40 && (h <= 20 || h >= 340) },
  { name: "Brown", match: (h, s) => h > 20 && h <= 45 && s > 20 },
  { name: "Gold", match: (h, s) => h > 40 && h <= 55 && s > 30 },
  { name: "Green", match: (h, s) => h > 80 && h <= 170 && s > 25 },
  { name: "Blue", match: (h, s) => h > 190 && h <= 250 && s > 30 },
  { name: "Purple", match: (h, s) => h > 260 && h <= 320 && s > 30 },
];

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

export function analyzeColors(canvas: HTMLCanvasElement): string[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const counts = new Map<string, number>();

  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a < 128) continue;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    for (const cat of CATEGORIES) {
      if (cat.match(h, s, l)) {
        counts.set(cat.name, (counts.get(cat.name) ?? 0) + 1);
        break;
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}
