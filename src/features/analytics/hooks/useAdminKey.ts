import { useCallback, useState } from "react";

const ADMIN_KEY_STORAGE_KEY = "gospelstudio:analytics-admin-key";

const readStoredAdminKey = (): string | null => {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const useAdminKey = () => {
  const [adminKey, setAdminKey] = useState<string | null>(readStoredAdminKey);

  const saveAdminKey = useCallback((key: string) => {
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, key);
    } catch {}
    setAdminKey(key);
  }, []);

  const clearAdminKey = useCallback(() => {
    try {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    } catch {}
    setAdminKey(null);
  }, []);

  return { adminKey, saveAdminKey, clearAdminKey };
};
