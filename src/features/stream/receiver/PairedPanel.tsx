import { KeyRound, RotateCcw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LobbyActions } from "../components/LobbyActions";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { MAX_STREAM_CAMERAS } from "../lib/streamSession";

interface PairedPanelProps {
  canPairAnother: boolean;
  onPairAnother: () => void;
  onBack: () => void;
}

export const PairedPanel = ({
  canPairAnother,
  onPairAnother,
  onBack,
}: PairedPanelProps) => (
  <div className="mx-auto max-w-140">
    <Panel className="p-5">
      <PanelTitle
        icon={Wifi}
        title="Paired"
        info={`The camera is on the stage. Pop it out to keep working, and pair up to ${MAX_STREAM_CAMERAS} devices.`}
      />
    </Panel>
    <LobbyActions>
      <Button
        variant="secondary"
        size="sm"
        disabled={!canPairAnother}
        onClick={onPairAnother}
        title={
          canPairAnother
            ? "Show a new code for another device"
            : `Already holding ${MAX_STREAM_CAMERAS} cameras. Drop one first.`
        }
      >
        <KeyRound size={14} />
        Pair another camera
      </Button>
      <Button variant="secondary" size="sm" onClick={onBack}>
        <RotateCcw size={14} />
        Back
      </Button>
    </LobbyActions>
  </div>
);
