import { lookup } from "node:dns/promises";
import { isPrivateHost } from "../../../src/features/liveStream/lib/streamUrl";
import { RelayError } from "../errors";

export type ResolveHost = (hostname: string) => Promise<string[]>;

export type GuardDestination = (url: string) => Promise<void>;

export const resolveWithDns: ResolveHost = async (hostname) =>
  (await lookup(hostname, { all: true, verbatim: true })).map(
    (entry) => entry.address,
  );

const notAllowed = (message: string): RelayError =>
  new RelayError(422, "destination_not_allowed", message);

export const createDestinationGuard = ({
  allowPrivate,
  resolve,
}: {
  allowPrivate: boolean;
  resolve: ResolveHost;
}): GuardDestination => {
  const checked = new Map<string, Promise<void>>();

  const checkHost = async (hostname: string): Promise<void> => {
    if (isPrivateHost(hostname))
      throw notAllowed(
        "Use the platform's public streaming address, not a local one.",
      );
    let addresses: string[];
    try {
      addresses = await resolve(hostname.replace(/^\[|\]$/g, ""));
    } catch {
      throw notAllowed(
        "The streaming server address could not be found. Check the server URL.",
      );
    }
    if (addresses.length === 0 || addresses.some(isPrivateHost))
      throw notAllowed(
        "Use the platform's public streaming address, not a local one.",
      );
  };

  return async (url) => {
    if (allowPrivate) return;
    const { hostname } = new URL(url);
    const pending = checked.get(hostname) ?? checkHost(hostname);
    checked.set(hostname, pending);
    try {
      await pending;
    } finally {
      checked.delete(hostname);
    }
  };
};
