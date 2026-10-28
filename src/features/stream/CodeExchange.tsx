import { useRef, useState, type ReactNode } from "react";
import { QrCode as QrIcon, Clipboard, Check, Camera } from "lucide-react";
import { inputClassName } from "../../components/ui/Field";
import { cn } from "../../lib/cn";
import { useMediaQuery, useResizeObserver } from "usehooks-ts";
import { useStore } from "../../store/useStore";
import { Button } from "../../components/ui/Button";
import { InfoTip } from "../../components/ui/InfoTip";
import { PillTabs } from "../../components/ui/PillTabs";
import { pillTabPanelProps } from "../../components/ui/tabPanel";
import { QrCode } from "./QrCode";
import { QrScanner } from "./QrScanner";
import type { ScanFacing } from "./lib/useQrScanner";

const LAPTOP_QUERY = "(max-width: 1204px)";
const MAX_QR_SIZE = 420;
const MIN_QR_SIZE = 240;
const QR_TILE_PADDING = 34;
const COPIED_FEEDBACK_MS = 1600;

export type CodePane = "show" | "read";

interface CodeExchangePanesProps {
  idPrefix: string;
  show: ReactNode;
  read: ReactNode;
  showLabel?: string;
  readLabel?: string;
  focus?: CodePane;
}

/* On narrow screens the "show code" and "scan code" halves become tabs instead of one long scroll. */
export const CodeExchangePanes = ({
  idPrefix,
  show,
  read,
  showLabel = "Show code",
  readLabel = "Scan code",
  focus,
}: CodeExchangePanesProps) => {
  const isLaptop = useMediaQuery(LAPTOP_QUERY);
  const [chosenPane, setChosenPane] = useState<CodePane>("show");
  const pane = focus ?? chosenPane;

  if (!isLaptop)
    return (
      <div className="grid grid-cols-2 items-stretch gap-5.5">
        {show}
        {read}
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <PillTabs<CodePane>
        tabs={[
          { id: "show", label: showLabel, icon: QrIcon },
          { id: "read", label: readLabel, icon: Camera },
        ]}
        value={pane}
        onChange={setChosenPane}
        ariaLabel="Pairing steps"
        idPrefix={idPrefix}
      />
      <div {...pillTabPanelProps(idPrefix, pane)}>
        {pane === "show" ? show : read}
      </div>
    </div>
  );
};

interface ShowCodeProps {
  value: string;
  caption: string;
}

export const ShowCode = ({ value, caption }: ShowCodeProps) => {
  const pushToast = useStore((s) => s.pushToast);
  const [isCopied, setIsCopied] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const { width: columnWidth = 0 } = useResizeObserver({ ref: columnRef });
  const qrSize = Math.round(
    Math.max(MIN_QR_SIZE, Math.min(MAX_QR_SIZE, columnWidth - QR_TILE_PADDING)),
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      pushToast("Couldn't copy. Long-press the code to select it.", "error");
    }
  };

  return (
    <div ref={columnRef} className="flex flex-col items-center gap-3">
      <QrCode value={value} size={qrSize} />
      <div className="flex items-center gap-1 text-[13px] text-sub">
        Scan with the other device
        <InfoTip title="Scanning this code" align="center">
          {caption} Hold the code steady in view of the other camera. It does
          not have to fill the scan box.
        </InfoTip>
      </div>
      <Button variant="ghost" size="sm" onClick={copy}>
        {isCopied ? <Check size={14} /> : <Clipboard size={14} />}
        {isCopied ? "Copied" : "Copy code instead"}
      </Button>
    </div>
  );
};

interface ReadCodeProps {
  scanFacing?: ScanFacing;
  scanLabel: string;
  onCode: (text: string) => boolean;
}

export const ReadCode = ({
  scanFacing = "environment",
  scanLabel,
  onCode,
}: ReadCodeProps) => {
  const pushToast = useStore((s) => s.pushToast);
  const [mode, setMode] = useState<"scan" | "paste">("scan");
  const [pastedCode, setPastedCode] = useState("");
  const [scanAttempt, setScanAttempt] = useState(0);

  const handleScan = (text: string) => {
    if (!onCode(text)) setScanAttempt((attempt) => attempt + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Button
          variant={mode === "scan" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMode("scan")}
        >
          <QrIcon size={14} />
          Scan code
        </Button>
        <Button
          variant={mode === "paste" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMode("paste")}
        >
          <Clipboard size={14} />
          Paste code
        </Button>
      </div>

      {mode === "scan" ? (
        <div className="flex flex-col items-center gap-2.5">
          <QrScanner
            key={scanAttempt}
            facing={scanFacing}
            onResult={handleScan}
            onError={(message) => {
              pushToast(message, "error");
              setMode("paste");
            }}
          />
          <p className="m-0 text-center text-[12.5px] text-dim">
            <Camera size={12} className="mr-1 inline align-[-1px]" />
            {scanLabel}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={pastedCode}
            onChange={(event) => setPastedCode(event.target.value)}
            placeholder="Paste the code the other device shared with you"
            rows={4}
            className={cn(
              inputClassName,
              "resize-y bg-raise p-2.75 font-mono text-xs break-all",
            )}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!pastedCode.trim()}
            onClick={() => onCode(pastedCode.trim())}
          >
            <Check size={14} />
            Use this code
          </Button>
        </div>
      )}
    </div>
  );
};
