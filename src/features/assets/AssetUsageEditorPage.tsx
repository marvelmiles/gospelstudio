import { useMemo, useRef, useState, type ReactNode } from "react";
import type { MediaSurfaceHandle } from "@/hooks/useMediaElementPlayback";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Music, Undo2 } from "lucide-react";
import type {
  AudioItem,
  AudioSettings,
  Background,
  ImageSettings,
  MediaItem,
  VideoSettings,
} from "../../types";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { useWindowSize } from "usehooks-ts";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useDraftHistory } from "../../hooks/useDraftHistory";
import { useMediaPlayback } from "../../hooks/useMediaPlayback";
import { useSpacePlayPause } from "../../hooks/useSpacePlayPause";
import { useUndoRedoShortcuts } from "../../hooks/useUndoRedoShortcuts";
import { useValidation } from "../../hooks/useValidation";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import {
  useUnsavedChanges,
  UNSAVED_CHANGES_MESSAGE,
} from "../../hooks/useUnsavedChanges";
import { useBlobUrl } from "../../lib/blobUrls";
import { shallowEqual } from "../../lib/equality";
import { mediaSurfaceProps } from "../../lib/mediaKeys";
import { formatTrimmedDuration } from "../../lib/media";
import { settingsGrouping } from "../../lib/settingsHistory";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InfoTip } from "@/components/shared/InfoTip";
import { MissingPage } from "@/components/shared/MissingPage";
import { EditorSplitLayout } from "../../components/layout/EditorSplitLayout";
import { EditorTopBar } from "../../components/layout/EditorTopBar";
import { AudioSettingsControls } from "../../components/media/AudioSettingsControls";
import { AudioPreviewCard } from "../../components/media/AudioPreviewCard";
import { AudioSurface } from "../../components/media/AudioSurface";
import { ImageLayer } from "../../components/media/ImageLayer";
import { ImageSettingsControls } from "../../components/media/ImageSettingsControls";
import { VideoSettingsControls } from "../../components/media/VideoSettingsControls";
import { VideoSurface } from "../../components/media/VideoSurface";
import { VideoTransportBar } from "../../components/media/VideoTransportBar";
import { assetUsageNote } from "../../lib/assetUsage";
import type { AssetUsageEdit, AssetUsageKind } from "../../lib/assetUsage";
import { useAssetUsageEditor } from "./assetUsageEdit";
import type { AssetUsageEditorSession } from "./assetUsageEdit";
import routes from "../../routes";

const ASSET_NOUN: Record<AssetUsageKind, string> = {
  image: "Picture",
  video: "Moving background",
  audio: "Sound",
};

const resetTitle = (canReset: boolean): string =>
  canReset
    ? "Put every adjustment back to the way this asset starts"
    : "Nothing to reset: these settings already match the asset";

const STACKED_WIDTH = 1080;
const COMPACT_WIDTH = 560;

export const AssetUsageEditorPage = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const usage = useAssetUsageEditor();
  const background = useStore((s) =>
    s.backgrounds.find((item) => item.id === assetId),
  );
  const sound = useStore((s) => s.audio.find((item) => item.id === assetId));
  const clip = useStore((s) =>
    s.media.find((item) => item.id === background?.mediaId),
  );

  if (!usage)
    return (
      <MissingPage
        icon={ImageIcon}
        title="Nothing to edit here"
        message="Open a picture, clip or sound from the slide, manuscript or passage it is used on, and its settings open here."
        actionLabel="Back to dashboard"
        onAction={() => navigate(routes.dashboard())}
      />
    );

  const { edit } = usage;
  const missing = (kind: AssetUsageKind) => (
    <MissingPage
      icon={kind === "audio" ? Music : ImageIcon}
      title={`${ASSET_NOUN[kind]} not found`}
      message="It may have been removed from your library."
      actionLabel={`Back to ${edit.label}`}
      onAction={usage.back}
    />
  );

  if (edit.kind === "image")
    return background ? (
      <ImageUsageWorkspace
        key={background.id}
        background={background}
        usage={usage}
        settings={edit.settings}
        defaults={edit.defaults}
      />
    ) : (
      missing("image")
    );

  if (edit.kind === "video")
    return background && clip ? (
      <VideoUsageWorkspace
        key={clip.id}
        item={clip}
        name={background.name}
        usage={usage}
        settings={edit.settings}
        defaults={edit.defaults}
      />
    ) : (
      missing("video")
    );

  return sound ? (
    <AudioUsageWorkspace
      key={sound.id}
      item={sound}
      usage={usage}
      settings={edit.settings}
      defaults={edit.defaults}
    />
  ) : (
    missing("audio")
  );
};

