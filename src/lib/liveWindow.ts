import { PRESENT_WINDOW_NAME } from "./presentChannel";
import {
  isExtendedDisplay,
  isOnScreen,
  knownCurrentScreen,
  knownProjectorScreen,
  moveToScreen,
  readScreenDetails,
  screenAccess,
  type ProjectorScreen,
  type ScreenAccess,
  type ScreenPlacement,
} from "./screens";
import routes from "../routes";

export { isExtendedDisplay };

interface LiveWindowState {
  isLive: boolean;
}

type GoLivePlacement = "external" | "pending" | "same-screen";

export interface GoLiveResult {
  ok: boolean;
  reason?: "blocked" | "retry" | "error";
  placement: GoLivePlacement;
  isExtended: boolean;
  access: ScreenAccess;
  display?: string;
}

export interface GoLiveOptions {
  onOpening?: (expected: GoLiveResult) => Promise<void> | void;
}

export interface LiveWindowController {
  goLive: (options?: GoLiveOptions) => Promise<GoLiveResult>;
  endLive: () => void;
  subscribe: (listener: () => void) => () => void;
  getState: () => LiveWindowState;
}

type Listener = () => void;

const SETTLE_DELAYS_MS = [0, 250, 800];

export const windowFeatures = (
  placement: ScreenPlacement,
  canFillOnOpen: boolean,
): string => {
  const features = [
    `left=${placement.left}`,
    `top=${placement.top}`,
    `width=${placement.width}`,
    `height=${placement.height}`,
    "popup=yes",
    "toolbar=no",
    "location=no",
    "menubar=no",
    "status=no",
    "scrollbars=no",
    "resizable=yes",
  ];
  if (canFillOnOpen) features.push("fullscreen");
  return features.join(",");
};

const guessedPlacement = (isExtended: boolean): ScreenPlacement =>
  isExtended
    ? { left: window.screen.width, top: 0, width: 1280, height: 720 }
    : {
        left: 0,
        top: 0,
        width: window.screen.availWidth,
        height: window.screen.availHeight,
      };

const isFillingScreen = (
  opened: Window,
  projector: ProjectorScreen,
): boolean => {
  try {
    if (opened.document.fullscreenElement) return true;
    return (
      opened.innerWidth >= projector.bounds.width - 2 &&
      opened.innerHeight >= projector.bounds.height - 2
    );
  } catch {
    return false;
  }
};

const placementOfWindow = (opened: Window): GoLivePlacement => {
  try {
    return opened.screenX >= window.screen.width ||
      opened.screenY >= window.screen.height ||
      opened.screenX < 0 ||
      opened.screenY < 0
      ? "external"
      : "same-screen";
  } catch {
    return "same-screen";
  }
};

const settledPlacement = (
  opened: Window,
  projector: ProjectorScreen | null,
  access: ScreenAccess,
): GoLivePlacement => {
  if (projector) return "external";
  if (access === "prompt") return "pending";
  return placementOfWindow(opened);
};

const expectedPlacement = (
  projector: ProjectorScreen | null,
  access: ScreenAccess,
  isExtended: boolean,
): GoLivePlacement | null => {
  if (projector) return "external";
  if (access === "prompt") return "pending";
  return isExtended ? null : "same-screen";
};

const whenLoaded = (opened: Window, run: () => void): void => {
  try {
    if (opened.document.readyState === "complete") {
      run();
      return;
    }
  } catch {}
  opened.addEventListener("load", run, { once: true });
};

export const createLiveWindow = (
  route: string,
  windowName: string,
): LiveWindowController => {
  let win: Window | null = null;
  let state: LiveWindowState = { isLive: false };
  let closeWatcher: number | undefined;
  const settleTimers = new Set<number>();
  const listeners = new Set<Listener>();

  const setIsLive = (isLive: boolean): void => {
    if (state.isLive === isLive) return;
    state = { isLive };
    for (const listener of listeners) listener();
  };

  const stopWatchingClose = (): void => {
    window.clearInterval(closeWatcher);
    closeWatcher = undefined;
  };

  const stopSettling = (): void => {
    for (const timer of settleTimers) window.clearTimeout(timer);
    settleTimers.clear();
  };

  const endLive = (): void => {
    stopWatchingClose();
    stopSettling();
    try {
      win?.close();
    } catch {}
    win = null;
    setIsLive(false);
  };

  const settleOnto = (opened: Window, projector: ProjectorScreen): void => {
    for (const delay of SETTLE_DELAYS_MS) {
      const timer = window.setTimeout(() => {
        settleTimers.delete(timer);
        if (opened.closed || isFillingScreen(opened, projector)) return;
        if (isOnScreen(opened, projector)) return;
        moveToScreen(opened, projector);
      }, delay);
      settleTimers.add(timer);
    }
  };

  const goLive = async ({
    onOpening,
  }: GoLiveOptions = {}): Promise<GoLiveResult> => {
    const isExtended = isExtendedDisplay();

    let access = await screenAccess();
    const wasAsked = access === "prompt";
    if (wasAsked) {
      await readScreenDetails();
      access = await screenAccess();
    }

    const projector = await knownProjectorScreen();
    const target = projector ?? (await knownCurrentScreen());
    const canFillOnOpen = access === "granted";

    const standing = win && !win.closed ? win : null;
    if (standing) {
      const isSettled = target
        ? isOnScreen(standing, target) && isFillingScreen(standing, target)
        : true;
      if (isSettled || !canFillOnOpen) {
        setIsLive(true);
        standing.focus();
        return {
          ok: true,
          placement: settledPlacement(standing, projector, access),
          isExtended,
          access,
          display: projector?.label,
        };
      }
      endLive();
    }

    const expected = expectedPlacement(projector, access, isExtended);
    if (expected && onOpening)
      await onOpening({
        ok: true,
        placement: expected,
        isExtended,
        access,
        display: projector?.label,
      });

    const opened = window.open(
      route,
      windowName,
      windowFeatures(
        target?.placement ?? guessedPlacement(isExtended),
        canFillOnOpen && Boolean(target),
      ),
    );
    if (!opened) {
      return {
        ok: false,
        reason: wasAsked ? "retry" : "blocked",
        placement: "same-screen",
        isExtended,
        access,
        display: projector?.label,
      };
    }

    win = opened;
    setIsLive(true);

    if (projector) {
      settleOnto(opened, projector);
      whenLoaded(opened, () => settleOnto(opened, projector));
    }

    closeWatcher = window.setInterval(() => {
      if (win?.closed) {
        win = null;
        stopWatchingClose();
        stopSettling();
        setIsLive(false);
      }
    }, 800);

    return {
      ok: true,
      placement: settledPlacement(opened, projector, access),
      isExtended,
      access,
      display: projector?.label,
    };
  };

  return {
    goLive,
    endLive,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState: () => state,
  };
};

export const presentLiveWindow = createLiveWindow(
  routes.presentWindow(),
  PRESENT_WINDOW_NAME,
);
