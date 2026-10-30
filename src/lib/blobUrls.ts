import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";
import { getFileBlob, thumbId } from "./fileStore";

interface UrlEntry {
  url: string | null;
  refs: number;
  loading: Promise<string | null> | null;
  releaseTimer: number | null;
}

const entries = new Map<string, UrlEntry>();
const RELEASE_GRACE_MS = 4000;

const entryFor = (id: string): UrlEntry => {
  let entry = entries.get(id);
  if (!entry) {
    entry = { url: null, refs: 0, loading: null, releaseTimer: null };
    entries.set(id, entry);
  }
  return entry;
};

const acquireBlobUrl = (id: string): Promise<string | null> => {
  const entry = entryFor(id);
  entry.refs += 1;
  if (entry.releaseTimer !== null) {
    window.clearTimeout(entry.releaseTimer);
    entry.releaseTimer = null;
  }
  if (entry.url) return Promise.resolve(entry.url);
  if (entry.loading) return entry.loading;
  entry.loading = getFileBlob(id)
    .then((blob) => {
      entry.loading = null;
      if (!blob) return null;
      if (entry.refs <= 0) return null;
      entry.url = URL.createObjectURL(blob);
      return entry.url;
    })
    .catch(() => {
      entry.loading = null;
      return null;
    });
  return entry.loading;
};

const releaseBlobUrl = (id: string): void => {
  const entry = entries.get(id);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs > 0) return;
  if (entry.releaseTimer !== null) window.clearTimeout(entry.releaseTimer);
  entry.releaseTimer = window.setTimeout(() => {
    if (entry.refs > 0) return;
    if (entry.url) URL.revokeObjectURL(entry.url);
    entries.delete(id);
  }, RELEASE_GRACE_MS);
};

let epoch = 0;
const epochListeners = new Set<() => void>();

const subscribeEpoch = (listener: () => void): (() => void) => {
  epochListeners.add(listener);
  return () => {
    epochListeners.delete(listener);
  };
};

const readEpoch = (): number => epoch;

const bumpEpoch = (): void => {
  epoch += 1;
  for (const listener of epochListeners) listener();
};

const dropEntry = (key: string): boolean => {
  const entry = entries.get(key);
  if (!entry) return false;
  if (entry.releaseTimer !== null) window.clearTimeout(entry.releaseTimer);
  if (entry.url) URL.revokeObjectURL(entry.url);
  entries.delete(key);
  return true;
};

export const invalidateBlobUrl = (id: string): void => {
  invalidateBlobUrls([id, thumbId(id)]);
};

export const invalidateBlobUrls = (ids: Iterable<string>): void => {
  let dropped = false;
  for (const id of ids) dropped = dropEntry(id) || dropped;
  if (dropped) bumpEpoch();
};

export const resetBlobUrls = (): void => {
  if (entries.size === 0) return;
  for (const key of [...entries.keys()]) dropEntry(key);
  bumpEpoch();
};

type Disposer = () => void;

const acquireManaged = (
  id: string,
  onUrl: (url: string | null) => void,
): Disposer => {
  let disposed = false;
  let settled = false;
  void acquireBlobUrl(id).then((url) => {
    settled = true;
    if (disposed) {
      releaseBlobUrl(id);
      return;
    }
    onUrl(url);
  });
  return () => {
    if (disposed) return;
    disposed = true;
    if (settled) releaseBlobUrl(id);
  };
};

const peekBlobUrl = (id: string): string | null => entries.get(id)?.url ?? null;

interface ResolvedUrl {
  id: string;
  epoch: number;
  url: string | null;
}

export const useBlobUrl = (id: string | undefined | null): string | null => {
  const [resolved, setResolved] = useState<ResolvedUrl | null>(null);
  const currentEpoch = useSyncExternalStore(subscribeEpoch, readEpoch);

  useEffect(() => {
    if (!id) return;
    return acquireManaged(id, (url) =>
      setResolved({ id, epoch: currentEpoch, url }),
    );
  }, [id, currentEpoch]);

  if (!id) return null;
  if (resolved?.id === id && resolved.epoch === currentEpoch)
    return resolved.url;
  return peekBlobUrl(id);
};

export interface WarmFile {
  id?: string;
  src?: string;
  decode: boolean;
}

const decodeImage = (url: string): void => {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  void image.decode().catch(() => {});
};

const warmFileKey = (file: WarmFile): string =>
  `${file.decode ? "image" : "file"}:${file.id ?? file.src ?? ""}`;

export const useWarmFiles = (files: WarmFile[]): void => {
  const currentEpoch = useSyncExternalStore(subscribeEpoch, readEpoch);
  const signature = files.map(warmFileKey).join("|");

  const warm = useEffectEvent((): Disposer => {
    const disposers: Disposer[] = [];
    for (const file of files) {
      if (file.src) {
        if (file.decode) decodeImage(file.src);
        continue;
      }
      if (!file.id) continue;
      disposers.push(
        acquireManaged(file.id, (url) => {
          if (url && file.decode) decodeImage(url);
        }),
      );
    }
    return () => {
      for (const dispose of disposers) dispose();
    };
  });

  useEffect(() => warm(), [signature, currentEpoch]);
};

interface MediaSource {
  id: string;
  src?: string;
}

export const useMediaUrl = (
  item: MediaSource | undefined | null,
): string | null => {
  const blobUrl = useBlobUrl(item && !item.src ? item.id : null);
  return item?.src ?? blobUrl;
};

export const useThumbUrl = (id: string | undefined | null): string | null => {
  const [url, setUrl] = useState<string | null>(null);
  const currentEpoch = useSyncExternalStore(subscribeEpoch, readEpoch);

  useEffect(() => {
    if (!id) return;
    let disposed = false;
    let disposeInner: Disposer = acquireManaged(thumbId(id), (thumb) => {
      if (thumb) {
        setUrl(thumb);
        return;
      }
      disposeInner();
      if (disposed) return;
      disposeInner = acquireManaged(id, setUrl);
    });
    return () => {
      disposed = true;
      setUrl(null);
      disposeInner();
    };
  }, [id, currentEpoch]);

  return id ? url : null;
};
