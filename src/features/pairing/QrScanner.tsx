import { cn } from "../../lib/utils";
import { useQrScanner, type ScanFacing } from "./lib/useQrScanner";

interface QrScannerProps {
  facing?: ScanFacing;
  onResult: (text: string) => void;
  onError?: (message: string) => void;
}

export const QrScanner = ({
  facing = "environment",
  onResult,
  onError,
}: QrScannerProps) => {
  const { videoRef, isCameraReady } = useQrScanner({
    facing,
    onResult,
    onError,
  });
  const statusText = isCameraReady ? "Looking for a code" : "Starting camera";

  return (
    <div className="relative aspect-square w-full max-w-90 overflow-hidden rounded-2xl border border-border bg-stage">
      <video
        ref={videoRef}
        playsInline
        muted
        className={cn(
          "size-full object-cover",
          facing === "user" && "-scale-x-100",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-[8%] overflow-hidden rounded-xl border-2 shadow-[0_0_0_100vmax_rgb(0_0_0/0.35)]",
          isCameraReady ? "border-primary-soft" : "border-white/50",
        )}
      >
        {isCameraReady && (
          <div className="pointer-events-none absolute inset-0 animate-scan-sweep motion-reduce:animation-duration-[6s]">
            <div className="-mt-px h-0.5 bg-primary-soft shadow-[0_0_12px_3px_rgb(59_130_246/0.6)]" />
          </div>
        )}
      </div>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-2.5 flex flex-col items-center gap-1.5"
      >
        <span className="rounded-full bg-stage-overlay-strong px-2.5 py-1 text-[11.5px] font-semibold text-white">
          {statusText}
        </span>
      </div>
    </div>
  );
};
