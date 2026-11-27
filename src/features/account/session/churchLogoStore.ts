import { create } from "zustand";
import { downloadChurchLogo } from "../api/churchLogoApi";
import { announceToOtherTabs, listenToOtherTabs } from "./accountChannel";
import { useAuthStore } from "./authStore";

export type ChurchLogoView =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "unavailable" }
  | { status: "ready"; url: string };

interface ChurchLogoState {
  accountId: string | null;
  logo: ChurchLogoView;
}

export const LOADING_LOGO: ChurchLogoView = { status: "loading" };
export const UNAVAILABLE_LOGO: ChurchLogoView = { status: "unavailable" };
const MISSING_LOGO: ChurchLogoView = { status: "missing" };

export const useChurchLogoStore = create<ChurchLogoState>()(() => ({
  accountId: null,
  logo: LOADING_LOGO,
}));

let download: AbortController | null = null;
let isWatching = false;

const viewOf = (image: Blob | null): ChurchLogoView =>
  image ? { status: "ready", url: URL.createObjectURL(image) } : MISSING_LOGO;

const setChurchLogo = (
  accountId: string | null,
  logo: ChurchLogoView,
): void => {
  const previous = useChurchLogoStore.getState().logo;
  useChurchLogoStore.setState({ accountId, logo });
  if (previous.status === "ready" && previous !== logo)
    URL.revokeObjectURL(previous.url);
};

const stopDownload = (): void => {
  download?.abort();
  download = null;
};

const fetchChurchLogo = (accountId: string): void => {
  stopDownload();
  const controller = new AbortController();
  download = controller;
  if (useChurchLogoStore.getState().accountId !== accountId)
    setChurchLogo(accountId, LOADING_LOGO);

  downloadChurchLogo(controller.signal).then(
    (image) => {
      if (controller.signal.aborted) return;
      download = null;
      setChurchLogo(accountId, viewOf(image));
    },
    () => {
      if (controller.signal.aborted) return;
      download = null;
      if (useChurchLogoStore.getState().logo.status === "loading")
        setChurchLogo(accountId, UNAVAILABLE_LOGO);
    },
  );
};

const forgetChurchLogo = (): void => {
  stopDownload();
  setChurchLogo(null, LOADING_LOGO);
};

const watchForChanges = (): void => {
  if (isWatching) return;
  isWatching = true;
  useAuthStore.subscribe(({ account }) => {
    const { accountId } = useChurchLogoStore.getState();
    if (accountId && account?.id !== accountId) forgetChurchLogo();
  });
  listenToOtherTabs((message) => {
    const { accountId } = useChurchLogoStore.getState();
    if (message.type === "logo-changed" && message.accountId === accountId)
      fetchChurchLogo(accountId);
  });
};

export const ensureChurchLogo = (accountId: string): void => {
  watchForChanges();
  const { accountId: loadedFor, logo } = useChurchLogoStore.getState();
  const isSettled = logo.status === "ready" || logo.status === "missing";
  if (loadedFor === accountId && (isSettled || download)) return;
  fetchChurchLogo(accountId);
};

export const replaceChurchLogo = (
  accountId: string,
  image: Blob | null,
): void => {
  watchForChanges();
  stopDownload();
  setChurchLogo(accountId, viewOf(image));
  announceToOtherTabs({ type: "logo-changed", accountId });
};
