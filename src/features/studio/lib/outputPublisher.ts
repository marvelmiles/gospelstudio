import type { ProgramSnapshot } from "../types/production";
import { useOutputStore } from "../store/outputStore";
import {
  OUTPUT_HEARTBEAT_MS,
  OUTPUT_SILENCE_LIMIT_MS,
  openStudioChannel,
  postStudioMessage,
  type OperatorMessage,
} from "./outputChannel";
import { collectProgramAssets } from "./programAssets";

let channel: BroadcastChannel | null = null;
let lastProgram: OperatorMessage | null = null;
let lastSeenAt = 0;
let watchdog: number | undefined;

const setConnected = (isConnected: boolean): void => {
  if (useOutputStore.getState().isConnected !== isConnected)
    useOutputStore.setState({ isConnected });
};

const watchForSilence = (): void => {
  if (watchdog !== undefined) return;
  watchdog = window.setInterval(() => {
    if (Date.now() - lastSeenAt > OUTPUT_SILENCE_LIMIT_MS) setConnected(false);
  }, OUTPUT_HEARTBEAT_MS);
};

const markSeen = (): void => {
  lastSeenAt = Date.now();
  setConnected(true);
  watchForSilence();
};

const resendState = (): void => {
  if (lastProgram) postStudioMessage(channel, lastProgram);
  postStudioMessage(channel, {
    type: "test",
    active: useOutputStore.getState().isTesting,
  });
};

export const startOutputPublisher = (): void => {
  if (channel) return;
  channel = openStudioChannel((message) => {
    switch (message.type) {
      case "hello":
        markSeen();
        resendState();
        return;
      case "alive":
        markSeen();
        return;
      case "bye":
        setConnected(false);
        return;
      default:
        return;
    }
  });
};

export const publishProgram = (program: ProgramSnapshot | null): void => {
  lastProgram = {
    type: "program",
    program,
    assets: collectProgramAssets(program?.layers ?? []),
  };
  postStudioMessage(channel, lastProgram);
};

export const setOutputTesting = (isTesting: boolean): void => {
  useOutputStore.setState({ isTesting });
  postStudioMessage(channel, { type: "test", active: isTesting });
};
