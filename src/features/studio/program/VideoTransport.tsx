import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoLayer } from "../types/layer";
import { updateLiveLayer } from "../store/programActions";

export const VideoTransport = ({ layer }: { layer: VideoLayer }) => {
  const { playing, restartToken } = layer.playback;
  const setPlayback = (playback: VideoLayer["playback"]) =>
    updateLiveLayer<VideoLayer>(layer.id, { playback });

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant={playing ? "secondary" : "default"}
        onClick={() => setPlayback({ playing: !playing, restartToken })}
        className="flex-1"
      >
        {playing ? <Pause /> : <Play />}
        {playing ? "Pause" : "Play"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          setPlayback({ playing: true, restartToken: restartToken + 1 })
        }
        title={`Play ${layer.name} again from the start`}
      >
        <RotateCcw />
        Restart
      </Button>
    </div>
  );
};
