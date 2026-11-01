import { useEffect, useState } from "react";
import {
  openCameraPreview,
  stopPreviewStream,
  type CameraFailure,
} from "../lib/cameraService";
import { useCameraStore } from "../store/cameraStore";
import { useSources } from "../store/productionStore";
import { isLocalCamera } from "../types/mediaSource";

interface PreviewResult {
  deviceId: string;
  stream: MediaStream | null;
  failure: CameraFailure | null;
}

export interface CameraPreview {
  stream: MediaStream | null;
  failure: CameraFailure | null;
  isStarting: boolean;
}

const useSharedStream = (deviceId: string | null): MediaStream | null => {
  const sources = useSources();
  const sourceId =
    sources.filter(isLocalCamera).find((source) => source.deviceId === deviceId)
      ?.id ?? null;
  return useCameraStore((state) => {
    const runtime = sourceId ? state.sources[sourceId] : undefined;
    return runtime?.status === "live" ? runtime.stream : null;
  });
};

export const useCameraPreview = (deviceId: string | null): CameraPreview => {
  const shared = useSharedStream(deviceId);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const needsOwnStream = Boolean(deviceId) && !shared;

  useEffect(() => {
    if (!deviceId || !needsOwnStream) return;
    let isCancelled = false;
    let opened: MediaStream | null = null;
    void openCameraPreview(deviceId).then((outcome) => {
      if (outcome instanceof MediaStream) {
        if (isCancelled) {
          stopPreviewStream(outcome);
          return;
        }
        opened = outcome;
        setResult({ deviceId, stream: outcome, failure: null });
        return;
      }
      if (!isCancelled) setResult({ deviceId, stream: null, failure: outcome });
    });
    return () => {
      isCancelled = true;
      stopPreviewStream(opened);
    };
  }, [deviceId, needsOwnStream]);

  if (!deviceId) return { stream: null, failure: null, isStarting: false };
  if (shared) return { stream: shared, failure: null, isStarting: false };
  const current = result?.deviceId === deviceId ? result : null;
  return {
    stream: current?.stream ?? null,
    failure: current?.failure ?? null,
    isStarting: current === null,
  };
};
