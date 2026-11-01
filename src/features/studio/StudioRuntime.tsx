import { useEffect, useMemo } from "react";
import { useProductionStore } from "./store/productionStore";
import { useEditorStore } from "./store/editorStore";
import { retainSources } from "./lib/cameraService";
import { retainRemoteCameras, setRemoteViewersLive } from "./lib/remoteCameras";
import { isLocalCamera } from "./types/mediaSource";
import { publishStreams } from "./lib/outputStreams";
import { publishProgram, startOutputPublisher } from "./lib/outputPublisher";
import { publishPreview, startPreviewPublisher } from "./lib/previewPublisher";
import { previewSceneOf, referencedSourceIds } from "./lib/productionFactory";
import { useOperatorStreams } from "./hooks/useOperatorStreams";
import { useOutputConnection } from "./hooks/useOutputConnection";
import { useDeckAutoPlay } from "./hooks/useDeckAutoPlay";
import { ProgramAudio } from "./program/ProgramAudio";

const PREVIEW_PUBLISH_DELAY_MS = 250;

export const StudioRuntime = () => {
  const production = useProductionStore((state) => state.production);
  const isStudioOpen = useEditorStore((state) => state.isStudioOpen);
  const connection = useOutputConnection();
  const streams = useOperatorStreams();
  const program = production?.program ?? null;
  const scenes = production?.scenes;
  const sources = production?.sources;
  const isOutputActive = connection !== "closed";
  const isLoaded = production !== null;
  const previewScene = production ? previewSceneOf(production) : null;

  const neededSourceIds = useMemo(() => {
    const ids = new Set<string>();
    if (isStudioOpen)
      for (const scene of scenes ?? [])
        for (const id of referencedSourceIds(scene.layers)) ids.add(id);
    if (isStudioOpen || isOutputActive)
      for (const id of referencedSourceIds(program?.layers ?? [])) ids.add(id);
    return ids;
  }, [scenes, program, isStudioOpen, isOutputActive]);

  useEffect(() => {
    startOutputPublisher();
    startPreviewPublisher();
  }, []);

  useEffect(() => {
    if (!previewScene) return;
    const timer = window.setTimeout(
      () => publishPreview(previewScene),
      PREVIEW_PUBLISH_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [previewScene]);

  useEffect(() => {
    if (isLoaded) publishProgram(program);
  }, [isLoaded, program]);

  useEffect(() => {
    retainSources(
      (sources ?? [])
        .filter(isLocalCamera)
        .filter((source) => neededSourceIds.has(source.id)),
    );
  }, [sources, neededSourceIds]);

  useEffect(() => {
    if (!sources) return;
    retainRemoteCameras(
      new Set(
        sources
          .filter((source) => !isLocalCamera(source))
          .map((source) => source.id),
      ),
    );
  }, [sources]);

  useEffect(() => {
    setRemoteViewersLive(new Set(referencedSourceIds(program?.layers ?? [])));
  }, [program]);

  useEffect(() => {
    publishStreams(streams);
  }, [streams]);

  useDeckAutoPlay(program);

  return <ProgramAudio program={program} streams={streams} />;
};
