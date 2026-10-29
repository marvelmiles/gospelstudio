const HOLD_MS = 1800;

/* Shown before the app starts, so it is plain page markup rather than a React component. */
export const showStorageClearedNotice = (message: string): Promise<void> => {
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 z-900 grid place-items-center bg-scrim-strong p-5 backdrop-blur-sm";

  const card = document.createElement("div");
  card.className =
    "w-full max-w-95 rounded-[18px] border border-border bg-card px-6 py-5.5 text-center text-sm leading-[1.7] text-foreground shadow-overlay";
  card.textContent = message;

  overlay.append(card);
  document.body.append(overlay);

  return new Promise((resolve) => window.setTimeout(resolve, HOLD_MS));
};
