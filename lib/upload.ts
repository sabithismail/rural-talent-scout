import { supabase } from "./supabase";

export type QueuedUpload = {
  id?: number;
  userId: string;
  sportId: number;
  notes: string;
  reportedValue: number | null;
  name: string;
  type: string;
  blob: Blob;
};

const DB_NAME = "rural-talent-scout";
const STORE = "uploads";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const enqueue = (item: QueuedUpload) => tx("readwrite", (s) => s.add(item));
export const listQueue = () => tx<QueuedUpload[]>("readonly", (s) => s.getAll());
export const removeFromQueue = (id: number) => tx("readwrite", (s) => s.delete(id));

export function isNetworkError(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? e).toLowerCase();
  return !navigator.onLine || msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
}

/** Uploads the video to storage, then creates the submission row. Throws on failure. */
export async function uploadSubmission(u: Omit<QueuedUpload, "id">) {
  const ext = (u.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${u.userId}/${u.sportId}-${Date.now()}.${ext}`;
  const up = await supabase.storage.from("videos").upload(path, u.blob, { contentType: u.type || "video/mp4" });
  if (up.error) throw up.error;
  const ins = await supabase
    .from("submissions")
    .insert({
      player_id: u.userId,
      sport_id: u.sportId,
      video_path: path,
      notes: u.notes || null,
      reported_value: u.reportedValue,
    });
  if (ins.error) {
    await supabase.storage.from("videos").remove([path]);
    throw ins.error;
  }
}

/** Tries every queued upload; keeps the ones that still fail because of the network. */
export async function flushQueue(currentUserId: string): Promise<number> {
  const items = await listQueue();
  let done = 0;
  for (const it of items) {
    if (it.userId !== currentUserId) continue;
    try {
      await uploadSubmission(it);
      await removeFromQueue(it.id!);
      done++;
    } catch (e) {
      if (isNetworkError(e)) break;
      await removeFromQueue(it.id!); // permanent failure (e.g. rejected file), don't retry forever
    }
  }
  return done;
}
