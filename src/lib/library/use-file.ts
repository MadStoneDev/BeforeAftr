"use client";

import { useEffect, useState } from "react";
import { resolveFile } from "./fs-adapter";
import type { LibraryNode } from "./types";

type ObjectUrlState = {
  url: string | null;
  error: string | null;
  loading: boolean;
};

type TextState = {
  text: string | null;
  error: string | null;
  loading: boolean;
};

type BufferState = {
  buffer: ArrayBuffer | null;
  error: string | null;
  loading: boolean;
};

export function useObjectUrl(node: LibraryNode | null): ObjectUrlState {
  const [state, setState] = useState<ObjectUrlState>({
    url: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!node || node.kind !== "file") {
      setState({ url: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setState({ url: null, error: null, loading: true });

    resolveFile(node.entry)
      .then((file) => {
        if (cancelled) return;
        if (!file) {
          setState({ url: null, error: "File not found", loading: false });
          return;
        }
        createdUrl = URL.createObjectURL(file);
        setState({ url: createdUrl, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          url: null,
          error: err instanceof Error ? err.message : "Failed to load file",
          loading: false,
        });
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [node]);

  return state;
}

export function useFileText(
  node: LibraryNode | null,
  options?: { maxBytes?: number },
): TextState {
  const maxBytes = options?.maxBytes;
  const [state, setState] = useState<TextState>({
    text: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!node || node.kind !== "file") {
      setState({ text: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    setState({ text: null, error: null, loading: true });

    (async () => {
      try {
        const file = await resolveFile(node.entry);
        if (cancelled) return;
        if (!file) {
          setState({ text: null, error: "File not found", loading: false });
          return;
        }
        if (maxBytes !== undefined && file.size > maxBytes) {
          setState({
            text: null,
            error: `File is too large to preview (${formatBytes(file.size)} — limit ${formatBytes(maxBytes)}).`,
            loading: false,
          });
          return;
        }
        const text = await file.text();
        if (cancelled) return;
        setState({ text, error: null, loading: false });
      } catch (err) {
        if (cancelled) return;
        setState({
          text: null,
          error: err instanceof Error ? err.message : "Failed to read file",
          loading: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [node, maxBytes]);

  return state;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function useFileBuffer(node: LibraryNode | null): BufferState {
  const [state, setState] = useState<BufferState>({
    buffer: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!node || node.kind !== "file") {
      setState({ buffer: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    setState({ buffer: null, error: null, loading: true });

    (async () => {
      try {
        const file = await resolveFile(node.entry);
        if (cancelled) return;
        if (!file) {
          setState({ buffer: null, error: "File not found", loading: false });
          return;
        }
        const buffer = await file.arrayBuffer();
        if (cancelled) return;
        setState({ buffer, error: null, loading: false });
      } catch (err) {
        if (cancelled) return;
        setState({
          buffer: null,
          error: err instanceof Error ? err.message : "Failed to read file",
          loading: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [node]);

  return state;
}
