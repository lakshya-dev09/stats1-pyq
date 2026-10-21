/** Papers split from user-uploaded PDFs, kept in this browser's IndexedDB. */

export interface Crop {
  blob: Blob;
  /** Size in CSS pixels (the crop is rendered at 2x). */
  w: number;
  h: number;
}

export interface UploadQuestion {
  n: number;
  type: 'MCQ' | 'MSQ' | 'NAT';
  marks: number;
  /** Index into UploadPaper.contexts for comprehension questions. */
  ctx?: number;
  stem?: Crop;
  options?: Crop[];
  /** 0-based correct options, when the key could be read from the PDF colours. */
  correct?: number[];
  answer?: number | { min: number; max: number } | string;
}

export interface UploadPaper {
  id: string;
  name: string;
  subject: string;
  created: number;
  contexts: Crop[];
  questions: UploadQuestion[];
}

/** Also kept in memory so a paper stays usable this session even if IndexedDB is unavailable. */
const memory = new Map<string, UploadPaper>();

const DB = 'stats1-pyq-uploads';
const STORE = 'papers';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listUploads(): Promise<UploadPaper[]> {
  try {
    const all = await run<UploadPaper[]>('readonly', (s) => s.getAll());
    for (const p of all) memory.set(p.id, p);
  } catch {
    /* storage unavailable: fall back to this session's papers */
  }
  return [...memory.values()].sort((a, b) => b.created - a.created);
}

export async function getUpload(id: string): Promise<UploadPaper | undefined> {
  if (memory.has(id)) return memory.get(id);
  try {
    return await run<UploadPaper | undefined>('readonly', (s) => s.get(id));
  } catch {
    return undefined;
  }
}

/** Returns false when the browser refuses storage (private mode, quota). */
export async function saveUpload(p: UploadPaper): Promise<boolean> {
  memory.set(p.id, p);
  try {
    await run('readwrite', (s) => s.put(p));
    return true;
  } catch {
    return false;
  }
}

export async function deleteUpload(id: string): Promise<void> {
  memory.delete(id);
  try {
    await run('readwrite', (s) => s.delete(id));
  } catch {
    /* storage unavailable */
  }
}
