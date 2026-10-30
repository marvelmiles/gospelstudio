import { useMemo, useRef } from "react";
import type { MediaSurfaceHandle } from "@/hooks/useMediaElementPlayback";
import { useLastDefined } from "@/hooks/useLastDefined";
import { useNavigate, useParams } from "react-router-dom";
import { Film, Image as ImageIcon, Undo2 } from "lucide-react";
import type { MediaItem, MediaKind } from "../../types";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { useWindowSize } from "usehooks-ts";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAutoHideChrome } from "../../hooks/useAutoHideChrome";
import { useMediaPlayback } from "../../hooks/useMediaPlayback";
import { useSpacePlayPause } from "../../hooks/useSpacePlayPause";
import { useValidation } from "../../hooks/useValidation";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import { useUndoRedoShortcuts } from "../../hooks/useUndoRedoShortcuts";
import {
  useUnsavedChanges,
  UNSAVED_CHANGES_MESSAGE,
} from "../../hooks/useUnsavedChanges";
import { useMediaUrl } from "../../lib/blobUrls";
import { mediaSurfaceProps } from "../../lib/mediaKeys";
import { findMediaItem, formatTrimmedDuration } from "../../lib/media";
import { syncedPosition } from "../../lib/presentChannel";
import { formatBytes } from "../../lib/storageStats";
import { validateName } from "../../lib/validation";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MissingPage } from "@/components/shared/MissingPage";
import { EditorSplitLayout } from "../../components/layout/EditorSplitLayout";
import { EditorTopBar } from "../../components/layout/EditorTopBar";
import { ImageLayer } from "../../components/media/ImageLayer";
import { ImageSettingsControls } from "../../components/media/ImageSettingsControls";
import { VideoSettingsControls } from "../../components/media/VideoSettingsControls";
import { VideoSurface } from "../../components/media/VideoSurface";
import { VideoTransportBar } from "../../components/media/VideoTransportBar";
import { useMediaEditor } from "./useMediaEditor";
import { useEditorReturn } from "../assets/assetLibraryNavigation";
import routes from "../../routes";

const resetTitle = (canReset: boolean): string =>
  canReset
    ? "Put every adjustment back to the way this file started"
    : "Nothing to reset: every adjustment is already where it started";

const BACK_TITLE: Record<MediaKind, string> = {
  image: "Back to images",
  video: "Back to videos",
};

const MediaEditorPage = ({ kind }: { kind: MediaKind }) => {
  const { mediaId } = useParams();
  const navigate = useNavigate();
  const item = useStore((s) => findMediaItem(s, mediaId, kind));
  const shown = useLastDefined(item);

  if (!shown)
    return (
      <MissingPage
        icon={kind === "image" ? ImageIcon : Film}
        title={kind === "image" ? "Image not found" : "Video not found"}
        message="It may have been deleted."
        actionLabel={BACK_TITLE[kind]}
        onAction={() => navigate(routes.mediaLibrary(kind))}
      />
    );

  return <MediaWorkspace key={shown.id} item={shown} />;
};

