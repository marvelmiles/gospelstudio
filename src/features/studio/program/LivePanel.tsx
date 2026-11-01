import { cn } from "../../../lib/utils";
import { GoLiveControls } from "./GoLiveControls";
import { LiveControls } from "./LiveControls";
import { LiveMonitor } from "./LiveMonitor";

export const LivePanel = ({ className }: { className?: string }) => (
  <div className={cn("flex min-h-0 min-w-0 flex-col gap-3", className)}>
    <LiveMonitor />
    <GoLiveControls />
    <LiveControls className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1" />
  </div>
);
