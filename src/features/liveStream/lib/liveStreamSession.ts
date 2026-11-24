import type { LiveStreamFailureReason } from "../../../lib/analytics/eventProps";
import { trackEvent } from "../../../lib/analytics/trackEvent";
import { ApiRequestError } from "../../../lib/jsonApi";
import { relayServerUrl } from "../../../lib/relayServer";
import { useStore } from "../../../store/useStore";
import { toLandscapeTrack } from "../../studio/capture/landscapeTrack";
import {
  acquireProgramCapture,
  type ProgramCaptureLease,
} from "../../studio/capture/programCapture";
import {
  canEncodeAac,
  chooseVideoCodec,
  hasLiveEncodingApis,
  startLiveEncoder,
  type LiveEncoderHandle,
} from "./liveEncoderClient";
import type { EncoderEvent } from "./liveEncoderProtocol";
import {
  createRelaySession,
  endRelaySession,
  ingestUrlOf,
  LIVE_STREAMING_NOT_CONFIGURED,
  setRelayDestinations,
} from "./liveRelayApi";
import type { CreatedSession } from "@/contracts/liveRelay";
import { liveQualityProfile, type LiveQualityId } from "./liveQuality";
import { streamUrlOf, type StreamDestination } from "./liveStreamSettings";
import {
  IDLE_LIVE_STATE,
  useLiveStreamStore,
  type LiveProblem,
} from "./liveStreamStore";

export type LiveStart = "started" | "cancelled" | "failed";

export interface LiveStartOptions {
  destinations: readonly StreamDestination[];
  quality: LiveQualityId;
}

interface LiveRuntime {
  relayUrl: string;
  session: CreatedSession;
  lease: ProgramCaptureLease;
  picture: MediaStreamTrack;
  encoder: LiveEncoderHandle | null;
  destinations: Map<string, string>;
  onConnected: (() => void) | null;
  onStartFailed: ((problem: LiveProblem) => void) | null;
}

const CONNECT_TIMEOUT_MS = 20_000;

const NOT_CONFIGURED: LiveProblem = {
  code: "not_configured",
  message: LIVE_STREAMING_NOT_CONFIGURED,
};

const UNSUPPORTED: LiveProblem = {
  code: "unsupported_browser",
  message:
    "This browser cannot encode a live stream. Use a recent Chrome or Edge on a Windows or Mac computer.",
};

const CAPTURE_FAILED: LiveProblem = {
  code: "capture_failed",
  message:
    "This browser could not share the projector screen. Use a recent Chrome or Edge on a computer.",
};

const CONNECT_TIMEOUT: LiveProblem = {
  code: "connect_timeout",
  message:
    "The streaming relay did not answer in time. Check the internet connection and try again.",
};

const SCREEN_CLOSED_MESSAGE =
  "The shared screen was closed, so the live stream ended.";

const setState = useLiveStreamStore.setState;

let runtime: LiveRuntime | null = null;

class LiveStartError extends Error {
  readonly problem: LiveProblem;
  readonly reason: LiveStreamFailureReason;

  constructor(problem: LiveProblem, reason: LiveStreamFailureReason) {
    super(problem.message);
    this.name = "LiveStartError";
    this.problem = problem;
    this.reason = reason;
  }
}

const problemFrom = (error: unknown): LiveProblem => {
  if (error instanceof LiveStartError) return error.problem;
  if (error instanceof ApiRequestError)
    return { code: error.code, message: error.message };
  return { code: "unexpected", message: "The live stream could not start." };
};

const failureReasonOf = (error: unknown): LiveStreamFailureReason => {
  if (error instanceof LiveStartError) return error.reason;
  if (error instanceof ApiRequestError)
    return error.status === 0 || error.status >= 500
      ? "service_unavailable"
      : "broadcast_failed";
  return "broadcast_failed";
};

const trackFailure = (reason: LiveStreamFailureReason): void =>
  trackEvent("Live Stream Failed", { props: { reason } });

