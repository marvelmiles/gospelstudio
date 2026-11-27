import { io, type Socket } from "socket.io-client";
import type { z } from "zod";
import {
  REALTIME_ERRORS,
  REALTIME_EVENTS,
  REALTIME_PATH,
  accountChangedSchema,
  libraryChangedSchema,
  presenceSchema,
  realtimeReadySchema,
  sessionEndedSchema,
  type DeviceActivity,
} from "@/contracts/realtimeContract";
import { apiServerUrl } from "../../lib/apiServer";
import { useStore } from "../../store/useStore";
import {
  endSessionFromElsewhere,
  refreshAccountFromServer,
} from "../account/accountLifecycle";
import {
  accessTokenFor,
  forgetAccessToken,
  isSessionEnded,
} from "../account/session/sessionManager";
import { readSyncSettings } from "../sync/syncSettings";
import {
  currentDeviceActivity,
  watchDeviceActivity,
} from "./deviceActivitySharing";
import { liveTransitionsOf } from "./deviceActivityText";
import { emitRealtime } from "./realtimeEvents";
import { DISCONNECTED_REALTIME, useRealtimeStore } from "./realtimeStore";

const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30 * 1000;
const SERVER_DISCONNECT = "io server disconnect";

let socket: Socket | null = null;
let stopSharingActivity: (() => void) | null = null;
let retryTimer: number | undefined;
let retryCount = 0;

const setRealtime = useRealtimeStore.setState;

const handle =
  <S extends z.ZodTypeAny>(
    schema: S,
    onValid: (payload: z.output<S>) => void,
  ) =>
  (payload: unknown): void => {
    const parsed = schema.safeParse(payload);
    if (parsed.success) onValid(parsed.data);
  };

const sendActivity = (activity: DeviceActivity): void => {
  if (socket?.connected) socket.emit(REALTIME_EVENTS.setActivity, activity);
};

/* The handshake reads a fresh token on every attempt, so a reconnection after the token expired renews it first. */
const authenticate = (send: (data: object) => void): void => {
  accessTokenFor().then(
    (token) => send({ token, deviceId: readSyncSettings().deviceId }),
    (error: unknown) => {
      if (isSessionEnded(error)) stopRealtime();
      send({});
    },
  );
};

const retryLater = (): void => {
  window.clearTimeout(retryTimer);
  const delayMs = Math.min(MAX_RETRY_MS, FIRST_RETRY_MS * 2 ** retryCount);
  retryCount += 1;
  retryTimer = window.setTimeout(() => socket?.connect(), delayMs);
};

const onConnect = (): void => {
  retryCount = 0;
  setRealtime({ status: "connected" });
  sendActivity(currentDeviceActivity());
  emitRealtime("connected");
};

/* The server refusing the handshake stops automatic reconnection, so a rejected token is renewed and the connection is retried here. */
const onConnectError = (error: Error): void => {
  setRealtime({ status: navigator.onLine ? "connecting" : "offline" });
  if (error.message === REALTIME_ERRORS.unauthorized) forgetAccessToken();
  if (!socket?.active) retryLater();
};

const onDisconnect = (reason: string): void => {
  setRealtime({
    status: navigator.onLine ? "connecting" : "offline",
    devices: [],
  });
  if (reason === SERVER_DISCONNECT) retryLater();
};

const onPresence = handle(presenceSchema, ({ devices }) => {
  const { devices: previous, sessionId } = useRealtimeStore.getState();
  setRealtime({ devices });
  for (const message of liveTransitionsOf(previous, devices, sessionId))
    useStore.getState().pushToast(message);
});

const onOnline = (): void => {
  if (!socket || socket.connected) return;
  window.clearTimeout(retryTimer);
  socket.disconnect().connect();
};

const onOffline = (): void => {
  if (socket) setRealtime({ status: "offline" });
};

const listenTo = (connection: Socket): void => {
  connection.on("connect", onConnect);
  connection.on("connect_error", onConnectError);
  connection.on("disconnect", onDisconnect);
  connection.on(
    REALTIME_EVENTS.ready,
    handle(realtimeReadySchema, ({ sessionId }) => setRealtime({ sessionId })),
  );
  connection.on(
    REALTIME_EVENTS.libraryChanged,
    handle(libraryChangedSchema, (change) =>
      emitRealtime("libraryChanged", change),
    ),
  );
  connection.on(
    REALTIME_EVENTS.accountChanged,
    handle(accountChangedSchema, ({ logoChanged }) => {
      void refreshAccountFromServer(logoChanged).catch(() => {});
    }),
  );
  connection.on(REALTIME_EVENTS.sessionsChanged, () =>
    emitRealtime("sessionsChanged"),
  );
  connection.on(
    REALTIME_EVENTS.sessionEnded,
    handle(sessionEndedSchema, (ended) => {
      stopRealtime();
      void endSessionFromElsewhere(ended);
    }),
  );
  connection.on(REALTIME_EVENTS.presenceChanged, onPresence);
};

export const startRealtime = (): void => {
  const url = apiServerUrl();
  if (socket || !url) return;
  socket = io(url, {
    path: REALTIME_PATH,
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnectionDelay: FIRST_RETRY_MS,
    reconnectionDelayMax: MAX_RETRY_MS,
    auth: authenticate,
  });
  listenTo(socket);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  stopSharingActivity = watchDeviceActivity(sendActivity);
  setRealtime({ status: navigator.onLine ? "connecting" : "offline" });
  socket.connect();
};

export const stopRealtime = (): void => {
  if (!socket) return;
  window.clearTimeout(retryTimer);
  retryCount = 0;
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
  stopSharingActivity?.();
  stopSharingActivity = null;
  const closing = socket;
  socket = null;
  closing.removeAllListeners();
  closing.disconnect();
  setRealtime(DISCONNECTED_REALTIME);
};
