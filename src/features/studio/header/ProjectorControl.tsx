import type { ReactNode } from "react";
import { ChevronDown, LoaderCircle, MonitorPlay, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { PresentMenuButton } from "@/components/shared/PresentMenu";
import { SwitchField } from "@/components/shared/SwitchField";
import { useOutputStore } from "../store/outputStore";
import { setOutputTesting } from "../lib/outputPublisher";
import { studioOutputWindow } from "../lib/outputChannel";
import { useOutputConnection } from "../hooks/useOutputConnection";
import { useOpenProjector } from "../hooks/useOpenProjector";
import { usePreviewTab } from "../hooks/usePreviewTab";

const GO_LIVE_CHOICE = {
  title: "Go live",
  description: "Open the projector screen",
};

const PREVIEW_CHOICE = {
  title: "Preview",
  description: "Show the preview scene in a new tab",
};

export const ProjectorControl = () => {
  const connection = useOutputConnection();
  const openProjector = useOpenProjector();
  const openPreview = usePreviewTab();

  if (connection === "closed")
    return (
      <PresentMenuButton
        onGoLive={openProjector}
        onPreview={openPreview}
        goLive={GO_LIVE_CHOICE}
        preview={PREVIEW_CHOICE}
        align="end"
        title="Show the live screen on a projector, or preview it in a tab"
      />
    );

  const isConnecting = connection === "connecting";
  return (
    <ProjectorOptions onPreview={openPreview}>
      <Button
        size="sm"
        variant="secondary"
        title="Projector options"
        className={cn(
          !isConnecting &&
            "border-success/35 bg-success/12 text-success-foreground enabled:hover:bg-success/18",
        )}
      >
        {isConnecting ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <span aria-hidden className="size-2 rounded-full bg-success" />
        )}
        {isConnecting ? "Opening projector" : "Projector on"}
        <ChevronDown />
      </Button>
    </ProjectorOptions>
  );
};

interface ProjectorOptionsProps {
  onPreview: () => void;
  children: ReactNode;
}

const ProjectorOptions = ({ onPreview, children }: ProjectorOptionsProps) => {
  const isTesting = useOutputStore((state) => state.isTesting);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-0 p-0">
        <div className="flex flex-col gap-2 p-4">
          <h2 className="m-0 text-[14px] font-semibold text-foreground">
            Projector screen
          </h2>
          <SwitchField
            label="Test picture"
            checked={isTesting}
            onChange={setOutputTesting}
          />
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onClick={onPreview}
          >
            <MonitorPlay />
            Open the preview tab
          </Button>
        </div>
        <Separator />
        <div className="p-3">
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            onClick={() => studioOutputWindow.endLive()}
          >
            <X />
            Close projector screen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
