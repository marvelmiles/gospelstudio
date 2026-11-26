/* Saves to the browser database when it can, then to this tab only, then to memory as a last resort. */
type LibraryStoreName =
  | "manuscripts"
  | "scriptures"
  | "media"
  | "backgrounds"
  | "themes"
  | "audio"
  | "prefs"
  | "files";
type StudioStoreName = "productions" | "sceneLayouts";
type SyncStoreName = "syncChanges";
type AccountStoreName = "credentials";
export type StoreName =
  LibraryStoreName | StudioStoreName | SyncStoreName | AccountStoreName;
export type Backend = "indexeddb" | "session" | "memory";

interface HasId {
  id: string;
}

interface DatabaseSchema {
  name: string;
  stores: StoreName[];
}

export interface WriteOptions {
  tracked?: boolean;
}

export interface RecordChange {
  store: StoreName;
  ids: string[];
}

type RecordChangeListener = (change: RecordChange) => Promise<void>;

const DB_VERSION = 1;
const LIBRARY_DATABASE: DatabaseSchema = {
  name: "gospelstudio",
  stores: [
    "manuscripts",
    "scriptures",
    "media",
    "backgrounds",
    "themes",
    "audio",
    "prefs",
    "files",
  ],
};
/* The studio, sync and account stores each keep their own database so they exist on devices whose library database was created before them. */
const STUDIO_DATABASE: DatabaseSchema = {
  name: "gospelstudio-studio",
  stores: ["productions", "sceneLayouts"],
};
const SYNC_DATABASE: DatabaseSchema = {
  name: "gospelstudio-sync",
  stores: ["syncChanges"],
};
const ACCOUNT_DATABASE: DatabaseSchema = {
  name: "gospelstudio-account",
  stores: ["credentials"],
};
const DATABASES: DatabaseSchema[] = [
  LIBRARY_DATABASE,
  STUDIO_DATABASE,
  SYNC_DATABASE,
  ACCOUNT_DATABASE,
];
const STORES: StoreName[] = DATABASES.flatMap((database) => database.stores);
const DEVICE_DATA_STORES: StoreName[] = STORES.filter(
  (store) => !ACCOUNT_DATABASE.stores.includes(store),
);

const SESSION_SKIP: ReadonlySet<StoreName> = new Set(["files"]);
const SESSION_PREFIX = "gospelstudio:";
const MB = 1024 * 1024;

export const storageState: { backend: Backend | null; memFallback: boolean } = {
  backend: null,
  memFallback: false,
};

const mem = Object.fromEntries(
  STORES.map((store) => [store, new Map<string, unknown>()]),
) as Record<StoreName, Map<string, unknown>>;

const connections = new Map<StoreName, IDBDatabase>();
let initPromise: Promise<Backend> | null = null;
let recordChangeListener: RecordChangeListener | null = null;

const connectionOf = (store: StoreName): IDBDatabase | null =>
  connections.get(store) ?? null;

export const onRecordsChanged = (
  listener: RecordChangeListener | null,
): void => {
  recordChangeListener = listener;
};

const reportChange = async (
  store: StoreName,
  ids: string[],
  options: WriteOptions,
): Promise<void> => {
  if (options.tracked === false || !recordChangeListener || ids.length === 0)
    return;
  try {
    await recordChangeListener({ store, ids });
  } catch {}
};

const openIDB = (schema: DatabaseSchema): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(schema.name, DB_VERSION);
      req.onupgradeneeded = () => {
        for (const store of schema.stores)
          req.result.createObjectStore(store, { keyPath: "id" });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          window.location.reload();
        };
        resolve(db);
      };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export const hasIncompatibleDatabase = async (): Promise<boolean> => {
  try {
    const databases = await indexedDB.databases();
    const names = new Set(DATABASES.map((schema) => schema.name));
    return databases.some(
      (database) =>
        names.has(database.name ?? "") && (database.version ?? 0) > DB_VERSION,
    );
  } catch {
    return false;
  }
};

const sessionAvailable = (): boolean => {
  try {
    if (typeof sessionStorage === "undefined") return false;
    const k = "__gospelstudio_probe__";
    sessionStorage.setItem(k, "1");
    sessionStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
};

const loadSessionIntoMem = () => {
  for (const store of STORES) {
    if (SESSION_SKIP.has(store)) continue;
    try {
      const raw = sessionStorage.getItem(SESSION_PREFIX + store);
      if (!raw) continue;
      const rows = JSON.parse(raw) as HasId[];
      mem[store].clear();
      for (const row of rows) mem[store].set(row.id, row);
    } catch {}
  }
};

const persistSession = (store: StoreName) => {
  if (SESSION_SKIP.has(store)) return;
  try {
    sessionStorage.setItem(
      SESSION_PREFIX + store,
      JSON.stringify(Array.from(mem[store].values())),
    );
  } catch {}
};

const init = (): Promise<Backend> => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const opened = await Promise.all(DATABASES.map(openIDB));
    if (opened.every(Boolean)) {
      DATABASES.forEach((schema, index) => {
        const database = opened[index];
        if (!database) return;
        for (const store of schema.stores) connections.set(store, database);
      });
      storageState.backend = "indexeddb";
      storageState.memFallback = false;
      try {
        void navigator.storage?.persist?.();
      } catch {}
      return "indexeddb";
    }
    for (const database of opened) database?.close();
    if (sessionAvailable()) {
      storageState.backend = "session";
      storageState.memFallback = false;
      loadSessionIntoMem();
      return "session";
    }
    storageState.backend = "memory";
    storageState.memFallback = true;
    return "memory";
  })();
  return initPromise;
};

