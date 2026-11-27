import { create } from "zustand";
import type { PresentDevice } from "@/contracts/realtimeContract";

type RealtimeStatus = "off" | "connecting" | "connected" | "offline";

interface RealtimeState {
  status: RealtimeStatus;
  sessionId: string | null;
  devices: PresentDevice[];
}

export const DISCONNECTED_REALTIME: RealtimeState = {
  status: "off",
  sessionId: null,
  devices: [],
};

export const useRealtimeStore = create<RealtimeState>()(
  () => DISCONNECTED_REALTIME,
);

export const otherDevicesOf = ({
  devices,
  sessionId,
}: Pick<RealtimeState, "devices" | "sessionId">): PresentDevice[] =>
  devices.filter((device) => device.sessionId !== sessionId);
