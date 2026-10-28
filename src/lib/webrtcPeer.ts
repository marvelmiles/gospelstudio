const ICE_GATHERING_TIMEOUT_MS = 3000;

/* No outside servers, so the camera video only ever travels over your own WiFi. */
export const createPeerConnection = (): RTCPeerConnection =>
  new RTCPeerConnection({ iceServers: [] });

export const waitForIceGathering = (
  connection: RTCPeerConnection,
  { isRestart = false, timeoutMs = ICE_GATHERING_TIMEOUT_MS } = {},
): Promise<void> => {
  if (!isRestart && connection.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finish = () => {
      connection.removeEventListener("icegatheringstatechange", onChange);
      window.clearTimeout(timer);
      resolve();
    };
    const onChange = () => {
      if (connection.iceGatheringState === "complete") finish();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    connection.addEventListener("icegatheringstatechange", onChange);
  });
};
