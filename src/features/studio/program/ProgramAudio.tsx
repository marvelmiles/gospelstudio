import { memo, useEffect, useMemo, useRef } from "react";
import { useResumePlaybackOnVisible } from "../../../hooks/useResumePlaybackOnVisible";
import type { CameraLayer } from "../types/layer";
import type { ProgramSnapshot } from "../types/production";
import type { SourceStreams } from "../lib/outputStreams";
import { setRecordingCameraAudio } from "../recording/programRecorder";

interface ProgramAudioProps {
  program: ProgramSnapshot | null;
  streams: SourceStreams;
}

const audibleSourceIds = (program: ProgramSnapshot | null): string[] => [
  ...new Set(
    (program?.layers ?? [])
      .filter(
        (layer): layer is CameraLayer =>
          layer.type === "camera" &&
          layer.visible &&
          !layer.muted &&
          Boolean(layer.sourceId),
      )
      .flatMap((layer) => (layer.sourceId ? [layer.sourceId] : [])),
  ),
];

export const ProgramAudio = ({ program, streams }: ProgramAudioProps) => {
  const sourceIds = useMemo(() => audibleSourceIds(program), [program]);

  useEffect(() => {
    setRecordingCameraAudio(
      sourceIds.flatMap((sourceId) => {
        const stream = streams[sourceId];
        return stream ? [stream] : [];
      }),
    );
  }, [sourceIds, streams]);

  return (
    <>
      {sourceIds.map((sourceId) => {
        const stream = streams[sourceId];
        return stream ? <SourceAudio key={sourceId} stream={stream} /> : null;
      })}
    </>
  );
};

const SourceAudio = memo(({ stream }: { stream: MediaStream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useResumePlaybackOnVisible(audioRef);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.srcObject = stream;
    void audio.play().catch(() => {});
    const playNewTracks = () => void audio.play().catch(() => {});
    stream.addEventListener("addtrack", playNewTracks);
    return () => stream.removeEventListener("addtrack", playNewTracks);
  }, [stream]);

  return <audio ref={audioRef} autoPlay hidden />;
});

SourceAudio.displayName = "SourceAudio";
