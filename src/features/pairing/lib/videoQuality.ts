interface QualityRange {
  min: number;
  ideal: number;
}

interface CaptureSize {
  width: QualityRange;
  height: QualityRange;
}

interface DeviceMemoryNavigator {
  deviceMemory?: number;
}

const FULL_HD: CaptureSize = {
  width: { min: 1280, ideal: 1920 },
  height: { min: 720, ideal: 1080 },
};

const HD: CaptureSize = {
  width: { min: 1280, ideal: 1280 },
  height: { min: 720, ideal: 720 },
};

const FRAME_RATE: QualityRange = { min: 24, ideal: 30 };
const ASPECT_RATIO = 16 / 9;
const LOW_END_MEMORY_GB = 2;
const LOW_END_CORES = 4;

const isLowEndDevice = (): boolean => {
  const { deviceMemory } = navigator as Navigator & DeviceMemoryNavigator;
  return (
    (deviceMemory !== undefined && deviceMemory <= LOW_END_MEMORY_GB) ||
    navigator.hardwareConcurrency < LOW_END_CORES
  );
};

const captureProfile = (withFloors: boolean): MediaTrackConstraints => {
  const size = isLowEndDevice() ? HD : FULL_HD;
  const range = ({ min, ideal }: QualityRange) =>
    withFloors ? { min, ideal } : { ideal };
  return {
    width: range(size.width),
    height: range(size.height),
    frameRate: range(FRAME_RATE),
    aspectRatio: { ideal: ASPECT_RATIO },
  };
};

export const videoCapture = (): MediaTrackConstraints => captureProfile(true);

export const preferredVideoCapture = (): MediaTrackConstraints =>
  captureProfile(false);

export const MAX_VIDEO_BITRATE = 6_000_000;

export const START_VIDEO_BITRATE = 2_500_000;

export const MAX_VIDEO_FRAMERATE = 30;

export const PREFERRED_VIDEO_CODECS = [
  "video/h264",
  "video/vp8",
  "video/rtx",
] as const;

export const PREFERRED_AUDIO_CODECS = ["audio/opus"] as const;

export const VIDEO_CONTENT_HINT = "detail";

export const VIDEO_DEGRADATION_PREFERENCE: RTCDegradationPreference =
  "maintain-resolution";

export const PLAYOUT_DELAY_SECONDS = 0.1;