interface UsageFrameProps {
  name: string;
  kind: AssetUsageKind;
  usage: AssetUsageEditorSession;
  draft: AssetUsageEdit["settings"];
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canReset: boolean;
  onSaved: () => void;
  invalid?: boolean;
  invalidReason?: string | null;
  preview: ReactNode;
  controls: ReactNode;
}

const UsageFrame = ({
  name,
  kind,
  usage,
  draft,
  dirty,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  canReset,
  onSaved,
  invalid,
  invalidReason,
  preview,
  controls,
}: UsageFrameProps) => {
  const { width } = useWindowSize();
  const pushToast = useStore((s) => s.pushToast);
  const { edit } = usage;
  const stacked = width < STACKED_WIDTH;
  const compact = width < COMPACT_WIDTH;

  useDocumentTitle(name);
  useUndoRedoShortcuts({ canUndo, canRedo, undo: onUndo, redo: onRedo });

  const resetAll = useConfirmedAction(onReset);
  const leaveGuard = useUnsavedChanges(dirty);

  const [inUse, setInUse] = useState(edit.inUse);
  const unsaved = dirty || !inUse;

  const save = () => {
    if (invalid) {
      pushToast(invalidReason ?? "Fix the highlighted fields.", "error");
      return;
    }
    if (!usage.save(draft)) {
      pushToast(`These settings could not be saved to ${edit.label}.`, "error");
      return;
    }
    onSaved();
    setInUse(true);
    pushToast(`Saved to ${edit.label}.`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTopBar
        title={name}
        compact={compact}
        backTitle={`Back to ${edit.label}`}
        onBack={usage.back}
        leading={
          <span className="inline-flex items-center gap-1.25 rounded-full border border-primary/30 bg-primary/12 py-1 pr-1.5 pl-2.25 text-[11.5px] font-semibold whitespace-nowrap text-primary-soft">
            Editing for {edit.label}
            <InfoTip title="Where changes go">
              {assetUsageNote(edit.label, kind)}
            </InfoTip>
          </span>
        }
        actions={
          compact ? (
            <IconButton
              icon={Undo2}
              title={resetTitle(canReset)}
              disabled={!canReset}
              onClick={resetAll.request}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              title={resetTitle(canReset)}
              disabled={!canReset}
              onClick={resetAll.request}
            >
              <Undo2 size={14} />
              Reset all
            </Button>
          )
        }
        dirty={unsaved}
        invalid={invalid}
        invalidReason={invalidReason}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onSave={save}
        saveLabel={`Save to ${edit.label}`}
      />

      <EditorSplitLayout
        stacked={stacked}
        preview={
          <div
            className={cn(
              "flex h-full min-h-0 flex-col justify-center",
              stacked ? "p-4" : "p-6",
            )}
          >
            {preview}
          </div>
        }
        sidebar={<div className="p-4.5">{controls}</div>}
      />

      <ConfirmDialog
        open={resetAll.prompting}
        title="Reset all settings?"
        message={`Every adjustment goes back to the way this asset sits in your library. It only reaches ${edit.label} once you save.`}
        confirmLabel="Reset all"
        onConfirm={resetAll.confirm}
        onCancel={resetAll.cancel}
      />

      <ConfirmDialog
        open={leaveGuard.prompting}
        title="Unsaved changes"
        message={UNSAVED_CHANGES_MESSAGE}
        confirmLabel="Leave without saving"
        onConfirm={leaveGuard.discard}
        onCancel={leaveGuard.cancel}
      />
    </div>
  );
};

const PreviewSurface = ({ children }: { children: ReactNode }) => (
  <div
    {...mediaSurfaceProps}
    className="relative aspect-video w-full overflow-hidden rounded-[14px] border border-border bg-black"
  >
    {children}
  </div>
);

interface ImageUsageWorkspaceProps {
  background: Background;
  usage: AssetUsageEditorSession;
  settings: ImageSettings;
  defaults: ImageSettings;
}

const ImageUsageWorkspace = ({
  background,
  usage,
  settings,
  defaults,
}: ImageUsageWorkspaceProps) => {
  const history = useDraftHistory<ImageSettings>(settings);
  const { draft } = history;
  const blobUrl = useBlobUrl(background.blobId ?? null);

  const patch = (changes: Partial<ImageSettings>) =>
    history.apply({ ...draft, ...changes }, settingsGrouping(changes, "image"));

  return (
    <UsageFrame
      name={background.name}
      kind="image"
      usage={usage}
      dirty={history.dirty}
      canUndo={history.canUndo}
      canRedo={history.canRedo}
      onUndo={history.undo}
      onRedo={history.redo}
      draft={draft}
      onReset={() => history.apply(defaults)}
      canReset={!shallowEqual(draft, defaults)}
      onSaved={history.markSaved}
      preview={
        <PreviewSurface>
          <ImageLayer
            src={blobUrl ?? background.dataUrl ?? null}
            alt={background.name}
            settings={draft}
          />
        </PreviewSurface>
      }
      controls={
        <ImageSettingsControls settings={draft} onChange={patch} narrow />
      }
    />
  );
};

interface VideoUsageWorkspaceProps {
  item: MediaItem;
  name: string;
  usage: AssetUsageEditorSession;
  settings: VideoSettings;
  defaults: VideoSettings;
}

const VideoUsageWorkspace = ({
  item,
  name,
  usage,
  settings,
  defaults,
}: VideoUsageWorkspaceProps) => {
  const history = useDraftHistory<VideoSettings>(settings);
  const { draft } = history;
  const stagePresenting = useStore(
    (s) => Boolean(s.presentation) && s.presentationMode === "stage",
  );
  const validation = useValidation();
  const videoSurfaceRef = useRef<MediaSurfaceHandle>(null);
  const video = useMediaPlayback(videoSurfaceRef, draft, { autoPlay: false });
  const duration = item.duration || video.duration || 0;
  const trimEnd = draft.trimEnd ?? duration;

  useSpacePlayPause({
    enabled: !stagePresenting,
    toggle: video.togglePlaying,
  });

  const playback = useMemo(
    () => ({
      ...video.playback,
      volume: draft.volume,
      muted: video.playback.muted || draft.muted,
    }),
    [video.playback, draft.volume, draft.muted],
  );

  const patch = (changes: Partial<VideoSettings>) =>
    history.apply({ ...draft, ...changes }, settingsGrouping(changes, "video"));

  return (
    <UsageFrame
      name={name}
      kind="video"
      usage={usage}
      dirty={history.dirty}
      canUndo={history.canUndo}
      canRedo={history.canRedo}
      onUndo={history.undo}
      onRedo={history.redo}
      draft={draft}
      onReset={() => history.apply(defaults)}
      canReset={!shallowEqual(draft, defaults)}
      onSaved={history.markSaved}
      invalid={validation.invalid}
      invalidReason={validation.message}
      preview={
        <PreviewSurface>
          <VideoSurface
            ref={videoSurfaceRef}
            item={item}
            settings={draft}
            playback={playback}
            onTimeUpdate={video.onTimeUpdate}
            onEnded={video.onEnded}
          />
          <VideoTransportBar
            playing={video.playback.playing}
            muted={playback.muted}
            volume={draft.volume}
            time={video.time}
            start={draft.trimStart}
            end={trimEnd}
            onTogglePlaying={video.togglePlaying}
            onRestart={video.restart}
            onToggleMuted={() => patch({ muted: !draft.muted })}
            onVolume={(volume) => patch({ volume })}
            onSeek={video.seekTo}
            className="absolute inset-x-3 bottom-3"
          />
        </PreviewSurface>
      }
      controls={
        <VideoSettingsControls
          settings={draft}
          onChange={patch}
          duration={duration}
          playhead={video.time}
          onIssueChange={validation.reportIssue}
          narrow
        />
      }
    />
  );
};

interface AudioUsageWorkspaceProps {
  item: AudioItem;
  usage: AssetUsageEditorSession;
  settings: AudioSettings;
  defaults: AudioSettings;
}

const AudioUsageWorkspace = ({
  item,
  usage,
  settings,
  defaults,
}: AudioUsageWorkspaceProps) => {
  const history = useDraftHistory<AudioSettings>(settings);
  const { draft } = history;
  const loopAudio = useStore((s) => s.prefs.loopAudio);
  const stagePresenting = useStore(
    (s) => Boolean(s.presentation) && s.presentationMode === "stage",
  );
  const validation = useValidation();
  const playerSurfaceRef = useRef<MediaSurfaceHandle>(null);
  const player = useMediaPlayback(playerSurfaceRef, draft, { autoPlay: false });
  const duration = item.duration || player.duration || 0;
  const trimEnd = draft.trimEnd ?? duration;

  useSpacePlayPause({
    enabled: !stagePresenting,
    toggle: player.togglePlaying,
  });

  const playback = useMemo(
    () => ({ ...player.playback, volume: draft.volume }),
    [player.playback, draft.volume],
  );

  const patch = (changes: Partial<AudioSettings>) =>
    history.apply({ ...draft, ...changes }, settingsGrouping(changes, "audio"));

  return (
    <UsageFrame
      name={item.name}
      kind="audio"
      usage={usage}
      dirty={history.dirty}
      canUndo={history.canUndo}
      canRedo={history.canRedo}
      onUndo={history.undo}
      onRedo={history.redo}
      draft={draft}
      onReset={() => history.apply(defaults)}
      canReset={!shallowEqual(draft, defaults)}
      onSaved={history.markSaved}
      invalid={validation.invalid}
      invalidReason={validation.message}
      preview={
        <AudioPreviewCard
          caption={
            duration > 0
              ? `Plays ${formatTrimmedDuration(duration, draft)}`
              : undefined
          }
        >
          <VideoTransportBar
            playing={player.playback.playing}
            muted={player.playback.muted}
            volume={draft.volume}
            time={player.time}
            start={draft.trimStart}
            end={trimEnd}
            mediaNoun="sound"
            onTogglePlaying={player.togglePlaying}
            onRestart={player.restart}
            onToggleMuted={player.toggleMuted}
            onVolume={(volume) => patch({ volume })}
            onSeek={player.seekTo}
            className="w-full"
          />
          <AudioSurface
            ref={playerSurfaceRef}
            item={item}
            settings={draft}
            loop={loopAudio}
            playback={playback}
            onTimeUpdate={player.onTimeUpdate}
            onEnded={player.onEnded}
          />
        </AudioPreviewCard>
      }
      controls={
        <AudioSettingsControls
          settings={draft}
          onChange={patch}
          duration={duration || undefined}
          playhead={player.time}
          onIssueChange={validation.reportIssue}
        />
      }
    />
  );
};
