import { useEffect } from "react";
import { isCameraSupported, refreshDevices } from "../lib/cameraService";
import { useCameraStore, type InputDevice } from "../store/cameraStore";

export interface LocalCameras {
  cameras: InputDevice[];
  activeCamera: InputDevice | null;
  needsAccess: boolean;
  isSupported: boolean;
}

export const useLocalCameras = (
  chosenDeviceId: string | null,
): LocalCameras => {
  const cameras = useCameraStore((state) => state.cameras);
  const hasDeviceLabels = useCameraStore((state) => state.hasDeviceLabels);
  const devicesLoaded = useCameraStore((state) => state.devicesLoaded);
  const isSupported = isCameraSupported();

  useEffect(() => {
    void refreshDevices();
  }, []);

  return {
    cameras,
    activeCamera:
      cameras.find((camera) => camera.deviceId === chosenDeviceId) ??
      cameras[0] ??
      null,
    needsAccess: isSupported && devicesLoaded && !hasDeviceLabels,
    isSupported,
  };
};