const platformsOf = (destinations: readonly StreamDestination[]): string =>
  [...new Set(destinations.map((destination) => destination.platform))]
    .sort()
    .join(",");

const inputsOf = (destinations: ReadonlyMap<string, string>) =>
  [...destinations].map(([id, url]) => ({ id, url }));

const warnBeforeLeaving = (event: BeforeUnloadEvent): void => {
  event.preventDefault();
};

const releaseRuntime = (current: LiveRuntime): void => {
  if (runtime === current) runtime = null;
  current.encoder?.stop();
  current.picture.stop();
  current.lease.release();
  window.removeEventListener("beforeunload", warnBeforeLeaving);
};

const endAfterFailure = (current: LiveRuntime, message: string): void => {
  if (runtime !== current) return;
  releaseRuntime(current);
  void endRelaySession(current.relayUrl, current.session).catch(() => null);
  setState({ ...IDLE_LIVE_STATE, problem: { code: "stream_failed", message } });
  useStore.getState().pushToast(message, "error");
  trackFailure("connection_failed");
};

const handleEncoderEvent = (
  current: LiveRuntime,
  event: EncoderEvent,
): void => {
  if (runtime !== current) return;
  switch (event.type) {
    case "connected":
      current.onConnected?.();
      setState({ connection: "connected" });
      return;
    case "reconnecting":
      setState({ connection: "reconnecting" });
      return;
    case "session":
      setState({ relay: event.session });
      return;
    case "stats":
      setState({ stats: event.stats });
      return;
    case "failed":
      if (current.onStartFailed) {
        current.onStartFailed({ code: event.reason, message: event.message });
        return;
      }
      endAfterFailure(current, event.message);
  }
};

const waitUntilConnected = (current: LiveRuntime): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new LiveStartError(CONNECT_TIMEOUT, "service_unavailable")),
      CONNECT_TIMEOUT_MS,
    );
    current.onConnected = () => {
      window.clearTimeout(timer);
      resolve();
    };
    current.onStartFailed = (problem) => {
      window.clearTimeout(timer);
      reject(new LiveStartError(problem, "connection_failed"));
    };
  });

const prepareEncoder = async (quality: LiveQualityId) => {
  const profile = liveQualityProfile(quality);
  const [videoCodec, hasAac] = await Promise.all([
    chooseVideoCodec(profile),
    canEncodeAac(),
  ]);
  if (!videoCodec || !hasAac)
    throw new LiveStartError(UNSUPPORTED, "unsupported_browser");
  return { profile, videoCodec };
};

