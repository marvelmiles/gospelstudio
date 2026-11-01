import { useCallback } from "react";
import { useStore } from "../../../store/useStore";
import { APP_NAME } from "../../../lib/appInfo";
import { openPreviewTab } from "../lib/previewChannel";
import { showPreviewNow } from "../lib/previewPublisher";

export const usePreviewTab = (): (() => void) => {
  const pushToast = useStore((state) => state.pushToast);
  return useCallback(() => {
    if (openPreviewTab()) {
      showPreviewNow();
      return;
    }
    pushToast(
      `Your browser blocked the preview tab. Allow pop-ups for ${APP_NAME} and try again.`,
      "error",
    );
  }, [pushToast]);
};
