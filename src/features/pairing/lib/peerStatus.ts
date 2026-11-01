export type PeerStatus =
  | "idle"
  | "gathering"
  | "waiting"
  | "connecting"
  | "live"
  | "reconnecting"
  | "failed";

export const watchConnectionStatus = (
  connection: RTCPeerConnection,
  onStatus: (status: PeerStatus) => void,
  onConnected?: () => void,
): void => {
  let hasConnected = false;
  connection.addEventListener("connectionstatechange", () => {
    switch (connection.connectionState) {
      case "connected":
        hasConnected = true;
        onConnected?.();
        onStatus("live");
        return;
      /* A short drop, like a phone screen sleeping, usually recovers, so it shows as reconnecting. */
      case "connecting":
      case "disconnected":
        onStatus(hasConnected ? "reconnecting" : "connecting");
        return;
      case "failed":
        onStatus("failed");
        return;
      default:
        return;
    }
  });
};
