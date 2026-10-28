import { useState } from "react";
import { AlertTriangle, ChevronRight, HardDrive, Trash2 } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Button } from "./Button";
import { formatBytes } from "../../lib/storageStats";
import { InfoTip } from "./InfoTip";
import { APP_NAME } from "../../lib/appInfo";

const Step = () => (
  <ChevronRight size={13} className="mx-0.5 inline align-[-2px]" />
);

export const StorageGate = () => {
  const storage = useStore((s) => s.storage);
  const freeUpStorage = useStore((s) => s.freeUpStorage);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);

  if (!storage || storage.viable) return null;

  const onFree = async () => {
    setBusy(true);
    await freeUpStorage();
    setBusy(false);
    setAttempted(true);
  };

  return (
    <div className="fixed inset-0 z-600 grid place-items-center bg-scrim-strong p-5 backdrop-blur-[10px]">
      <div className="w-full max-w-120 rounded-[18px] border border-line bg-panel p-6.5 shadow-overlay backdrop-blur-sm">
        <div className="mb-4 grid size-12 place-items-center rounded-[13px] bg-danger/16 text-danger">
          <HardDrive size={24} />
        </div>
        <h2 className="mt-0 mb-2 text-[23px] font-semibold text-fg">
          Not enough storage space
        </h2>
        <p className="mt-0 text-sm leading-[1.65] text-sub">
          Your browser hasn't given {APP_NAME} enough room to run smoothly
          {storage.budget > 0
            ? ` (about ${formatBytes(storage.budget)} available)`
            : ""}
          . To use the app you'll need to free up space in your browser, or
          upgrade to a newer browser version.
        </p>

        {attempted && !storage.viable && (
          <div className="mb-4 flex gap-2.75 rounded-[11px] border border-danger/30 bg-danger/10 p-3.5">
            <AlertTriangle size={18} className="mt-px shrink-0 text-danger" />
            <div className="text-[13px] leading-[1.6] text-fg">
              There still isn't enough space. Please update your browser to the
              latest version, or clear this site's storage manually: open your
              browser settings <Step /> Privacy / Site settings <Step /> find
              this site <Step /> <strong>Clear data</strong> (this removes
              cached site data and storage). Closing other installed web apps
              can also free space.
            </div>
          </div>
        )}

        <Button
          variant="danger"
          onClick={onFree}
          busy={busy}
          className="w-full justify-center"
        >
          <Trash2 size={15} />
          Free up storage
        </Button>
        <div className="mt-2 flex items-center justify-center gap-1 text-[11.5px] text-dim">
          What gets cleared
          <InfoTip title="Free up storage" side="top" align="center">
            Clears {APP_NAME}&apos;s stored data on this device (manuscripts,
            custom themes, backgrounds and audio) and restores the defaults.
          </InfoTip>
        </div>
      </div>
    </div>
  );
};
