import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../store/useStore";
import {
  isSelectionEmpty,
  type BackupSelection,
} from "../../../lib/shareSelection";
import { connectToNetworkDevice } from "./networkShareConnection";
import {
  forgetPairedDevice,
  pairedDeviceConnector,
  usePairedDevices,
} from "./pairedShareDevices";
import { useOutgoingShares, type OutgoingShareMap } from "./useOutgoingShares";
import { useShareLobby, type LobbyStatus } from "./useShareLobby";
import type { ShareDevice } from "./shareSignaling";

export interface QuickShareOptions {
  announce?: boolean;
  onSent?: () => void;
  onReset?: () => void;
}

export interface QuickShare {
  status: LobbyStatus;
  deviceName: string;
  room: string | null;
  deviceId: string;
  devices: ShareDevice[];
  transfers: OutgoingShareMap;
  selectedDeviceIds: string[];
  toggleDevice: (deviceId: string) => void;
  selectDevice: (deviceId: string) => void;
  forgetDevice: (deviceId: string) => void;
  isSearching: boolean;
  isBusy: boolean;
  progress: number | null;
  canSend: boolean;
  send: (selection: BackupSelection) => Promise<void>;
  stopDevice: (deviceId: string) => void;
  stopAll: () => void;
  refresh: () => void;
}

export const useQuickShare = ({
  announce = true,
  onSent,
  onReset,
}: QuickShareOptions = {}): QuickShare => {
  const pushToast = useStore((s) => s.pushToast);
  const lobby = useShareLobby({ announce });
  const pairedDevices = usePairedDevices();
  const [pickedDeviceIds, setPickedDeviceIds] = useState<string[]>([]);
  const [lostDeviceIds, setLostDeviceIds] = useState<string[]>([]);
  const [stoppedDeviceIds, setStoppedDeviceIds] = useState<string[]>([]);
  const callbacksRef = useRef({ onSent, onReset });

  useEffect(() => {
    callbacksRef.current = { onSent, onReset };
  });

  const handleDeviceLost = useCallback(
    (device: ShareDevice, reason: string) => {
      setLostDeviceIds((current) => [...new Set([...current, device.id])]);
      setPickedDeviceIds((current) => current.filter((id) => id !== device.id));
      pushToast(reason || `${device.name} did not take it.`, "error");
    },
    [pushToast],
  );

  const handleAllSent = useCallback(() => {
    setPickedDeviceIds([]);
    setStoppedDeviceIds([]);
    callbacksRef.current.onSent?.();
  }, []);

  const handleNothingLeft = useCallback(() => {
    setPickedDeviceIds([]);
    setStoppedDeviceIds([]);
    callbacksRef.current.onReset?.();
  }, []);

  const { room, deviceId, deviceName } = lobby;
  const connectTo = useCallback(
    (target: ShareDevice) =>
      pairedDeviceConnector(target.id) ??
      (room
        ? connectToNetworkDevice({
            room,
            fromId: deviceId,
            fromName: deviceName,
            target,
          })
        : null),
    [deviceId, deviceName, room],
  );

  const outgoing = useOutgoingShares({
    connectTo,
    deviceName,
    onDeviceLost: handleDeviceLost,
    onAllSent: handleAllSent,
    onNothingLeft: handleNothingLeft,
  });

  const devices = useMemo(() => {
    const hidden = new Set([...lostDeviceIds, ...stoppedDeviceIds]);
    const listed = [
      ...lobby.devices.filter((device) => !hidden.has(device.id)),
      ...pairedDevices,
    ];
    const sending = Object.values(outgoing.transfers)
      .filter((row) => !listed.some((device) => device.id === row.deviceId))
      .map((row) => ({ id: row.deviceId, name: row.name, lastSeen: 0 }));
    return [...listed, ...sending];
  }, [
    lobby.devices,
    lostDeviceIds,
    outgoing.transfers,
    pairedDevices,
    stoppedDeviceIds,
  ]);

  const selectedDeviceIds = useMemo(
    () =>
      pickedDeviceIds.filter((id) =>
        devices.some((device) => device.id === id),
      ),
    [devices, pickedDeviceIds],
  );

  const toggleDevice = useCallback((deviceId: string) => {
    setPickedDeviceIds((current) =>
      current.includes(deviceId)
        ? current.filter((id) => id !== deviceId)
        : [...current, deviceId],
    );
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    setPickedDeviceIds((current) =>
      current.includes(deviceId) ? current : [...current, deviceId],
    );
  }, []);

  const forgetDevice = useCallback((deviceId: string) => {
    setPickedDeviceIds((current) => current.filter((id) => id !== deviceId));
    forgetPairedDevice(deviceId);
  }, []);

  const { reset, stopDevice: stopOutgoingDevice } = outgoing;
  const refresh = useCallback(() => {
    const wasBusy = outgoing.isBusy;
    reset();
    setLostDeviceIds([]);
    setStoppedDeviceIds([]);
    setPickedDeviceIds([]);
    lobby.refresh();
    if (wasBusy) callbacksRef.current.onReset?.();
  }, [lobby, outgoing.isBusy, reset]);

  const stopDevice = useCallback(
    (deviceId: string) => {
      setStoppedDeviceIds((current) => [...new Set([...current, deviceId])]);
      setPickedDeviceIds((current) => current.filter((id) => id !== deviceId));
      stopOutgoingDevice(deviceId);
    },
    [stopOutgoingDevice],
  );

  const targets = useMemo(
    () => devices.filter((device) => selectedDeviceIds.includes(device.id)),
    [devices, selectedDeviceIds],
  );

  const { send } = outgoing;
  const sendSelection = useCallback(
    (selection: BackupSelection) => send(targets, selection),
    [send, targets],
  );

  return {
    status: lobby.status,
    deviceName: lobby.deviceName,
    room: lobby.room,
    deviceId: lobby.deviceId,
    devices,
    transfers: outgoing.transfers,
    selectedDeviceIds,
    toggleDevice,
    selectDevice,
    forgetDevice,
    isSearching: lobby.status === "starting",
    isBusy: outgoing.isBusy,
    progress: outgoing.progress,
    canSend: !outgoing.isBusy && targets.length > 0,
    send: sendSelection,
    stopDevice,
    stopAll: outgoing.stopAll,
    refresh,
  };
};

export const canSendSelection = (
  quickShare: QuickShare,
  selection: BackupSelection,
): boolean => quickShare.canSend && !isSelectionEmpty(selection);
