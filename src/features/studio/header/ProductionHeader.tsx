import { useState } from "react";
import {
  CircleCheck,
  LoaderCircle,
  Redo2,
  Settings,
  TriangleAlert,
  Undo2,
  Video,
} from "lucide-react";
import routes from "../../../routes";
import { Separator } from "@/components/ui/separator";
import { IconButton } from "@/components/shared/IconButton";
import {
  flushSave,
  redo,
  undo,
  useProductionStore,
  type SaveState,
} from "../store/productionStore";
import { ProductionMenu } from "./ProductionMenu";
import { ProjectorControl } from "./ProjectorControl";
import { StudioSettingsDialog } from "./StudioSettingsDialog";
import { RecordControl } from "../recording/RecordControl";

export const ProductionHeader = () => {
  const canUndo = useProductionStore((state) => state.past.length > 0);
  const canRedo = useProductionStore((state) => state.future.length > 0);
  const saveState = useProductionStore((state) => state.saveState);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-border bg-sidebar/60 px-3 py-2 laptop:px-4">
      <ProductionMenu />
      <SaveStatus saveState={saveState} />

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          icon={Undo2}
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={undo}
        />
        <IconButton
          icon={Redo2}
          title="Redo (Ctrl+Y)"
          disabled={!canRedo}
          onClick={redo}
        />
        <Separator
          orientation="vertical"
          className="mx-1.5 data-[orientation=vertical]:h-6"
        />
        <RecordControl />
        <IconButton
          icon={Video}
          title="Share a camera: opens a tab that turns this or another device into a Studio camera"
          onClick={openCameraShare}
        />
        <ProjectorControl />
        <IconButton
          icon={Settings}
          title="Studio settings"
          onClick={() => setIsSettingsOpen(true)}
        />
      </div>

      {isSettingsOpen && (
        <StudioSettingsDialog onClose={() => setIsSettingsOpen(false)} />
      )}
    </header>
  );
};

const openCameraShare = (): void => {
  window.open(routes.cameraShare(), "_blank", "noopener");
};

const SaveStatus = ({ saveState }: { saveState: SaveState }) => {
  if (saveState === "failed")
    return (
      <button
        type="button"
        onClick={() => void flushSave()}
        className="inline-flex items-center gap-1 rounded-md text-[12px] font-semibold text-destructive underline-offset-4 hover:underline"
      >
        <TriangleAlert size={14} />
        Not saved. Try again
      </button>
    );
  const isSaved = saveState === "saved";
  return (
    <span
      aria-live="polite"
      title="Everything saves on this device by itself"
      className="inline-flex items-center gap-1 text-[12px] text-subtle-foreground"
    >
      {isSaved ? (
        <CircleCheck size={14} />
      ) : (
        <LoaderCircle size={14} className="animate-spin" />
      )}
      {isSaved ? "Saved" : "Saving"}
    </span>
  );
};
