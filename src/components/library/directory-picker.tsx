"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, Loader2, FolderOpen, RotateCw } from "lucide-react";
import { detectPickerCapability } from "@/lib/library/browser-capabilities";
import {
  scanFromFileList,
  scanWithFileSystemAPI,
} from "@/lib/library/fs-adapter";
import type {
  PickerCapability,
  ScanResult,
} from "@/lib/library/types";
import { Modal } from "./modal";

type SavedLibraryHint = {
  rootName: string;
};

type Props = {
  onPicked: (result: ScanResult) => void;
  savedLibrary?: SavedLibraryHint | null;
  onReopen?: () => void | Promise<void>;
  defaultRecursive?: boolean;
};

type Status =
  | { phase: "idle" }
  | { phase: "scanning"; count: number }
  | { phase: "reopening" }
  | { phase: "error"; message: string };

export function DirectoryPicker({
  onPicked,
  savedLibrary,
  onReopen,
  defaultRecursive = true,
}: Props) {
  const [capability, setCapability] = useState<PickerCapability>("none");
  const [recursive, setRecursive] = useState(defaultRecursive);
  const [status, setStatus] = useState<Status>({ phase: "idle" });
  const [preflight, setPreflight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCapability(detectPickerCapability());
  }, []);

  const runFsAccess = async () => {
    try {
      const handle = await (
        window as unknown as {
          showDirectoryPicker: (opts?: {
            mode?: "read" | "readwrite";
          }) => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker({ mode: "read" });

      setStatus({ phase: "scanning", count: 0 });
      const result = await scanWithFileSystemAPI(handle, {
        recursive,
        onProgress: (count) => setStatus({ phase: "scanning", count }),
      });
      setStatus({ phase: "idle" });
      onPicked(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus({ phase: "idle" });
        return;
      }
      setStatus({
        phase: "error",
        message: err instanceof Error ? err.message : "Failed to open folder",
      });
    }
  };

  const runFallback = () => {
    fileInputRef.current?.click();
  };

  const handleContinue = () => {
    setPreflight(false);
    if (capability === "fs-access") void runFsAccess();
    else if (capability === "webkit-directory") runFallback();
  };

  const handleReopen = async () => {
    if (!onReopen) return;
    setStatus({ phase: "reopening" });
    try {
      await onReopen();
      setStatus({ phase: "idle" });
    } catch (err) {
      setStatus({
        phase: "error",
        message: err instanceof Error ? err.message : "Failed to reopen",
      });
    }
  };

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStatus({ phase: "scanning", count: 0 });
    try {
      const result = scanFromFileList(files, {
        recursive,
        onProgress: (count) => setStatus({ phase: "scanning", count }),
      });
      setStatus({ phase: "idle" });
      onPicked(result);
    } catch (err) {
      setStatus({
        phase: "error",
        message: err instanceof Error ? err.message : "Failed to read folder",
      });
    } finally {
      e.target.value = "";
    }
  };

  const isScanning = status.phase === "scanning";
  const isReopening = status.phase === "reopening";
  const isBusy = isScanning || isReopening;
  const canPick =
    capability === "fs-access" || capability === "webkit-directory";
  const showReopen = Boolean(savedLibrary && onReopen);

  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-neutral-500">
          <Compass size={28} strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 text-xl font-semibold tracking-tight text-neutral-100">
          {isScanning
            ? "Scanning folder…"
            : isReopening
              ? "Reopening…"
              : showReopen
                ? "Welcome back"
                : "Pick a folder to begin"}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-neutral-400">
          {isScanning
            ? `Indexed ${status.count.toLocaleString()} ${status.count === 1 ? "entry" : "entries"}.`
            : isReopening
              ? "Reconnecting to your folder…"
              : "Your files stay on this device — nothing is uploaded."}
        </p>

        {!isBusy && (
          <>
            {showReopen ? (
              <div className="flex w-full flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleReopen}
                  className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors duration-[120ms] hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <RotateCw size={15} strokeWidth={1.8} />
                  Reopen &ldquo;{savedLibrary!.rootName}&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() => setPreflight(true)}
                  className="text-xs text-neutral-400 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-200 hover:decoration-white/60"
                >
                  Choose a different folder
                </button>
              </div>
            ) : (
              <>
                <label className="mb-6 flex items-center gap-2 text-sm text-neutral-300 select-none">
                  <input
                    type="checkbox"
                    checked={recursive}
                    onChange={(e) => setRecursive(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-white focus:ring-1 focus:ring-white/30 focus:ring-offset-0"
                  />
                  Include subfolders
                </label>

                {canPick && (
                  <button
                    type="button"
                    onClick={() => setPreflight(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors duration-[120ms] hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <FolderOpen size={16} strokeWidth={1.8} />
                    Choose folder
                  </button>
                )}

                {capability === "none" && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
                    This browser doesn&apos;t support folder picking. Try
                    Chrome, Edge, Brave, or a recent Firefox/Safari.
                  </div>
                )}
              </>
            )}

            {capability === "webkit-directory" && (
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFallbackChange}
                className="hidden"
                {...({
                  webkitdirectory: "",
                  directory: "",
                } as React.InputHTMLAttributes<HTMLInputElement>)}
              />
            )}
          </>
        )}

        {isBusy && (
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <Loader2 size={16} className="animate-spin" strokeWidth={1.8} />
            Working…
          </div>
        )}

        {status.phase === "error" && (
          <div className="mt-6 rounded-lg border border-[#E86F6F]/30 bg-[#E86F6F]/10 px-4 py-3 text-sm text-[#E86F6F]">
            {status.message}
          </div>
        )}
      </div>

      <Modal
        open={preflight}
        onClose={() => setPreflight(false)}
        title="Open folder"
        primaryAction={{ label: "Continue", onClick: handleContinue }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setPreflight(false),
        }}
      >
        <p className="mb-3 text-neutral-200">
          Your library reads files locally in your browser. Nothing uploads and
          nothing leaves your device.
        </p>
        {capability === "fs-access" ? (
          <p className="text-neutral-400">
            Next, your browser will ask for permission to view this folder.
            Approve it to continue.
          </p>
        ) : (
          <p className="text-neutral-400">
            Next, your browser will show a{" "}
            <span className="text-neutral-200">“Confirm upload”</span> prompt.
            Despite the wording, nothing is uploaded — it&apos;s how Firefox
            and Safari label folder access.
          </p>
        )}
      </Modal>
    </div>
  );
}
