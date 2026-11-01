import { createReceiver } from "./receiverPeer";
import type { PeerStatus } from "./peerStatus";
import { requestStream, type CallHandle } from "./signaling";

const RECONNECT_RETRY_MS = 8000;
const RECONNECT_WINDOW_MS = 3 * 60 * 1000;

export interface BroadcasterRoute {
  room: string;
  deviceId: string;
  viewerId: string;
}

export interface BroadcasterCallbacks {
  onStream: (stream: MediaStream) => void;
  onStatus: (status: PeerStatus) => void;
  onAudioShared?: (shared: boolean) => void;
  onGaveUp?: () => void;
  onRejected?: () => void;
}

export interface BroadcasterLink {
  setViewerLive: (live: boolean) => void;
  close: () => void;
}

/* A dropped link is restarted through signalling for a few minutes, so a phone that slept picks up again on its own. */
export const linkBroadcaster = async (
  route: BroadcasterRoute,
  callbacks: BroadcasterCallbacks,
): Promise<BroadcasterLink> => {
  let call: CallHandle | null = null;
  let reconnectTimer: number | null = null;
  let isClosed = false;

  const stopReconnecting = (): void => {
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const sendOffer = (offerSdp: string, onAcceptFailed?: () => void): void => {
    void call?.close();
    const current = requestStream(
      route.room,
      route.deviceId,
      route.viewerId,
      offerSdp,
    );
    call = current;
    let isAnswered = false;
    current.onAnswer((answerSdp) => {
      if (isAnswered || call !== current) return;
      isAnswered = true;
      void receiver
        .accept(answerSdp)
        .then(() => current.close())
        .catch(() => onAcceptFailed?.());
    });
  };

  const reconnect = (): void => {
    if (isClosed || reconnectTimer !== null) return;
    const startedAt = Date.now();
    const attempt = async () => {
      if (isClosed) return;
      if (Date.now() - startedAt > RECONNECT_WINDOW_MS) {
        reconnectTimer = null;
        callbacks.onStatus("failed");
        callbacks.onGaveUp?.();
        return;
      }
      try {
        sendOffer(await receiver.createRestartOffer());
      } catch {}
      if (!isClosed)
        reconnectTimer = window.setTimeout(attempt, RECONNECT_RETRY_MS);
    };
    reconnectTimer = window.setTimeout(attempt, 0);
  };

  const handleStatus = (status: PeerStatus): void => {
    if (isClosed) return;
    if (status === "live") {
      stopReconnecting();
      void call?.close();
      call = null;
    }
    if (status === "failed") {
      callbacks.onStatus("reconnecting");
      reconnect();
      return;
    }
    callbacks.onStatus(status);
  };

  const receiver = await createReceiver({
    onStream: (stream) => {
      if (!isClosed) callbacks.onStream(stream);
    },
    onStatus: handleStatus,
    onAudioShared: (shared) => {
      if (!isClosed) callbacks.onAudioShared?.(shared);
    },
  });

  sendOffer(receiver.invite, callbacks.onRejected);

  return {
    setViewerLive: (live) => receiver.setViewerLive(live),
    close: () => {
      isClosed = true;
      stopReconnecting();
      void call?.close().catch(() => {});
      receiver.close();
    },
  };
};
