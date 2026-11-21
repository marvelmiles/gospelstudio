import { useEffect, useState } from "react";
import {
  readProgramSoundLevel,
  useProgramCaptureStore,
} from "../capture/programCapture";

const SAMPLE_INTERVAL_MS = 100;

export const useProgramSoundLevel = (): number | null => {
  const isActive = useProgramCaptureStore((state) => state.isActive);
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const timer = window.setInterval(
      () => setLevel(readProgramSoundLevel()),
      SAMPLE_INTERVAL_MS,
    );
    return () => {
      window.clearInterval(timer);
      setLevel(null);
    };
  }, [isActive]);

  return isActive ? level : null;
};
