import { detectFileKind } from "./file-kinds";
import type { LibraryEntry, ScanOptions, ScanResult } from "./types";

type DirEntries = AsyncIterable<
  [string, FileSystemFileHandle | FileSystemDirectoryHandle]
>;

export async function scanWithFileSystemAPI(
  rootHandle: FileSystemDirectoryHandle,
  options: ScanOptions,
): Promise<ScanResult> {
  const entries: LibraryEntry[] = [];
  await walkHandle(rootHandle, "", entries, options);
  return { rootName: rootHandle.name, entries, rootHandle };
}

async function walkHandle(
  dir: FileSystemDirectoryHandle,
  prefix: string,
  out: LibraryEntry[],
  options: ScanOptions,
): Promise<void> {
  const iter = (dir as unknown as { entries(): DirEntries }).entries();
  for await (const [name, handle] of iter) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === "directory") {
      out.push({
        path,
        name,
        kind: "directory",
        handle: handle as FileSystemDirectoryHandle,
      });
      options.onProgress?.(out.length);
      if (options.recursive) {
        await walkHandle(
          handle as FileSystemDirectoryHandle,
          path,
          out,
          options,
        );
      }
    } else {
      out.push({
        path,
        name,
        kind: "file",
        fileKind: detectFileKind(name),
        handle: handle as FileSystemFileHandle,
      });
      options.onProgress?.(out.length);
    }
  }
}

export function scanFromFileList(
  files: FileList,
  options: ScanOptions,
): ScanResult {
  const entries: LibraryEntry[] = [];
  const seenDirs = new Set<string>();
  let rootName = "";

  for (const file of Array.from(files)) {
    const rel = (file as File & { webkitRelativePath?: string })
      .webkitRelativePath;
    if (!rel) continue;
    const parts = rel.split("/");
    if (!rootName) rootName = parts[0];

    // In non-recursive mode, only keep entries directly under the root.
    if (!options.recursive && parts.length > 2) continue;

    // Synthesize intermediate directory entries (FileList only emits files).
    for (let i = 1; i < parts.length - 1; i++) {
      const dirPath = parts.slice(1, i + 1).join("/");
      if (!seenDirs.has(dirPath)) {
        seenDirs.add(dirPath);
        entries.push({
          path: dirPath,
          name: parts[i],
          kind: "directory",
        });
      }
    }

    const filePath = parts.slice(1).join("/");
    entries.push({
      path: filePath,
      name: parts[parts.length - 1],
      kind: "file",
      fileKind: detectFileKind(parts[parts.length - 1]),
      file,
      size: file.size,
      lastModified: file.lastModified,
    });
    options.onProgress?.(entries.length);
  }

  return { rootName, entries };
}

export async function resolveFile(entry: LibraryEntry): Promise<File | null> {
  if (entry.file) return entry.file;
  if (entry.handle && entry.handle.kind === "file") {
    return await (entry.handle as FileSystemFileHandle).getFile();
  }
  return null;
}
