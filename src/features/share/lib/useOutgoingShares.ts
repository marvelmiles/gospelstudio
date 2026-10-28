import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../store/useStore";
import { useBackgroundKeepAlive } from "../../../hooks/useBackgroundKeepAlive";
import { useScreenWakeLock } from "../../../hooks/useScreenWakeLock";
import { packBackupZip } from "../../../lib/backup";
import {
  buildBackup,
  describeSelection,
  type BackupSource,
} from "../../../lib/backupPayload";
import {
  isSelectionEmpty,
  selectionCount,
  type BackupSelection,
} from "../../../lib/shareSelection";
import {
  sendLibraryTo,
  type SendState,
  type ShareConnector,
} from "./shareSession";
import type { ShareDevice } from "./shareSignaling";

export type OutgoingState = SendState | "queued";

export interface OutgoingShare {
  deviceId: string;
  name: string;
  state: OutgoingState;
  sentBytes: number;
  totalBytes: number;
}

export type OutgoingShareMap = Readonly<Record<string, OutgoingShare>>;

export interface OutgoingShareOptions {
  connectTo: (target: ShareDevice) => ShareConnector | null;
  deviceName: string;
  onDeviceLost?: (device: ShareDevice, reason: string) => void;
  onAllSent?: () => void;
  onNothingLeft?: () => void;
}

export interface OutgoingShares {
  transfers: OutgoingShareMap;
  isBusy: boolean;
  progress: number | null;
  send: (targets: ShareDevice[], selection: BackupSelection) => Promise<void>;
  stopDevice: (deviceId: string) => void;
  stopAll: () => void;
  reset: () => void;
}

const ACTIVE_STATES: readonly OutgoingState[] = [
  "queued",
  "connecting",
  "asking",
  "sending",
  "importing",
];

export const isTransferActive = (state: OutgoingState): boolean =>
  ACTIVE_STATES.includes(state);

export const transferPercent = (transfer: OutgoingShare): number => {
  if (transfer.state === "done") return 100;
  if (transfer.totalBytes <= 0) return 0;
  return Math.min(
    99,
    Math.round((transfer.sentBytes / transfer.totalBytes) * 100),
  );
};

const sourceFrom = (
  state: ReturnType<typeof useStore.getState>,
): BackupSource => ({
  manuscripts: state.manuscripts,
  scriptures: state.scriptures,
  media: state.media,
  themes: state.themes,
  backgrounds: state.backgrounds,
  audio: state.audio,
  overlayPresets: state.overlayPresets,
  prefs: state.prefs,
});

const overallProgress = (transfers: OutgoingShareMap): number | null => {
  const rows = Object.values(transfers).filter(
    (row) => row.state !== "stopped" && row.totalBytes > 0,
  );
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.totalBytes, 0);
  const moved = rows.reduce(
    (sum, row) =>
      sum +
      (row.state === "done"
        ? row.totalBytes
        : Math.min(row.sentBytes, row.totalBytes)),
    0,
  );
  return Math.round((moved / total) * 100);
};

