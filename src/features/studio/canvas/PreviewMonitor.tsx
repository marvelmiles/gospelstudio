import { cn } from "../../../lib/utils";
import { usePreviewScene } from "../store/productionStore";
import { MonitorFrame } from "../program/MonitorFrame";
import { ProductionCanvas } from "./ProductionCanvas";

interface PreviewMonitorProps {
  className?: string;
  fitHeight?: boolean;
}

export const PreviewMonitor = ({
  className,
  fitHeight = false,
}: PreviewMonitorProps) => {
  const scene = usePreviewScene();

  return (
    <div
      className={cn(
        fitHeight && "@container-size grid min-h-0 place-items-center",
        className,
      )}
    >
      <MonitorFrame
        label="Preview"
        description="What you are preparing"
        sceneName={scene?.name}
        className={cn(
          "w-full",
          fitHeight && "w-[min(100cqw,calc((100cqh-2.5rem)*16/9))]",
        )}
      >
        <ProductionCanvas />
      </MonitorFrame>
    </div>
  );
};
