import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import { useAutoHideChrome } from "../../hooks/useAutoHideChrome";
import { useBgMap } from "../../hooks/useBgMap";
import { useProjectionFullscreen } from "../../hooks/useProjectionFullscreen";
import { useViewShortcuts } from "../../hooks/useViewShortcuts";
import { ProjectionFullscreenButton } from "@/components/shared/ProjectionFullscreenButton";
import {
  MEDIA_SYNC_TOLERANCE_SECONDS,
  openPresentChannel,
  syncedPosition,
  type PresentState,
} from "../../lib/presentChannel";
import type { VideoSurfaceHandle } from "../../components/media/VideoSurface";
import { useOpenerLiveComposition } from "../stream/lib/useOpenerComposition";
import { useMirroredStreamOverlays } from "../stream/lib/streamOverlayStore";
import { useOverlayContentSync } from "../stream/lib/useOverlayContentSync";
import { useDeck } from "./useDeck";
import { applyPresentAssets } from "./lib/presentAssets";
import { buildStageFrame } from "./stageContent";
import { SecondaryPip } from "./SecondaryPip";
import { Stage } from "./Stage";
import { documentTitle } from "../../lib/appInfo";

const HINT_DELAY_MS = 2500;

export const PresentWindow = () => {
  const prefs = useStore((s) => s.prefs);
  const load = useStore((s) => s.load);

  const [state, setState] = useState<PresentState | null>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useProjectionFullscreen();
  useViewShortcuts({ onToggleFullscreen: toggleFullscreen });
  /* The fullscreen button stays visible until the window fills the screen, since it is how you get back onto the projector. */
  const { visible: isChromeVisible } = useAutoHideChrome({
    enabled: isFullscreen,
    delayMs: HINT_DELAY_MS,
  });
  const lastReloadKey = useRef<string>("");
  const videoRef = useRef<VideoSurfaceHandle>(null);
  const secondaryVideoRef = useRef<VideoSurfaceHandle>(null);

  const secondary = state?.secondary;
  const composition = useOpenerLiveComposition(secondary?.kind === "stream");
  const streamOverlays = useMirroredStreamOverlays();
  useOverlayContentSync(streamOverlays);

  useEffect(() => {
    const channel = openPresentChannel((msg) => {
      if (msg.type === "state") {
        if (msg.state.assets) applyPresentAssets(msg.state.assets);
        setState(msg.state);
        return;
      }
      if (msg.type !== "media-sync") return;
      const surface =
        msg.target === "secondary"
          ? secondaryVideoRef.current
          : videoRef.current;
      if (!surface) return;
      const expected = syncedPosition(msg.sync);
      if (
        Math.abs(surface.getCurrentTime() - expected) >
        MEDIA_SYNC_TOLERANCE_SECONDS
      )
        surface.seekTo(expected);
    });
    channel.postMessage({ type: "request-state" });
    return () => channel.close();
  }, []);

  useEffect(() => {
    document.title = documentTitle("Live");
    document.body.classList.add("bg-stage");
  }, []);

  const claimFocus = () => {
    try {
      window.focus();
    } catch {}
  };

  const override = useMemo(
    () => ({ doc: state?.doc, item: state?.item }),
    [state?.doc, state?.item],
  );
  const deck = useDeck(state?.kind, state?.id, override);
  const bgMap = useBgMap();

  useEffect(() => {
    if (!state || state.doc) return;
    const stale = !deck || (!state.item && state.rev && deck.rev !== state.rev);
    if (!stale) return;
    const key = `${state.kind}:${state.id}:${state.rev || ""}`;
    if (lastReloadKey.current === key) return;
    lastReloadKey.current = key;
    void load();
    const timer = window.setTimeout(() => {
      if (lastReloadKey.current === key) lastReloadKey.current = "";
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [state, deck, load]);

  const media = useStore((s) => s.media);
  const frame =
    deck && state
      ? buildStageFrame(
          deck,
          deck.slides[state.slideIndex],
          bgMap,
          prefs.transition,
          media,
        )
      : null;

  const fullscreenButton = (
    <ProjectionFullscreenButton
      isFullscreen={isFullscreen}
      visible={isChromeVisible}
      onToggle={toggleFullscreen}
    />
  );

  if (!state || !frame) {
    return (
      <div onPointerDown={claimFocus} className="fixed inset-0 bg-stage">
        {fullscreenButton}
      </div>
    );
  }

  return (
    <div onPointerDown={claimFocus} className="fixed inset-0 bg-stage">
      <Stage
        slideIndex={state.slideIndex}
        content={frame.content}
        animation={frame.animation}
        view={state.view}
        zoom={state.zoom}
        pan={state.pan}
        onPanBy={() => {}}
        durationMs={prefs.transitionDuration}
        easing={prefs.easing}
        playback={state.media}
        videoRef={videoRef}
      />
      {secondary && (
        <SecondaryPip
          secondary={secondary}
          stream={composition.primary}
          playback={secondary.media}
          videoRef={secondaryVideoRef}
          overlays={streamOverlays}
          cameras={composition.secondaries}
        />
      )}
      {fullscreenButton}
    </div>
  );
};
