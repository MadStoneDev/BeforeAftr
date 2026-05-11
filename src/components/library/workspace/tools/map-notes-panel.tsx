"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Plus } from "lucide-react";
import {
  getMapNote,
  saveMapNote,
  addUsage,
  type MapNoteRecord,
} from "@/lib/library/map-notes";

type Props = {
  path: string | null;
  name: string | null;
};

export function MapNotesPanel({ path, name }: Props) {
  const [note, setNote] = useState<MapNoteRecord | null>(null);
  const [text, setText] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!path) {
      setNote(null);
      setText("");
      return;
    }
    getMapNote(path).then((n) => {
      setNote(n);
      setText(n?.notes ?? "");
    });
  }, [path]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (!path) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveMapNote(path, { notes: value });
      }, 500);
    },
    [path],
  );

  const handleMarkUsed = useCallback(async () => {
    if (!path) return;
    const sessionName = prompt("Session name (optional):");
    await addUsage(path, sessionName || undefined);
    setNote(await getMapNote(path));
  }, [path]);

  if (!path) {
    return (
      <p className="text-[10px] text-neutral-600">
        Select an image to add notes.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={`Notes about ${name ?? "this map"}…`}
        rows={4}
        className="resize-none rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-white/15 focus:outline-none"
      />

      <button
        type="button"
        onClick={handleMarkUsed}
        className="flex h-7 items-center justify-center gap-1.5 rounded-md bg-white/[0.06] text-[11px] font-medium text-neutral-400 transition-colors hover:bg-white/[0.10] hover:text-neutral-200"
      >
        <Plus size={11} strokeWidth={2} />
        Mark as Used
      </button>

      {note && note.usages.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Usage History
          </span>
          {note.usages
            .slice()
            .reverse()
            .slice(0, 5)
            .map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[10px] text-neutral-500"
              >
                <Clock size={9} strokeWidth={2} />
                <span>
                  {new Date(u.date).toLocaleDateString()}
                  {u.sessionName && ` · ${u.sessionName}`}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
