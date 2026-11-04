export interface ScreenDetailed {
  left: number;
  top: number;
  width: number;
  height: number;
  availLeft?: number;
  availTop?: number;
  availWidth?: number;
  availHeight?: number;
  isPrimary?: boolean;
  isInternal?: boolean;
  label?: string;
}

export interface ScreenDetails {
  screens: ScreenDetailed[];
  currentScreen: ScreenDetailed;
}

interface ScreenDetailsWindow extends Window {
  getScreenDetails?: () => Promise<ScreenDetails>;
}

export interface ScreenPlacement {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ProjectorScreen {
  placement: ScreenPlacement;
  bounds: ScreenPlacement;
  label: string;
  screen: ScreenDetailed;
}

export type ScreenAccess = "unsupported" | "granted" | "prompt" | "denied";

const PERMISSION_NAMES = [
  "window-management",
  "window-placement",
] as unknown as PermissionName[];

export const isExtendedDisplay = (): boolean => {
  try {
    return Boolean(
      (window.screen as unknown as { isExtended?: boolean }).isExtended,
    );
  } catch {
    return false;
  }
};

const hasScreenDetails = (): boolean =>
  typeof (window as ScreenDetailsWindow).getScreenDetails === "function";

let cached: ScreenDetails | null = null;
let asking: Promise<ScreenDetails | null> | null = null;

export const screenAccess = async (): Promise<ScreenAccess> => {
  if (!hasScreenDetails()) return "unsupported";
  if (cached) return "granted";
  for (const name of PERMISSION_NAMES) {
    try {
      const status = await navigator.permissions?.query({ name });
      if (status?.state === "granted" || status?.state === "denied")
        return status.state;
      if (status) return "prompt";
    } catch {}
  }
  return "prompt";
};

export const readScreenDetails = async (): Promise<ScreenDetails | null> => {
  if (cached) return cached;
  const getScreenDetails = (window as ScreenDetailsWindow).getScreenDetails;
  if (!getScreenDetails) return null;
  asking ??= getScreenDetails
    .call(window)
    .then((details) => {
      cached = details;
      return details;
    })
    .catch(() => null)
    .finally(() => {
      asking = null;
    });
  return asking;
};

export const screenOfWindow = (
  details: ScreenDetails,
  target: Window,
): ScreenDetailed | null => {
  try {
    const x = target.screenX + target.outerWidth / 2;
    const y = target.screenY + target.outerHeight / 2;
    return (
      details.screens.find(
        (screen) =>
          x >= screen.left &&
          y >= screen.top &&
          x < screen.left + screen.width &&
          y < screen.top + screen.height,
      ) ?? null
    );
  } catch {
    return null;
  }
};

export const pickProjectorScreen = (
  details: ScreenDetails,
  operatorScreen: ScreenDetailed = details.currentScreen,
): ScreenDetailed | null => {
  const elsewhere = details.screens.filter(
    (screen) => screen !== operatorScreen,
  );
  return (
    elsewhere.find(
      (screen) => screen.isInternal === false && screen.isPrimary === false,
    ) ??
    elsewhere.find((screen) => screen.isInternal === false) ??
    elsewhere.find((screen) => screen.isPrimary === false) ??
    elsewhere[0] ??
    null
  );
};

const boundsOf = (screen: ScreenDetailed): ScreenPlacement => ({
  left: screen.left,
  top: screen.top,
  width: screen.width,
  height: screen.height,
});

const placementOf = (screen: ScreenDetailed): ScreenPlacement => ({
  left: screen.availLeft ?? screen.left,
  top: screen.availTop ?? screen.top,
  width: screen.availWidth ?? screen.width,
  height: screen.availHeight ?? screen.height,
});

export const screenLabel = (screen: ScreenDetailed, index: number): string =>
  screen.label?.trim() ||
  (screen.isInternal ? "Built-in display" : `Display ${index + 1}`);

export const projectorScreenOf = (
  details: ScreenDetails,
  operatorScreen?: ScreenDetailed,
): ProjectorScreen | null => {
  const screen = pickProjectorScreen(details, operatorScreen);
  if (!screen) return null;
  return {
    placement: placementOf(screen),
    bounds: boundsOf(screen),
    label: screenLabel(screen, details.screens.indexOf(screen)),
    screen,
  };
};

export const knownProjectorScreen =
  async (): Promise<ProjectorScreen | null> => {
    if (!isExtendedDisplay()) return null;
    if ((await screenAccess()) !== "granted") return null;
    const details = await readScreenDetails();
    return details ? projectorScreenOf(details) : null;
  };

export const knownCurrentScreen = async (): Promise<ProjectorScreen | null> => {
  if ((await screenAccess()) !== "granted") return null;
  const details = await readScreenDetails();
  if (!details) return null;
  const { currentScreen } = details;
  return {
    placement: placementOf(currentScreen),
    bounds: boundsOf(currentScreen),
    label: screenLabel(currentScreen, details.screens.indexOf(currentScreen)),
    screen: currentScreen,
  };
};

export const isOnScreen = (
  target: Window,
  screen: ProjectorScreen,
): boolean => {
  try {
    const { left, top, width, height } = screen.bounds;
    const x = target.screenX;
    const y = target.screenY;
    return (
      x >= left - 1 && y >= top - 1 && x < left + width && y < top + height
    );
  } catch {
    return false;
  }
};

export const moveToScreen = (target: Window, screen: ProjectorScreen): void => {
  const { left, top, width, height } = screen.placement;
  try {
    target.moveTo(left, top);
    target.resizeTo(width, height);
  } catch {
    return;
  }
};

export interface ProjectorFill {
  isFullscreen: boolean;
  isOnProjector: boolean;
}

const fillThisScreen = async (element: HTMLElement): Promise<boolean> => {
  try {
    await element.requestFullscreen();
    return true;
  } catch {
    return false;
  }
};

export const fillProjector = async (
  element: HTMLElement,
): Promise<ProjectorFill> => {
  const details = isExtendedDisplay() ? await readScreenDetails() : null;
  const operatorScreen =
    details && window.opener
      ? screenOfWindow(details, window.opener as Window)
      : null;
  const projector = details
    ? projectorScreenOf(details, operatorScreen ?? undefined)
    : null;

  if (!projector)
    return {
      isFullscreen: await fillThisScreen(element),
      isOnProjector: false,
    };

  if (!isOnScreen(window, projector)) moveToScreen(window, projector);

  try {
    await element.requestFullscreen({
      screen: projector.screen,
    } as FullscreenOptions);
    return { isFullscreen: true, isOnProjector: true };
  } catch {}
  return {
    isFullscreen: await fillThisScreen(element),
    isOnProjector: isOnScreen(window, projector),
  };
};
