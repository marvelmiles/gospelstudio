const OPT_OUT_KEY = "plausible_ignore";

type ConsentListener = () => void;

const listeners = new Set<ConsentListener>();

export const isAnalyticsOptedOut = (): boolean => {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "true";
  } catch {
    return false;
  }
};

export const setAnalyticsOptedOut = (optedOut: boolean): void => {
  try {
    if (optedOut) localStorage.setItem(OPT_OUT_KEY, "true");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
  listeners.forEach((listener) => listener());
};

export const subscribeToAnalyticsConsent = (
  listener: ConsentListener,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
