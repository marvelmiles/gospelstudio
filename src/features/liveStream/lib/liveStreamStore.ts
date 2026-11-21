import { create } from "zustand";
import type { StreamStats } from "./liveEncoderProtocol";
import type { SessionSnapshot } from "./liveRelayContract";

type LivePhase = "idle" | "starting" | "live" | "stopping";

type LiveConnection = "connecting" | "connected" | "reconnecting";

export interface LiveProblem {
  code: string;
  message: string;
}

export interface LiveStreamState {
  phase: LivePhase;
  connection: LiveConnection;
  relay: SessionSnapshot | null;
  stats: StreamStats | null;
  includedDestinationIds: readonly string[];
  busyDestinationIds: readonly string[];
  startedAt: number | null;
  problem: LiveProblem | null;
}

export const IDLE_LIVE_STATE: LiveStreamState = {
  phase: "idle",
  connection: "connecting",
  relay: null,
  stats: null,
  includedDestinationIds: [],
  busyDestinationIds: [],
  startedAt: null,
  problem: null,
};

export const useLiveStreamStore = create<LiveStreamState>()(
  () => IDLE_LIVE_STATE,
);

export const clearLiveProblem = (): void =>
  useLiveStreamStore.setState({ problem: null });
