export type FileKind =
  | "image"
  | "pdf"
  | "markdown"
  | "doc"
  | "text"
  | "other";

export type LibraryEntry = {
  path: string;
  name: string;
  kind: "file" | "directory";
  fileKind?: FileKind;
  size?: number;
  lastModified?: number;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  file?: File;
};

export type LibraryNode = {
  path: string;
  name: string;
  kind: "file" | "directory";
  fileKind?: FileKind;
  children?: LibraryNode[];
  entry: LibraryEntry;
  tags: string[];
};

export type ScanOptions = {
  recursive: boolean;
  onProgress?: (count: number) => void;
};

export type ScanSource =
  | { kind: "fs-access"; rootHandle: FileSystemDirectoryHandle }
  | { kind: "webkit-directory"; files: FileList };

export type ScanResult = {
  rootName: string;
  entries: LibraryEntry[];
  rootHandle?: FileSystemDirectoryHandle;
};

export type PickerCapability = "fs-access" | "webkit-directory" | "none";
