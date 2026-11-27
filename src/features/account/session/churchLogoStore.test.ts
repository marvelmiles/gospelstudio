import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "@/contracts/accountContract";
import type { AccountMessage } from "./accountChannel";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const deferred = <T>(): Deferred<T> => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
};

const mocks = vi.hoisted(() => ({
  downloads: [] as Array<{
    signal: AbortSignal;
    answer: Deferred<Blob | null>;
  }>,
  announced: [] as AccountMessage[],
  tabListeners: [] as Array<(message: AccountMessage) => void>,
}));

vi.mock("../api/churchLogoApi", () => ({
  downloadChurchLogo: (signal: AbortSignal) => {
    const answer = deferred<Blob | null>();
    mocks.downloads.push({ signal, answer });
    return answer.promise;
  },
}));

vi.mock("./accountChannel", () => ({
  announceToOtherTabs: (message: AccountMessage) => {
    mocks.announced.push(message);
  },
  listenToOtherTabs: (onMessage: (message: AccountMessage) => void) => {
    mocks.tabListeners.push(onMessage);
    return () => {};
  },
}));

const ACCOUNT: Account = {
  id: "665f1c2e9b3a4d0012ab34cd",
  email: "media@gracechapel.org",
  churchName: "Grace Chapel",
  createdAt: "2026-10-02T14:03:11.000Z",
};

const imageOf = (label: string): Blob =>
  new Blob([label], { type: "image/png" });

const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

const loadStore = async () => {
  vi.resetModules();
  const store = await import("./churchLogoStore");
  const { useAuthStore } = await import("./authStore");
  useAuthStore.setState({ status: "signedIn", account: ACCOUNT });
  return { ...store, useAuthStore };
};

const lastDownload = () => {
  const download = mocks.downloads[mocks.downloads.length - 1];
  if (!download) throw new Error("No logo download started.");
  return download;
};

beforeEach(() => {
  mocks.downloads.length = 0;
  mocks.announced.length = 0;
  mocks.tabListeners.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("church logo store", () => {
  it("downloads the logo once for every place that shows it", async () => {
    const { ensureChurchLogo, useChurchLogoStore } = await loadStore();
    ensureChurchLogo(ACCOUNT.id);
    ensureChurchLogo(ACCOUNT.id);
    expect(mocks.downloads).toHaveLength(1);
    expect(useChurchLogoStore.getState().logo.status).toBe("loading");

    lastDownload().answer.resolve(imageOf("logo"));
    await settle();
    ensureChurchLogo(ACCOUNT.id);

    expect(mocks.downloads).toHaveLength(1);
    const { accountId, logo } = useChurchLogoStore.getState();
    expect(accountId).toBe(ACCOUNT.id);
    expect(logo.status === "ready" && logo.url.startsWith("blob:")).toBe(true);
  });

  it("shows no logo when the church has none yet", async () => {
    const { ensureChurchLogo, useChurchLogoStore } = await loadStore();
    ensureChurchLogo(ACCOUNT.id);
    lastDownload().answer.resolve(null);
    await settle();
    expect(useChurchLogoStore.getState().logo).toEqual({ status: "missing" });
  });

  it("marks the logo unavailable after a failed download and tries again later", async () => {
    const { ensureChurchLogo, useChurchLogoStore } = await loadStore();
    ensureChurchLogo(ACCOUNT.id);
    lastDownload().answer.reject(new Error("offline"));
    await settle();
    expect(useChurchLogoStore.getState().logo.status).toBe("unavailable");

    ensureChurchLogo(ACCOUNT.id);
    expect(mocks.downloads).toHaveLength(2);
  });

  it("shows a new logo at once, frees the old one and tells other tabs", async () => {
    const { ensureChurchLogo, replaceChurchLogo, useChurchLogoStore } =
      await loadStore();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    ensureChurchLogo(ACCOUNT.id);
    lastDownload().answer.resolve(imageOf("old"));
    await settle();
    const before = useChurchLogoStore.getState().logo;

    replaceChurchLogo(ACCOUNT.id, imageOf("new"));

    const after = useChurchLogoStore.getState().logo;
    expect(after.status).toBe("ready");
    expect(after).not.toEqual(before);
    if (before.status === "ready")
      expect(revoke).toHaveBeenCalledWith(before.url);
    expect(mocks.announced).toEqual([
      { type: "logo-changed", accountId: ACCOUNT.id },
    ]);
  });

  it("shows no logo after it is removed", async () => {
    const { replaceChurchLogo, useChurchLogoStore } = await loadStore();
    replaceChurchLogo(ACCOUNT.id, imageOf("logo"));
    replaceChurchLogo(ACCOUNT.id, null);
    expect(useChurchLogoStore.getState().logo).toEqual({ status: "missing" });
    expect(mocks.announced).toHaveLength(2);
  });

  it("ignores a download that finishes after a newer logo was saved", async () => {
    const { ensureChurchLogo, replaceChurchLogo, useChurchLogoStore } =
      await loadStore();
    ensureChurchLogo(ACCOUNT.id);
    const stale = lastDownload();

    replaceChurchLogo(ACCOUNT.id, null);
    stale.answer.resolve(imageOf("stale"));
    await settle();

    expect(stale.signal.aborted).toBe(true);
    expect(useChurchLogoStore.getState().logo).toEqual({ status: "missing" });
  });

  it("forgets the logo when the account signs out", async () => {
    const { replaceChurchLogo, useAuthStore, useChurchLogoStore } =
      await loadStore();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    replaceChurchLogo(ACCOUNT.id, imageOf("logo"));
    const shown = useChurchLogoStore.getState().logo;

    useAuthStore.setState({ status: "signedOut", account: null });

    expect(useChurchLogoStore.getState()).toEqual({
      accountId: null,
      logo: { status: "loading" },
    });
    if (shown.status === "ready")
      expect(revoke).toHaveBeenCalledWith(shown.url);
  });

  it("keeps the logo when other account details change", async () => {
    const { replaceChurchLogo, useAuthStore, useChurchLogoStore } =
      await loadStore();
    replaceChurchLogo(ACCOUNT.id, imageOf("logo"));
    useAuthStore.setState({
      account: { ...ACCOUNT, churchName: "Grace Chapel Lagos" },
    });
    expect(useChurchLogoStore.getState().logo.status).toBe("ready");
  });

  it("downloads again when another tab changes the logo, keeping the current one until then", async () => {
    const { ensureChurchLogo, useChurchLogoStore } = await loadStore();
    ensureChurchLogo(ACCOUNT.id);
    lastDownload().answer.resolve(imageOf("old"));
    await settle();

    for (const listener of mocks.tabListeners)
      listener({ type: "logo-changed", accountId: ACCOUNT.id });
    expect(mocks.downloads).toHaveLength(2);
    expect(useChurchLogoStore.getState().logo.status).toBe("ready");

    lastDownload().answer.resolve(null);
    await settle();
    expect(useChurchLogoStore.getState().logo).toEqual({ status: "missing" });
  });

  it("ignores logo changes for a different account", async () => {
    const { ensureChurchLogo } = await loadStore();
    ensureChurchLogo(ACCOUNT.id);
    for (const listener of mocks.tabListeners)
      listener({ type: "logo-changed", accountId: "someone-else" });
    expect(mocks.downloads).toHaveLength(1);
  });
});
