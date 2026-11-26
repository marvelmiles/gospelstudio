const lockManager = (): LockManager | null =>
  typeof navigator !== "undefined" && navigator.locks ? navigator.locks : null;

export const withWebLock = <T>(
  name: string,
  task: () => Promise<T>,
): Promise<T> => {
  const locks = lockManager();
  if (!locks) return task();
  return new Promise<T>((resolve, reject) => {
    locks.request(name, () => task().then(resolve, reject)).catch(reject);
  });
};

export const withWebLockIfFree = <T>(
  name: string,
  task: () => Promise<T>,
): Promise<T | null> => {
  const locks = lockManager();
  if (!locks) return task();
  return new Promise<T | null>((resolve, reject) => {
    locks
      .request(name, { ifAvailable: true }, (lock) =>
        lock ? task().then(resolve, reject) : resolve(null),
      )
      .catch(reject);
  });
};
