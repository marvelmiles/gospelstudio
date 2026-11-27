import { z } from "zod";

const CHANNEL_NAME = "gospelstudio-account";

const accountMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("session-changed") }),
  z.object({ type: z.literal("logo-changed"), accountId: z.string() }),
  z.object({
    type: z.literal("library-changed"),
    stores: z.array(z.string()),
    productionIds: z.array(z.string()),
    layoutIds: z.array(z.string()),
    fileIds: z.array(z.string()),
  }),
  z.object({ type: z.literal("sync-queue-changed"), needsSync: z.boolean() }),
]);

export type AccountMessage = z.infer<typeof accountMessageSchema>;

let channel: BroadcastChannel | null = null;

const openChannel = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
};

export const announceToOtherTabs = (message: AccountMessage): void => {
  try {
    openChannel()?.postMessage(message);
  } catch {}
};

export const listenToOtherTabs = (
  onMessage: (message: AccountMessage) => void,
): (() => void) => {
  const listening = openChannel();
  if (!listening) return () => {};
  const handle = (event: MessageEvent<unknown>) => {
    const parsed = accountMessageSchema.safeParse(event.data);
    if (parsed.success) onMessage(parsed.data);
  };
  listening.addEventListener("message", handle);
  return () => listening.removeEventListener("message", handle);
};
