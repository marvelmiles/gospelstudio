import { useEffect } from "react";
import { refreshDevices, requestMicrophoneAccess } from "../lib/cameraService";
import { useCameraStore, type InputDevice } from "../store/cameraStore";

export const useAudioInputDevices = (): InputDevice[] => {
  const microphones = useCameraStore((state) => state.microphones);

  useEffect(() => {
    if (useCameraStore.getState().microphones.length > 0) void refreshDevices();
    else void requestMicrophoneAccess();
  }, []);

  return microphones;
};
