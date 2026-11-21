import { useState } from "react";
import {
  AlertTriangle,
  Info,
  MonitorUp,
  RadioTower,
  Square,
  X,
} from "lucide-react";
import { useStore } from "../../../store/useStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { PropertySection } from "../../studio/properties/fields";
import { useOpenProjector } from "../../studio/hooks/useOpenProjector";
import { useOutputConnection } from "../../studio/hooks/useOutputConnection";
import { hasLiveEncodingApis } from "../lib/liveEncoderClient";
import { liveRelayUrl } from "../lib/liveRelayApi";
import {
  destinationName,
  enabledDestinations,
  setLiveQuality,
  useLiveStreamSettings,
  type StreamDestination,
} from "../lib/liveStreamSettings";
import { startLiveStream, stopLiveStream } from "../lib/liveStreamSession";
import { clearLiveProblem, useLiveStreamStore } from "../lib/liveStreamStore";
import { DestinationForm } from "./DestinationForm";
import { DestinationsSection } from "./DestinationsSection";
import { LiveStatusPanel } from "./LiveStatusPanel";
import { QualityPicker } from "./QualityPicker";
import { SoundSettings } from "./SoundSettings";

type DialogView =
  | { kind: "overview" }
  | { kind: "form"; destination: StreamDestination | null };

const OVERVIEW: DialogView = { kind: "overview" };

const listNames = (names: string[]): string =>
  names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const ProblemAlert = () => {
  const problem = useLiveStreamStore((state) => state.problem);
  if (!problem) return null;
  return (
    <Alert variant="destructive" className="mb-4 grid-cols-[auto_1fr_auto]">
      <AlertTriangle />
      <AlertDescription className="text-[13px] leading-normal text-current">
        {problem.message}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        onClick={clearLiveProblem}
        className="col-start-3 row-start-1 -my-1 text-current"
      >
        <X />
      </Button>
    </Alert>
  );
};

const ProjectorHint = () => {
  const connection = useOutputConnection();
  const openProjector = useOpenProjector();
  if (connection !== "closed") return null;
  return (
    <div className="mb-4 flex flex-col items-start gap-2.5 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2.5 sm:flex-row sm:items-center">
      <p className="m-0 min-w-0 flex-1 text-[12.5px] leading-relaxed text-warning-foreground">
        Open the projector screen first. When you go live, your browser asks
        what to share: choose the projector screen so viewers see the clean
        picture.
      </p>
      <Button size="sm" variant="secondary" onClick={openProjector}>
        <MonitorUp />
        Open projector screen
      </Button>
    </div>
  );
};

const readinessProblem = (): string | null => {
  if (!hasLiveEncodingApis())
    return "Live streaming needs a recent Chrome or Edge on a Windows or Mac computer. Phones and other browsers cannot encode the stream yet.";
  if (!liveRelayUrl())
    return "Live streaming is not set up on this site yet. Whoever runs it needs to start the streaming relay and set VITE_LIVE_RELAY_URL.";
  return null;
};

const ReadinessNotice = () => {
  const problem = readinessProblem();
  if (!problem) return null;
  return (
    <Alert variant="info" className="mb-4">
      <Info />
      <AlertDescription className="text-[13px] leading-normal text-current">
        {problem}
      </AlertDescription>
    </Alert>
  );
};

const Overview = ({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (destination: StreamDestination) => void;
}) => {
  const phase = useLiveStreamStore((state) => state.phase);
  const quality = useLiveStreamSettings((state) => state.quality);

  return (
    <>
      <ReadinessNotice />
      <ProblemAlert />
      {phase === "idle" ? <ProjectorHint /> : <LiveStatusPanel />}
      <PropertySection
        title="Stream to"
        info="Your service goes out to every platform that is switched on, all at once. While live, switch a platform on or off without stopping the others."
      >
        <div className="flex flex-col">
          <DestinationsSection onAdd={onAdd} onEdit={onEdit} />
        </div>
      </PropertySection>
      <PropertySection
        title="Picture quality"
        info="The stream adapts by itself: on a weak connection the picture is lowered for a moment instead of freezing, and the sound keeps its quality. Choose a lower ceiling if your internet is slow or costly."
      >
        <QualityPicker
          value={quality}
          disabled={phase !== "idle"}
          onChange={setLiveQuality}
        />
      </PropertySection>
      <PropertySection
        title="Sound"
        info="Noise cancellation removes fans, traffic and chatter from speech. Turn it off during worship if instruments sound thin. All three settings also apply to recordings."
      >
        <SoundSettings />
      </PropertySection>
    </>
  );
};

const OverviewFooter = ({ onClose }: { onClose: () => void }) => {
  const phase = useLiveStreamStore((state) => state.phase);
  const destinations = useLiveStreamSettings((state) => state.destinations);
  const pushToast = useStore((state) => state.pushToast);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
  const chosen = enabledDestinations(destinations);

  const goLive = async () => {
    const result = await startLiveStream({
      destinations: chosen,
      quality: useLiveStreamSettings.getState().quality,
    });
    if (result === "started")
      pushToast(`You are live on ${listNames(chosen.map(destinationName))}.`);
  };

  if (phase === "live" || phase === "stopping")
    return (
      <>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="destructive"
          busy={phase === "stopping"}
          onClick={() => setIsConfirmingEnd(true)}
        >
          <Square />
          End stream
        </Button>
        <ConfirmDialog
          open={isConfirmingEnd}
          title="End the live stream?"
          message="Viewers on every platform will see the stream end. The projector screen and recording are not affected."
          confirmLabel="End stream"
          onConfirm={() => {
            setIsConfirmingEnd(false);
            void stopLiveStream();
          }}
          onCancel={() => setIsConfirmingEnd(false)}
        />
      </>
    );

  return (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button
        busy={phase === "starting"}
        disabled={chosen.length === 0 || readinessProblem() !== null}
        onClick={() => void goLive()}
        className="bg-destructive enabled:hover:bg-destructive/90"
      >
        <RadioTower />
        {chosen.length > 1
          ? `Go live on ${chosen.length} platforms`
          : "Go live"}
      </Button>
    </>
  );
};

interface LiveStreamDialogProps {
  title: string;
  onClose: () => void;
}

export const LiveStreamDialog = ({ title, onClose }: LiveStreamDialogProps) => {
  const [view, setView] = useState<DialogView>(OVERVIEW);
  const isForm = view.kind === "form";
  const viewTitle = !isForm
    ? title
    : view.destination
      ? "Edit platform"
      : "Add a platform";

  return (
    <Modal
      open
      onClose={onClose}
      title={viewTitle}
      width={660}
      footer={isForm ? undefined : <OverviewFooter onClose={onClose} />}
    >
      {isForm ? (
        <DestinationForm
          destination={view.destination}
          onDone={() => setView(OVERVIEW)}
        />
      ) : (
        <Overview
          onAdd={() => setView({ kind: "form", destination: null })}
          onEdit={(destination) => setView({ kind: "form", destination })}
        />
      )}
    </Modal>
  );
};
