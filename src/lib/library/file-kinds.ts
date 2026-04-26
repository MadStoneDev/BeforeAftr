import type { FileKind } from "./types";

const EXT_TO_KIND: Record<string, FileKind> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  svg: "image",
  tif: "image",
  tiff: "image",
  pdf: "pdf",
  md: "markdown",
  markdown: "markdown",
  mdx: "markdown",
  doc: "doc",
  docx: "doc",
  odt: "doc",
  rtf: "doc",
  txt: "text",
  json: "text",
  csv: "text",
  log: "text",
};

export function detectFileKind(name: string): FileKind {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "other";
  const ext = name.slice(dot + 1).toLowerCase();
  return EXT_TO_KIND[ext] ?? "other";
}
