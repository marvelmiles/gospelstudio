import { APP_NAME } from "./appInfo";
import { showStorageClearedNotice } from "./storageClearedNotice";

const CLEARING_MESSAGE = `Clearing everything ${APP_NAME} saved on this device. The page will reload in a moment.`;

export const FRESH_START_MESSAGE = `${APP_NAME} has been updated. What the earlier version saved on this device is being cleared so it can start fresh. The page will reload in a moment.`;

const clearCookies = (): void => {
  for (const cookie of document.cookie.split(";")) {
    const separator = cookie.indexOf("=");
    const name = (
      separator > -1 ? cookie.substring(0, separator) : cookie
    ).trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
};

const deleteDatabase = (name: string): Promise<void> =>
  new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error(`IndexedDB: failed deleting ${name}`);
      resolve();
    };
  });

const deleteAllDatabases = async (): Promise<void> => {
  const databases = await indexedDB.databases();
  for (const { name } of databases) if (name) await deleteDatabase(name);
};

const deleteAllCaches = async (): Promise<void> => {
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
};

const attempt = async (
  label: string,
  task: () => void | Promise<void>,
): Promise<void> => {
  try {
    await task();
  } catch (error) {
    console.error(`${label}:`, error);
  }
};

const clearEverything = async (message = CLEARING_MESSAGE): Promise<void> => {
  const noticeShown = showStorageClearedNotice(message);

  await attempt("Local Storage", () => localStorage.clear());
  await attempt("Session Storage", () => sessionStorage.clear());
  await attempt("Cookies", clearCookies);
  await attempt("IndexedDB", deleteAllDatabases);
  await attempt("Cache Storage", deleteAllCaches);

  await noticeShown;
  window.location.replace(window.location.pathname);
};

export default clearEverything;
