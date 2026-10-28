import { useEffect } from "react";

type AudioContextConstructor = new () => AudioContext;

interface AudioWindow extends Window {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
}

const KEEP_ALIVE_GAIN = 0.001;
const KEEP_ALIVE_FREQUENCY = 30;

const audioContextConstructor = (): AudioContextConstructor | null => {
  const scope = window as AudioWindow;
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
};

export const useBackgroundKeepAlive = (isEnabled: boolean): void => {
  useEffect(() => {
    if (!isEnabled) return;
    const AudioContextClass = audioContextConstructor();
    if (!AudioContextClass) return;

    let context: AudioContext;
    try {
      context = new AudioContextClass();
    } catch {
      return;
    }

    const gain = context.createGain();
    gain.gain.value = KEEP_ALIVE_GAIN;
    const oscillator = context.createOscillator();
    oscillator.frequency.value = KEEP_ALIVE_FREQUENCY;
    oscillator.connect(gain);
    gain.connect(context.destination);

    try {
      oscillator.start();
    } catch {}

    const resume = () => void context.resume().catch(() => {});
    resume();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);

    return () => {
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
      try {
        oscillator.stop();
      } catch {}
      oscillator.disconnect();
      gain.disconnect();
      void context.close().catch(() => {});
    };
  }, [isEnabled]);
};
