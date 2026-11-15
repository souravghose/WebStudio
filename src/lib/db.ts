import type { Project } from '../types';

const DB_NAME = 'webstudio';
const DB_VERSION = 1;
const STORE = 'projects';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export const db = {
  all: () => run<Project[]>('readonly', (s) => s.getAll() as IDBRequest<Project[]>),
  get: (id: string) => run<Project | undefined>('readonly', (s) => s.get(id) as IDBRequest<Project | undefined>),
  put: (project: Project) => run<IDBValidKey>('readwrite', (s) => s.put(project)),
  remove: (id: string) => run<undefined>('readwrite', (s) => s.delete(id) as IDBRequest<undefined>),
  clear: () => run<undefined>('readwrite', (s) => s.clear() as IDBRequest<undefined>),
};