export const useOutgoingShares = ({
  connectTo,
  deviceName,
  onDeviceLost,
  onAllSent,
  onNothingLeft,
}: OutgoingShareOptions): OutgoingShares => {
  const pushToast = useStore((s) => s.pushToast);
  const [transfers, setTransfers] = useState<OutgoingShareMap>({});
  const [isBusy, setIsBusy] = useState(false);
  const runRef = useRef(0);
  const stoppedDevicesRef = useRef(new Set<string>());
  const callbacksRef = useRef({ onDeviceLost, onAllSent, onNothingLeft });

  useEffect(() => {
    callbacksRef.current = { onDeviceLost, onAllSent, onNothingLeft };
  });

  useScreenWakeLock(isBusy);
  useBackgroundKeepAlive(isBusy);

  useEffect(
    () => () => {
      runRef.current += 1;
    },
    [],
  );

  const send = useCallback(
    async (targets: ShareDevice[], selection: BackupSelection) => {
      if (targets.length === 0 || isSelectionEmpty(selection)) return;
      runRef.current += 1;
      const run = runRef.current;
      const isCurrent = () => runRef.current === run;
      const stoppedDevices = new Set<string>();
      stoppedDevicesRef.current = stoppedDevices;

      const patch = (targetId: string, changes: Partial<OutgoingShare>) => {
        if (!isCurrent()) return;
        setTransfers((rows) => {
          const row = rows[targetId];
          if (!row) return rows;
          return { ...rows, [targetId]: { ...row, ...changes } };
        });
      };
      const drop = (targetId: string) => {
        if (!isCurrent()) return;
        setTransfers((rows) => withoutRow(rows, targetId));
      };

      setIsBusy(true);
      setTransfers(
        Object.fromEntries(
          targets.map((target) => [
            target.id,
            {
              deviceId: target.id,
              name: target.name,
              state: "queued" as const,
              sentBytes: 0,
              totalBytes: 0,
            },
          ]),
        ),
      );

      const source = sourceFrom(useStore.getState());
      const summary = describeSelection(source, selection);

      let archive: Blob;
      try {
        const { payload, fileIds } = buildBackup(source, selection);
        archive = await packBackupZip(payload, fileIds);
      } catch {
        if (!isCurrent()) return;
        setIsBusy(false);
        setTransfers({});
        pushToast("Could not gather that data to send.", "error");
        callbacksRef.current.onNothingLeft?.();
        return;
      }

      let deliveredCount = 0;
      for (const target of targets) {
        if (!isCurrent()) return;
        const shouldStop = () => !isCurrent() || stoppedDevices.has(target.id);
        if (shouldStop()) continue;
        const connect = connectTo(target);
        if (!connect) {
          drop(target.id);
          callbacksRef.current.onDeviceLost?.(
            target,
            `${target.name} can no longer be reached.`,
          );
          continue;
        }
        patch(target.id, { totalBytes: archive.size });
        const outcome = await sendLibraryTo({
          connect,
          fromName: deviceName,
          targetName: target.name,
          archive,
          summary,
          items: selectionCount(selection),
          onState: (state) => patch(target.id, { state }),
          onProgress: (sentBytes) => patch(target.id, { sentBytes }),
          shouldStop,
        });
        if (!isCurrent()) return;

        if (outcome.state === "done") {
          deliveredCount += 1;
          patch(target.id, { state: "done" });
          continue;
        }
        drop(target.id);
        if (outcome.state !== "stopped")
          callbacksRef.current.onDeviceLost?.(target, outcome.message);
      }

      setIsBusy(false);
      setTransfers({});
      if (deliveredCount > 0) callbacksRef.current.onAllSent?.();
      else callbacksRef.current.onNothingLeft?.();
    },
    [connectTo, deviceName, pushToast],
  );

  const reset = useCallback(() => {
    runRef.current += 1;
    stoppedDevicesRef.current = new Set();
    setTransfers({});
    setIsBusy(false);
  }, []);

  const stopAll = useCallback(() => {
    reset();
    callbacksRef.current.onNothingLeft?.();
  }, [reset]);

  const stopDevice = useCallback(
    (targetId: string) => {
      stoppedDevicesRef.current.add(targetId);
      const remaining = withoutRow(transfers, targetId);
      const isAnythingLeft = Object.values(remaining).some((row) =>
        isTransferActive(row.state),
      );
      if (!isAnythingLeft) {
        stopAll();
        return;
      }
      setTransfers((rows) => withoutRow(rows, targetId));
    },
    [stopAll, transfers],
  );

  const progress = useMemo(() => overallProgress(transfers), [transfers]);

  return { transfers, isBusy, progress, send, stopDevice, stopAll, reset };
};

const withoutRow = (
  rows: OutgoingShareMap,
  targetId: string,
): OutgoingShareMap => {
  if (!rows[targetId]) return rows;
  const next = { ...rows };
  delete next[targetId];
  return next;
};
