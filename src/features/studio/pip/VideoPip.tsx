import type { KeyboardEvent } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { MiniButton } from "@/components/shared/MiniButton";
import type { VideoLayer } from "../types/layer";
import { setItemPlayback } from "../store/itemActions";
import { PipFrame } from "./PipFrame";
import { PipToolbar } from "./PipToolbar";

interface VideoPipProps {
  layer: VideoLayer;
  isLive: boolean;
  sceneName: string;
  stackIndex: number;
}

export const VideoPip = ({
  layer,
  isLive,
  sceneName,
  stackIndex,
}: VideoPipProps) => {
  const { playing, restartToken } = layer.playback;

  const togglePlaying = () =>
    setItemPlayback(layer.id, { playing: !playing, restartToken });

  const restart = () =>
    setItemPlayback(layer.id, {
      playing: true,
      restartToken: restartToken + 1,
    });

  const handleKey = (event: KeyboardEvent<HTMLDivElement>): boolean => {
    if (!isLive) return false;
    if (event.key === " ") togglePlaying();
    else if (event.key === "Home") restart();
    else return false;
    return true;
  };

  return (
    <PipFrame
      layer={layer}
      isLive={isLive}
      sceneName={sceneName}
      stackIndex={stackIndex}
      shortcutsHint="Shortcuts active: Space to play or pause, Home to restart, Esc."
      onKeyDown={handleKey}
      controls={
        <PipToolbar layerId={layer.id}>
          <MiniButton
            icon={playing ? Pause : Play}
            title={playing ? "Pause (Space)" : "Play (Space)"}
            disabled={!isLive}
            onClick={togglePlaying}
          />
          <MiniButton
            icon={RotateCcw}
            title="Play again from the start (Home)"
            disabled={!isLive}
            onClick={restart}
          />
          <span className="min-w-0 flex-1 truncate text-center text-[10.5px] font-semibold text-subtle-foreground">
            {isLive
              ? playing
                ? "Playing"
                : "Paused"
              : "Plays once it is live"}
          </span>
        </PipToolbar>
      }
    />
  );
};