export const readAllRecords = async <T extends HasId>(
  store: StoreName,
): Promise<T[]> => {
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(store, "readonly");
        const r = tx.objectStore(store).getAll();
        r.onsuccess = () => resolve((r.result || []) as T[]);
        r.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }
  return Array.from(mem[store].values()) as T[];
};

export const readAllKeys = async (store: StoreName): Promise<string[]> => {
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(store, "readonly");
        const r = tx.objectStore(store).getAllKeys();
        r.onsuccess = () =>
          resolve(
            (r.result || []).filter(
              (key): key is string => typeof key === "string",
            ),
          );
        r.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }
  return Array.from(mem[store].keys());
};

export const readRecord = async <T extends HasId>(
  store: StoreName,
  id: string,
): Promise<T | undefined> => {
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(store, "readonly");
        const r = tx.objectStore(store).get(id);
        r.onsuccess = () => resolve((r.result as T) || undefined);
        r.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });
  }
  return mem[store].get(id) as T | undefined;
};

const putRecord = async <T extends HasId>(
  store: StoreName,
  val: T,
): Promise<void> => {
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    return new Promise((resolve, reject) => {
      try {
        const tx = idb.transaction(store, "readwrite");
        tx.objectStore(store).put(val);
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
          reject(tx.error || new Error("IndexedDB write failed"));
        tx.onabort = () =>
          reject(tx.error || new Error("IndexedDB transaction aborted"));
      } catch (err) {
        reject(err);
      }
    });
  }
  mem[store].set(val.id, val);
  if (backend === "session") persistSession(store);
};

export const saveRecord = async <T extends HasId>(
  store: StoreName,
  val: T,
  options: WriteOptions = {},
): Promise<void> => {
  try {
    await saveRecordStrict(store, val, options);
  } catch {}
};

export const saveRecordStrict = async <T extends HasId>(
  store: StoreName,
  val: T,
  options: WriteOptions = {},
): Promise<void> => {
  await putRecord(store, val);
  await reportChange(store, [val.id], options);
};

const putRecords = async <T extends HasId>(
  store: StoreName,
  values: T[],
): Promise<boolean> => {
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(store, "readwrite");
        const target = tx.objectStore(store);
        for (const value of values) target.put(value);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }
  for (const value of values) mem[store].set(value.id, value);
  if (backend === "session") persistSession(store);
  return true;
};

export const saveRecords = async <T extends HasId>(
  store: StoreName,
  values: T[],
  options: WriteOptions = {},
): Promise<void> => {
  if (!values.length) return;
  if (await putRecords(store, values))
    await reportChange(
      store,
      values.map((value) => value.id),
      options,
    );
};

export const deleteRecord = async (
  store: StoreName,
  id: string,
  options: WriteOptions = {},
): Promise<void> => {
  const backend = await init();
  mem[store].delete(id);
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    await new Promise<void>((resolve) => {
      try {
        const tx = idb.transaction(store, "readwrite");
        tx.objectStore(store).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else if (backend === "session") persistSession(store);
  await reportChange(store, [id], options);
};

export const deleteMatchingRecords = async <T extends HasId>(
  store: StoreName,
  ids: readonly string[],
  matches: (record: T) => boolean,
): Promise<void> => {
  if (!ids.length) return;
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(store, "readwrite");
        const target = tx.objectStore(store);
        for (const id of ids) {
          const request = target.get(id);
          request.onsuccess = () => {
            const record = request.result as T | undefined;
            if (record && matches(record)) target.delete(id);
          };
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  for (const id of ids) {
    const record = mem[store].get(id) as T | undefined;
    if (record && matches(record)) mem[store].delete(id);
  }
  if (backend === "session") persistSession(store);
};

export const clearStore = async (
  store: StoreName,
  options: WriteOptions = {},
): Promise<void> => {
  const clearedIds =
    options.tracked !== false && recordChangeListener
      ? await readAllKeys(store)
      : [];
  mem[store].clear();
  const backend = await init();
  const idb = connectionOf(store);
  if (backend === "indexeddb" && idb) {
    await new Promise<void>((resolve) => {
      try {
        const tx = idb.transaction(store, "readwrite");
        tx.objectStore(store).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else if (backend === "session") {
    try {
      sessionStorage.removeItem(SESSION_PREFIX + store);
    } catch {}
  }
  await reportChange(store, clearedIds, options);
};

export const wipeAllStores = async (): Promise<void> => {
  for (const store of DEVICE_DATA_STORES)
    await clearStore(store, { tracked: false });
};

const sessionUsageBytes = (): number => {
  let bytes = 0;
  try {
    for (const store of STORES) {
      const v = sessionStorage.getItem(SESSION_PREFIX + store);
      if (v) bytes += (v.length + (SESSION_PREFIX + store).length) * 2;
    }
  } catch {}
  return bytes;
};

const memUsageBytes = (): number => {
  let bytes = 0;
  for (const store of STORES) {
    try {
      bytes += JSON.stringify(Array.from(mem[store].values())).length * 2;
    } catch {}
  }
  return bytes;
};

export interface QuotaEstimate {
  quota: number;
  usage: number;
  fromEstimate: boolean;
}

export const estimateQuota = async (): Promise<QuotaEstimate> => {
  const backend = await init();
  if (backend === "indexeddb") {
    try {
      if (
        navigator.storage &&
        typeof navigator.storage.estimate === "function"
      ) {
        const e = await navigator.storage.estimate();
        if (e.quota)
          return { quota: e.quota, usage: e.usage || 0, fromEstimate: true };
      }
    } catch {}
    return { quota: 250 * MB, usage: 0, fromEstimate: false };
  }
  if (backend === "session") {
    return { quota: 5 * MB, usage: sessionUsageBytes(), fromEstimate: false };
  }
  return { quota: 100 * MB, usage: memUsageBytes(), fromEstimate: false };
};
