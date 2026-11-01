import { useEffect, useEffectEvent, useRef, useState } from "react";
import { uid } from "../../../lib/id";
import { usePairingMode } from "../../pairing/lib/usePairingMode";
import { keepRemoteCamera, releaseRemoteCamera } from "../lib/remoteCameras";
import { useSourceState } from "../store/cameraStore";
import { saveRemoteCamera } from "../store/productionActions";
import { CodePairing } from "./CodePairing";
import { NearbyDevices } from "./NearbyDevices";

const DEFAULT_DEVICE_NAME = "Phone camera";
const NAME_WAIT_MS = 1200;

interface RemoteCameraPaneProps {
  targetSourceId: string | null;
  onConnected: (sourceId: string) => void;
}

export const RemoteCameraPane = ({
  targetSourceId,
  onConnected,
}: RemoteCameraPaneProps) => {
  const [pairingId] = useState(uid);
  const { mode, resetCount, reset, switchToCode, switchToOneTap } =
    usePairingMode();
  const { status, deviceName } = useSourceState(pairingId);
  const isFinishedRef = useRef(false);

  useEffect(
    () => () => {
      if (!isFinishedRef.current) releaseRemoteCamera(pairingId);
    },
    [pairingId],
  );

  const finish = useEffectEvent((name: string) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    const sourceId = targetSourceId ?? pairingId;
    saveRemoteCamera(sourceId, name);
    keepRemoteCamera(pairingId, sourceId);
    onConnected(sourceId);
  });

  useEffect(() => {
    if (status !== "live") return;
    if (deviceName) {
      finish(deviceName);
      return;
    }
    const timer = window.setTimeout(
      () => finish(DEFAULT_DEVICE_NAME),
      NAME_WAIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [status, deviceName]);

  return mode === "auto" ? (
    <NearbyDevices pairingId={pairingId} onUseCode={switchToCode} />
  ) : (
    <CodePairing
      key={resetCount}
      pairingId={pairingId}
      onRestart={reset}
      onUseOneTap={switchToOneTap}
    />
  );
};