const MediaWorkspace = ({ item }: { item: MediaItem }) => {
  const editorReturn = useEditorReturn(
    item.builtIn ? routes.dashboard() : routes.mediaLibrary(item.kind),
    item.id,
    item.builtIn ? "Back to the background library" : BACK_TITLE[item.kind],
    item.builtIn ? "backgrounds" : undefined,
  );
  const { width } = useWindowSize();
  const stacked = width < 1080;
  const compact = width < 560;
  const pushToast = useStore((s) => s.pushToast);
  const stagePresenting = useStore(
    (s) => Boolean(s.presentation) && s.presentationMode === "stage",
  );
  const editor = useMediaEditor(item);
  const src = useMediaUrl(item);
  const leaveGuard = useUnsavedChanges(editor.dirty);
  const resetAll = useConfirmedAction(editor.resetSettings);
  const isImage = item.kind === "image";
  const validation = useValidation({
    name: validateName(
      editor.draft.name,
      isImage ? "image name" : "video name",
    ),
  });

  useDocumentTitle(editor.draft.name);

  const videoSettings = editor.draft.video;
  const videoSurfaceRef = useRef<MediaSurfaceHandle>(null);
  const video = useMediaPlayback(videoSurfaceRef, videoSettings, {
    autoPlay: false,
  });
  const duration = item.duration || video.duration || 0;
  const trimEnd = videoSettings.trimEnd ?? duration;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const chrome = useAutoHideChrome({ enabled: !isImage, surfaceRef });

  useUndoRedoShortcuts({
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
    undo: editor.undo,
    redo: editor.redo,
  });

  useSpacePlayPause({
    enabled: !isImage && !stagePresenting,
    toggle: video.togglePlaying,
  });

  const previewPlayback = useMemo(
    () => ({
      ...video.playback,
      volume: videoSettings.volume,
      muted: video.playback.muted || videoSettings.muted,
    }),
    [video.playback, videoSettings.volume, videoSettings.muted],
  );

  const refuse = () =>
    pushToast(validation.message ?? "Fix the highlighted fields.", "error");

  const handleSave = () => {
    if (validation.invalid) {
      refuse();
      return;
    }
    if (!editor.save()) return;
    pushToast(isImage ? "Image saved." : "Video saved.");
  };

  const handleUpdatePresentation = () => {
    if (validation.invalid) {
      refuse();
      return;
    }
    if (editor.updatePresentation()) pushToast("Presentation updated.");
  };

  const presentedVideo = editor.presentedVideo;
  const handleSyncFromPresentation = () => {
    if (!presentedVideo || !editor.adoptPresentation()) return;
    video.adopt({
      playing: presentedVideo.playback.playing,
      muted: false,
      volume: presentedVideo.playback.volume,
      time: syncedPosition(presentedVideo.sync),
    });
    pushToast("Synced with the presentation.");
  };

  const preview = (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-3",
        stacked ? "p-4" : "p-6",
      )}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          ref={surfaceRef}
          {...(isImage ? {} : mediaSurfaceProps)}
          className="relative aspect-video max-h-full w-full overflow-hidden rounded-[14px] border border-border bg-black"
        >
          {isImage ? (
            <ImageLayer
              src={src}
              alt={item.name}
              settings={editor.draft.image}
            />
          ) : (
            <>
              <VideoSurface
                ref={videoSurfaceRef}
                item={item}
                settings={videoSettings}
                playback={previewPlayback}
                onTimeUpdate={video.onTimeUpdate}
                onEnded={video.onEnded}
              />
              <VideoTransportBar
                playing={video.playback.playing}
                muted={previewPlayback.muted}
                volume={videoSettings.volume}
                time={video.time}
                start={videoSettings.trimStart}
                end={trimEnd}
                visible={chrome.visible}
                onHoverChange={chrome.onHoverChange}
                compact={compact}
                onTogglePlaying={video.togglePlaying}
                onRestart={video.restart}
                onToggleMuted={() =>
                  editor.patchVideo({ muted: !videoSettings.muted })
                }
                onVolume={(volume) => editor.patchVideo({ volume })}
                onSeek={video.seekTo}
                className="absolute inset-x-3 bottom-3"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div className="p-4.5">
      <p className="mt-0 mb-1 text-xs leading-[1.6] text-subtle-foreground">
        {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
        {formatBytes(item.size || 0)}
        {duration ? ` · ${formatTrimmedDuration(duration, videoSettings)}` : ""}
      </p>
      {isImage ? (
        <ImageSettingsControls
          settings={editor.draft.image}
          onChange={editor.patchImage}
          narrow
        />
      ) : (
        <VideoSettingsControls
          settings={videoSettings}
          onChange={editor.patchVideo}
          duration={duration}
          playhead={video.time}
          onIssueChange={validation.reportIssue}
          narrow
        />
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTopBar
        title={editor.draft.name}
        onTitle={editor.setName}
        compact={compact}
        backTitle={editorReturn.backTitle}
        onBack={editorReturn.back}
        onPresent={editor.present}
        actions={
          compact ? (
            <IconButton
              icon={Undo2}
              title={resetTitle(editor.canResetSettings)}
              disabled={!editor.canResetSettings}
              onClick={resetAll.request}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              title={resetTitle(editor.canResetSettings)}
              disabled={!editor.canResetSettings}
              onClick={resetAll.request}
            >
              <Undo2 size={14} />
              Reset all
            </Button>
          )
        }
        dirty={editor.dirty}
        titleError={validation.messageFor("name")}
        invalid={validation.invalid}
        invalidReason={validation.message}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onSave={handleSave}
        onUpdatePresentation={
          editor.isPresenting ? handleUpdatePresentation : undefined
        }
        onSyncFromPresentation={
          presentedVideo ? handleSyncFromPresentation : undefined
        }
      />

      <EditorSplitLayout
        stacked={stacked}
        preview={preview}
        sidebar={sidebar}
      />

      <ConfirmDialog
        open={resetAll.prompting}
        title="Reset all settings?"
        message="Every adjustment here goes back to the way it started. This can't be undone, and the reset only sticks once you save."
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

export const ImageEditorPage = () => <MediaEditorPage kind="image" />;
export const VideoEditorPage = () => <MediaEditorPage kind="video" />;