export const startLiveStream = async ({
  destinations,
  quality,
}: LiveStartOptions): Promise<LiveStart> => {
  if (
    useLiveStreamStore.getState().phase !== "idle" ||
    destinations.length === 0
  )
    return "failed";
  const relayUrl = relayServerUrl();
  if (!relayUrl) {
    setState({ ...IDLE_LIVE_STATE, problem: NOT_CONFIGURED });
    return "failed";
  }
  if (!hasLiveEncodingApis()) {
    setState({ ...IDLE_LIVE_STATE, problem: UNSUPPORTED });
    trackFailure("unsupported_browser");
    return "failed";
  }
  setState({ ...IDLE_LIVE_STATE, phase: "starting" });

  const capture = await acquireProgramCapture();
  if (capture.status !== "started") {
    const failed = capture.status === "failed";
    setState({ ...IDLE_LIVE_STATE, problem: failed ? CAPTURE_FAILED : null });
    if (failed) trackFailure("capture_failed");
    return capture.status;
  }

  const { lease } = capture;
  let session: CreatedSession | null = null;
  let current: LiveRuntime | null = null;
  try {
    const { profile, videoCodec } = await prepareEncoder(quality);
    session = await createRelaySession(relayUrl);
    const included = new Map(
      destinations.map((destination) => [
        destination.id,
        streamUrlOf(destination),
      ]),
    );
    const relay = await setRelayDestinations(
      relayUrl,
      session,
      inputsOf(included),
    );
    const owner: LiveRuntime = {
      relayUrl,
      session,
      lease,
      picture: toLandscapeTrack(lease.videoTrack, profile),
      encoder: null,
      destinations: included,
      onConnected: null,
      onStartFailed: null,
    };
    current = owner;
    runtime = owner;
    const connected = waitUntilConnected(owner);
    owner.encoder = startLiveEncoder({
      picture: owner.picture,
      sound: lease.audioTrack,
      ingestUrl: ingestUrlOf(relayUrl, session.sessionId),
      token: session.token,
      quality: profile,
      videoCodec,
      onEvent: (event) => handleEncoderEvent(owner, event),
    });
    setState({ relay, includedDestinationIds: [...included.keys()] });
    await connected;

    owner.onConnected = null;
    owner.onStartFailed = null;
    lease.onEnded(() => {
      if (runtime === owner) void stopLiveStream(SCREEN_CLOSED_MESSAGE);
    });
    window.addEventListener("beforeunload", warnBeforeLeaving);
    setState({ phase: "live", connection: "connected", startedAt: Date.now() });
    trackEvent("Live Stream Started", {
      props: { quality, platforms: platformsOf(destinations) },
    });
    return "started";
  } catch (error) {
    if (current) releaseRuntime(current);
    else lease.release();
    if (session) void endRelaySession(relayUrl, session).catch(() => null);
    setState({ ...IDLE_LIVE_STATE, problem: problemFrom(error) });
    trackFailure(failureReasonOf(error));
    return "failed";
  }
};

export const stopLiveStream = async (endedBecause?: string): Promise<void> => {
  const current = runtime;
  if (!current || useLiveStreamStore.getState().phase === "stopping") return;
  setState({ phase: "stopping" });
  current.encoder?.stop();
  await endRelaySession(current.relayUrl, current.session).catch(() => null);
  releaseRuntime(current);
  setState(
    endedBecause
      ? {
          ...IDLE_LIVE_STATE,
          problem: { code: "ended", message: endedBecause },
        }
      : IDLE_LIVE_STATE,
  );
  useStore
    .getState()
    .pushToast(
      endedBecause ?? "The live stream has ended.",
      endedBecause ? "error" : "success",
    );
  trackEvent("Live Stream Ended");
};

const setBusy = (destinationId: string, busy: boolean): void =>
  setState(({ busyDestinationIds }) => ({
    busyDestinationIds: busy
      ? [...busyDestinationIds, destinationId]
      : busyDestinationIds.filter((id) => id !== destinationId),
  }));

const sendDestinations = async (
  destinationId: string,
  next: Map<string, string>,
): Promise<boolean> => {
  const current = runtime;
  if (!current) return false;
  setBusy(destinationId, true);
  try {
    const relay = await setRelayDestinations(
      current.relayUrl,
      current.session,
      inputsOf(next),
    );
    if (runtime !== current) return false;
    current.destinations = next;
    setState({
      relay,
      includedDestinationIds: [...next.keys()],
      problem: null,
    });
    return true;
  } catch (error) {
    if (runtime === current) setState({ problem: problemFrom(error) });
    return false;
  } finally {
    setBusy(destinationId, false);
  }
};

export const includeDestination = (
  destination: StreamDestination,
): Promise<boolean> => {
  if (!runtime) return Promise.resolve(false);
  const next = new Map(runtime.destinations);
  next.set(destination.id, streamUrlOf(destination));
  return sendDestinations(destination.id, next);
};

export const excludeDestination = (destinationId: string): Promise<boolean> => {
  if (!runtime || runtime.destinations.size <= 1) return Promise.resolve(false);
  const next = new Map(runtime.destinations);
  next.delete(destinationId);
  return sendDestinations(destinationId, next);
};

export const retryDestination = (destinationId: string): Promise<boolean> =>
  runtime
    ? sendDestinations(destinationId, new Map(runtime.destinations))
    : Promise.resolve(false);
