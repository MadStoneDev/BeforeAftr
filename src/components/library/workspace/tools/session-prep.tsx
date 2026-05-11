"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Plus, Trash2, X } from "lucide-react";
import {
  getSessions,
  createSession,
  deleteSession,
  getSessionItems,
  addSessionItem,
  removeSessionItem,
  updateSessionNotes,
  type SessionRecord,
  type SessionItemRecord,
} from "@/lib/library/sessions";

type Props = {
  selectedPath: string | null;
  selectedName: string | null;
  isImage: boolean;
  onPresent?: (paths: string[]) => void;
};

export function SessionPrep({
  selectedPath,
  selectedName,
  isImage,
  onPresent,
}: Props) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<SessionItemRecord[]>([]);
  const [notes, setNotes] = useState("");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setItems([]);
      setNotes("");
      return;
    }
    getSessionItems(activeSessionId).then(setItems);
    const session = sessions.find((s) => s.id === activeSessionId);
    setNotes(session?.notes ?? "");
  }, [activeSessionId, sessions]);

  const handleCreate = useCallback(async () => {
    const name = prompt("Session name:");
    if (!name?.trim()) return;
    const id = await createSession(name.trim());
    const updated = await getSessions();
    setSessions(updated);
    setActiveSessionId(id);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!activeSessionId) return;
    await deleteSession(activeSessionId);
    setActiveSessionId(null);
    setSessions(await getSessions());
  }, [activeSessionId]);

  const handleAdd = useCallback(async () => {
    if (!activeSessionId || !selectedPath) return;
    await addSessionItem(activeSessionId, selectedPath);
    setItems(await getSessionItems(activeSessionId));
  }, [activeSessionId, selectedPath]);

  const handleRemove = useCallback(
    async (path: string) => {
      if (!activeSessionId) return;
      await removeSessionItem(activeSessionId, path);
      setItems(await getSessionItems(activeSessionId));
    },
    [activeSessionId],
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (!activeSessionId) return;
      if (notesTimer.current) clearTimeout(notesTimer.current);
      notesTimer.current = setTimeout(() => {
        void updateSessionNotes(activeSessionId, value);
      }, 500);
    },
    [activeSessionId],
  );

  const alreadyAdded =
    selectedPath != null && items.some((i) => i.path === selectedPath);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <select
          value={activeSessionId ?? ""}
          onChange={(e) =>
            setActiveSessionId(e.target.value || null)
          }
          className="h-7 min-w-0 flex-1 appearance-none truncate rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[11px] text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="">Select session…</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleCreate}
          title="New session"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
        >
          <Plus size={14} strokeWidth={1.8} />
        </button>
      </div>

      {activeSessionId && (
        <>
          {items.length > 0 ? (
            <div className="flex flex-col gap-1">
              {items.map((item, i) => (
                <div
                  key={item.path}
                  className="group flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2 py-1"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-bold text-neutral-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-300">
                    {item.path.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.path)}
                    className="flex h-4 w-4 items-center justify-center rounded text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-neutral-600">
              No maps added yet. Select an image and click Add.
            </p>
          )}

          {isImage && selectedPath && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={alreadyAdded}
              className={`flex h-7 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-colors ${
                alreadyAdded
                  ? "bg-white/[0.04] text-neutral-600 cursor-default"
                  : "bg-white/[0.06] text-neutral-300 hover:bg-white/[0.10] hover:text-neutral-100"
              }`}
            >
              <Plus size={12} strokeWidth={1.8} />
              {alreadyAdded ? "Already added" : `Add "${selectedName}"`}
            </button>
          )}

          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Session notes…"
            rows={3}
            className="resize-none rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-white/15 focus:outline-none"
          />

          <div className="flex items-center gap-1.5">
            {items.length > 0 && onPresent && (
              <button
                type="button"
                onClick={() => onPresent(items.map((i) => i.path))}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-white/[0.08] text-[11px] font-medium text-neutral-200 transition-colors hover:bg-white/[0.12]"
              >
                <Play size={11} strokeWidth={2} />
                Present
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              title="Delete session"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={12} strokeWidth={1.8} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
