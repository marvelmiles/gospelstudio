import { linkBroadcaster } from "../../pairing/lib/broadcasterLink";
import { createReceiver } from "../../pairing/lib/receiverPeer";
import type { PeerStatus } from "../../pairing/lib/peerStatus";
import type { DeviceEntry } from "../../pairing/lib/signaling";
import type { CameraStatus } from "../types/mediaSource";
import { setSourceState } from "../store/cameraStore";

interface RemoteLink {
  setViewerLive: (live: boolean) => void;
  close: () => void;
}

interface RemoteEntry {
  sourceId: string;
  link: RemoteLink | null;
  stream: MediaStream | null;
  status: PeerStatus;
  deviceName: string | null;
  audioShared: boolean;
  isPending: boolean;
}

interface StatusCopy {
  status: CameraStatus;
  message: string | null;
}

const STATUS_COPY: Record<PeerStatus, StatusCopy> = {
  idle: { status: "starting", message: null },
  gathering: { status: "starting", message: "Getting ready to connect." },
  waiting: {
    status: "starting",
    message: "Waiting for the other device to answer.",
  },
  connecting: {
    status: "starting",
    message: "Connecting to the other device.",
  },
  live: { status: "live", message: null },
  reconnecting: {
    status: "starting",
    message:
      "Reconnecting. Keep GospelStudio open on the other device and it picks up again.",
  },
  failed: {
    status: "missing",
    message: "The other device stopped sharing. Connect it again.",
  },
};

const SHOWS_PICTURE = new Set<PeerStatus>(["live", "reconnecting"]);

const entries = new Map<string, RemoteEntry>();
let liveViewerIds: ReadonlySet<string> = new Set();

const publish = (entry: RemoteEntry): void => {
  const copy = STATUS_COPY[entry.status];
  const isConnected = SHOWS_PICTURE.has(entry.status);
  setSourceState(entry.sourceId, {
    status: copy.status,
    message: copy.message,
    stream: isConnected ? entry.stream : null,
    deviceName: entry.deviceName,
    audioShared: isConnected && entry.audioShared,
  });
};

const openEntry = (sourceId: string): RemoteEntry => {
  releaseRemoteCamera(sourceId);
  const entry: RemoteEntry = {
    sourceId,
    link: null,
    stream: null,
    status: "idle",
    deviceName: null,
    audioShared: false,
    isPending: true,
  };
  entries.set(sourceId, entry);
  publish(entry);
  return entry;
};

const isCurrent = (entry: RemoteEntry): boolean =>
  entries.get(entry.sourceId) === entry;

const attach = (entry: RemoteEntry, link: RemoteLink): boolean => {
  if (!isCurrent(entry)) {
    link.close();
    return false;
  }
  entry.link = link;
  link.setViewerLive(liveViewerIds.has(entry.sourceId));
  return true;
};

const updateEntry = (entry: RemoteEntry, patch: Partial<RemoteEntry>): void => {
  if (!isCurrent(entry)) return;
  Object.assign(entry, patch);
  publish(entry);
};

export const connectNearbyCamera = async (
  sourceId: string,
  route: { room: string; device: DeviceEntry; viewerId: string },
): Promise<void> => {
  const entry = openEntry(sourceId);
  entry.deviceName = route.device.name;
  try {
    const link = await linkBroadcaster(
      { room: route.room, deviceId: route.device.id, viewerId: route.viewerId },
      {
        onStream: (stream) => updateEntry(entry, { stream }),
        onStatus: (status) => updateEntry(entry, { status }),
        onAudioShared: (audioShared) => updateEntry(entry, { audioShared }),
        onRejected: () => updateEntry(entry, { status: "failed" }),
      },
    );
    attach(entry, link);
  } catch {
    updateEntry(entry, { status: "failed" });
  }
};

export interface CodePairing {
  invite: string;
  accept: (answerSdp: string) => Promise<void>;
}

export const startCodePairing = async (
  sourceId: string,
): Promise<CodePairing> => {
  const entry = openEntry(sourceId);
  const receiver = await createReceiver({
    onStream: (stream) => updateEntry(entry, { stream }),
    onStatus: (status) => updateEntry(entry, { status }),
    onDeviceName: (deviceName) => updateEntry(entry, { deviceName }),
    onAudioShared: (audioShared) => updateEntry(entry, { audioShared }),
  });
  if (!attach(entry, receiver)) throw new Error("Pairing was cancelled.");
  return { invite: receiver.invite, accept: receiver.accept };
};

export const keepRemoteCamera = (fromId: string, toId: string): void => {
  const entry = entries.get(fromId);
  if (!entry) return;
  if (fromId !== toId) {
    releaseRemoteCamera(toId);
    entries.delete(fromId);
    setSourceState(fromId, null);
    entry.sourceId = toId;
    entries.set(toId, entry);
  }
  entry.isPending = false;
  entry.link?.setViewerLive(liveViewerIds.has(toId));
  publish(entry);
};

export const releaseRemoteCamera = (sourceId: string): void => {
  const entry = entries.get(sourceId);
  if (!entry) return;
  entries.delete(sourceId);
  entry.link?.close();
  setSourceState(sourceId, null);
};

export const retainRemoteCameras = (sourceIds: ReadonlySet<string>): void => {
  for (const [sourceId, entry] of [...entries])
    if (!entry.isPending && !sourceIds.has(sourceId))
      releaseRemoteCamera(sourceId);
};

export const setRemoteViewersLive = (sourceIds: ReadonlySet<string>): void => {
  liveViewerIds = sourceIds;
  for (const entry of entries.values())
    entry.link?.setViewerLive(sourceIds.has(entry.sourceId));
};
