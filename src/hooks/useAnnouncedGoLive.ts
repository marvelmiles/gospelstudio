import { useCallback } from "react";
import type { GoLiveResult, LiveWindowController } from "../lib/liveWindow";
import { useStore } from "../store/useStore";
import type { ToastId } from "../store/slices/uiSlice";

const POPUP_BLOCKED_MESSAGE =
  "Popup blocked. Allow popups for this site to go live.";

const RETRY_MESSAGE =
  "Display access sorted. Press Go Live once more and it fills the projector.";

const PENDING_MESSAGE =
  "Sending the live window to the other display. Choose Allow if your browser asks to manage windows, and it moves across on its own.";

const DENIED_MESSAGE =
  "This site is blocked from using the other display. Turn on Window management for it in your browser's site settings, then press Go Live again. You can also drag the live window onto the other display and press F.";

const SAME_SCREEN_MESSAGE =
  "Opened on this screen. Drag the live window onto the other display and press F to fill it.";

const PAINT_FALLBACK_MS = 120;

const afterNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    const fallback = window.setTimeout(resolve, PAINT_FALLBACK_MS);
    requestAnimationFrame(() =>
      window.setTimeout(() => {
        window.clearTimeout(fallback);
        resolve();
      }, 0),
    );
  });

type GoLiveAnnouncer = (result: GoLiveResult) => ToastId;

const useGoLiveAnnouncer = (windowLabel: string): GoLiveAnnouncer => {
  const pushToast = useStore((s) => s.pushToast);
  const showGoLiveTip = useStore((s) => s.showGoLiveTip);

  return useCallback(
    (result) => {
      if (!result.ok)
        return result.reason === "retry"
          ? pushToast(RETRY_MESSAGE)
          : pushToast(POPUP_BLOCKED_MESSAGE, "error");
      if (!result.isExtended) {
        showGoLiveTip();
        return pushToast(`${windowLabel} opened in fullscreen.`);
      }
      if (result.placement === "external") {
        showGoLiveTip();
        return pushToast(
          result.display
            ? `Live on ${result.display} in fullscreen.`
            : "Live on the external display in fullscreen.",
        );
      }
      if (result.placement === "pending") {
        showGoLiveTip();
        return pushToast(PENDING_MESSAGE);
      }
      return pushToast(
        result.access === "denied" ? DENIED_MESSAGE : SAME_SCREEN_MESSAGE,
        "error",
      );
    },
    [pushToast, showGoLiveTip, windowLabel],
  );
};

export const useAnnouncedGoLive = (
  controller: LiveWindowController,
  windowLabel: string,
): (() => Promise<GoLiveResult>) => {
  const announce = useGoLiveAnnouncer(windowLabel);
  const dismissToast = useStore((s) => s.dismissToast);
  const dismissGoLiveTip = useStore((s) => s.dismissGoLiveTip);

  return useCallback(async () => {
    const opening: { toastId: ToastId | null } = { toastId: null };
    const result = await controller.goLive({
      onOpening: (expected) => {
        opening.toastId = announce(expected);
        return afterNextPaint();
      },
    });
    if (opening.toastId === null) {
      announce(result);
      return result;
    }
    if (!result.ok) {
      dismissToast(opening.toastId);
      dismissGoLiveTip(false);
      announce(result);
    }
    return result;
  }, [announce, controller, dismissGoLiveTip, dismissToast]);
};
