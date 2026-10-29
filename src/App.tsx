import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./store/useStore";
import { cn } from "./lib/utils";
import { AppHeader } from "./components/layout/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { AlertBar } from "@/components/shared/AlertBar";
import { StorageGate } from "@/components/shared/StorageGate";
import { UploadLabelModal } from "@/components/shared/UploadLabelModal";
import { GoLiveTipDialog } from "@/components/shared/GoLiveTipDialog";
import { ResetOverlay } from "@/components/shared/ResetOverlay";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { GuideModal } from "./features/onboarding/GuideModal";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ManuscriptLibrary } from "./features/manuscripts/ManuscriptLibrary";
import { ManuscriptEditor } from "./features/manuscripts/ManuscriptEditor";
import { BiblePage } from "./features/bible/BiblePage";
import { ScriptureEditor } from "./features/bible/ScriptureEditor";
import { ImagesPage, VideosPage } from "./features/media/MediaLibraryPage";
import {
  ImageEditorPage,
  VideoEditorPage,
} from "./features/media/MediaEditorPage";
import { StreamPage } from "./features/stream/StreamPage";
import { QuickSharePage } from "./features/share/QuickSharePage";
import { StreamWindow } from "./features/stream/StreamWindow";
import { StreamProjectionRoot } from "./features/stream/StreamProjectionRoot";
import { Presentation } from "./features/presentation/Presentation";
import { PresentWindow } from "./features/presentation/PresentWindow";
import { AssetsModal } from "./features/assets/AssetsModal";
import { AudioEditorPage } from "./features/assets/AudioEditorPage";
import { AssetUsageEditorPage } from "./features/assets/AssetUsageEditorPage";
import { SettingsModal } from "./features/settings/SettingsModal";
import { ThemesPage } from "./features/themes/ThemesPage";
import { ShortcutsModal } from "./features/shortcuts/ShortcutsModal";
import { AboutModal } from "./features/about/AboutModal";
import routes, { isSelfScrollingRoute } from "./routes";

const App = () => {
  const load = useStore((s) => s.load);
  const loading = useStore((s) => s.loading);
  const presentation = useStore((s) => s.presentation);
  const location = useLocation();

  useEffect(() => {
    void load();
  }, [load]);

  if (location.pathname === routes.presentWindow()) return <PresentWindow />;
  if (location.pathname === routes.streamWindow()) return <StreamWindow />;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background bg-[radial-gradient(1100px_520px_at_80%_-12%,rgb(37_99_235/0.1),transparent_65%),radial-gradient(1200px_500px_at_50%_-15%,rgb(255_255_255/0.02),transparent_70%)] text-foreground">
      <AlertBar />
      <AppHeader />

      <main
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden",
          isSelfScrollingRoute(location.pathname)
            ? "overflow-y-hidden"
            : "overflow-y-auto",
        )}
      >
        {loading ? (
          <LoadingArea size={30} />
        ) : (
          <Routes>
            <Route path={routes.dashboard()} element={<Dashboard />} />
            <Route
              path={routes.manuscripts()}
              element={<ManuscriptLibrary />}
            />
            <Route path={routes.manuscript()} element={<ManuscriptEditor />} />
            <Route path={routes.bible()} element={<BiblePage />} />
            <Route path={routes.passage()} element={<ScriptureEditor />} />
            <Route path={routes.images()} element={<ImagesPage />} />
            <Route path={routes.image()} element={<ImageEditorPage />} />
            <Route path={routes.videos()} element={<VideosPage />} />
            <Route path={routes.video()} element={<VideoEditorPage />} />
            <Route path={routes.sound()} element={<AudioEditorPage />} />
            <Route
              path={routes.assetUsage()}
              element={<AssetUsageEditorPage />}
            />
            <Route path={routes.themes()} element={<ThemesPage />} />
            <Route path={routes.theme()} element={<ThemesPage />} />
            <Route path={routes.stream()} element={<StreamPage />} />
            <Route path={routes.share()} element={<QuickSharePage />} />
            <Route
              path={routes.notFound()}
              element={<Navigate to={routes.dashboard()} replace />}
            />
          </Routes>
        )}
      </main>

      {presentation && (
        <Presentation key={`${presentation.kind}:${presentation.id}`} />
      )}
      <StreamProjectionRoot />
      <AssetsModal />
      <SettingsModal />
      <ShortcutsModal />
      <AboutModal />
      <UploadLabelModal />
      <GoLiveTipDialog />
      <GuideModal />
      <ResetOverlay />
      <StorageGate />
      <Toaster position="bottom-center" duration={3400} />
    </div>
  );
};

export default App;
