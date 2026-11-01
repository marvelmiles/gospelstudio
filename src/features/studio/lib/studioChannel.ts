interface TypedMessage {
  type: string;
}

export const openTypedChannel = <T extends TypedMessage>(
  name: string,
  onMessage: (message: T) => void,
): BroadcastChannel | null => {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    const channel = new BroadcastChannel(name);
    channel.onmessage = (event: MessageEvent<T>) => {
      if (event.data && typeof event.data.type === "string")
        onMessage(event.data);
    };
    return channel;
  } catch {
    return null;
  }
};

export const postTypedMessage = <T extends TypedMessage>(
  channel: BroadcastChannel | null,
  message: T,
): void => {
  try {
    channel?.postMessage(message);
  } catch {}
};
