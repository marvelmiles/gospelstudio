import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { Radio, RotateCcw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConnectionBadge } from "../pairing/ConnectionBadge";
import { ReadCode, ShowCode } from "../pairing/CodeExchange";
import { LobbyActions } from "./LobbyActions";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { PairingStatusLine } from "../pairing/PairingStatusLine";
import { openCamera } from "../pairing/lib/cameras";
import type { PeerStatus } from "../pairing/lib/peerStatus";
import { createSender, type SenderHandle } from "../pairing/lib/senderPeer";
import { decodeSignal, encodeSignal } from "../pairing/lib/pairingSignal";
import { offerCodeFromText } from "../pairing/lib/cameraLink";
import {
  useConnectionLifecycle,
  type ConnectionPhase,
} from "../pairing/lib/useConnectionLifecycle";
import { connectionPhaseBadge } from "./lib/shareBadge";
import { SharingCameraCard } from "./SharingCameraCard";
import { useSharingCamera } from "./hooks/useSharingCamera";

interface CodeSharePanelProps {
  initialOffer?: string | null;
  onBack: () => void;
  onReset: () => void;
  onUseOneTap?: () => void;
}

export const CodeSharePanel = ({
  initialOffer = null,
  onBack,
  onReset,
  onUseOneTap,
}: CodeSharePanelProps) => {
  const pushToast = useStore((s) => s.pushToast);
  const [isStreaming, setIsStreaming] = useState(false);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<PeerStatus>("idle");
  const [isViewerLive, setIsViewerLive] = useState(false);
  const senderRef = useRef<SenderHandle | null>(null);
  const getSender = useCallback(() => senderRef.current, []);
  const camera = useSharingCamera(getSender);
  const { stopCapture } = camera;

  const connectionPhase = useConnectionLifecycle(status, () => {
    pushToast("The Studio disconnected.");
    onReset();
  });

  useEffect(
    () => () => {
      senderRef.current?.close();
      stopCapture();
    },
    [stopCapture],
  );

  const startStreaming = async (offerSdp: string) => {
    setIsStreaming(true);
    try {
      const stream = await openCamera();
      camera.attachStream(stream);
      const sender = await createSender({
        offerSdp,
        stream,
        onStatus: setStatus,
        onViewerLive: setIsViewerLive,
      });
      senderRef.current = sender;
      setReply(encodeSignal("answer", sender.reply));
    } catch {
      stopCapture();
      pushToast(
        "Couldn't open the camera. Allow camera access and try again.",
        "error",
      );
      setIsStreaming(false);
    }
  };

  const applyInvite = (text: string): boolean => {
    const parsed = decodeSignal(offerCodeFromText(text));
    if (!parsed || parsed.kind !== "offer") {
      pushToast("That doesn't look like a code from the Studio.", "error");
      return false;
    }
    void startStreaming(parsed.sdp);
    return true;
  };

  const applyLinkedOffer = useEffectEvent(() => {
    if (initialOffer) applyInvite(initialOffer);
  });
  const hasAppliedLinkRef = useRef(false);

  useEffect(() => {
    if (hasAppliedLinkRef.current) return;
    hasAppliedLinkRef.current = true;
    applyLinkedOffer();
  }, []);

  if (!isStreaming) {
    return (
      <div>
        <Panel className="mx-auto max-w-105">
          <PanelTitle
            centered
            title="Scan the Studio's code"
            info="On the computer running the Studio, add a camera, choose Another device, then Pair with a code. Scan the code it shows, or paste it."
          />
          <ReadCode
            scanFacing="environment"
            scanLabel="Aim at the code on the Studio's screen."
            onCode={applyInvite}
          />
        </Panel>
        <LobbyActions>
          {onUseOneTap && (
            <Button variant="secondary" size="sm" onClick={onUseOneTap}>
              <Radio size={14} />
              Quick connect
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onBack}>
            <RotateCcw size={14} />
            Back
          </Button>
        </LobbyActions>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] items-start gap-5.5">
      <Panel>
        <PanelTitle title="Show this reply to the Studio" />
        {reply ? (
          <ShowCode
            value={reply}
            caption="In the Studio, scan or paste this to finish connecting."
          />
        ) : (
          <div className="grid place-items-center p-6">
            <Spinner size={20} />
          </div>
        )}
      </Panel>

      <SharingCameraCard
        videoRef={camera.videoRef}
        badge={
          <ConnectionBadge
            status={connectionPhaseBadge(connectionPhase, isViewerLive)}
            size="sm"
          />
        }
        statusLine={<PairedStatusLine phase={connectionPhase} />}
        isAudioOn={camera.isAudioOn}
        onToggleAudio={() => void camera.toggleAudio()}
        facing={camera.facing}
        hasMultipleCameras={camera.hasMultipleCameras}
        onFlip={() => void camera.flipCamera()}
        onStop={onBack}
      />
    </div>
  );
};

const PairedStatusLine = ({ phase }: { phase: ConnectionPhase }) => {
  switch (phase) {
    case "waiting":
      return (
        <PairingStatusLine isBusy>
          Waiting for the Studio to scan your reply
        </PairingStatusLine>
      );
    case "reconnecting":
      return (
        <PairingStatusLine isBusy>
          Connection interrupted. Reconnecting
        </PairingStatusLine>
      );
    case "disconnected":
      return (
        <PairingStatusLine tone="danger">
          The Studio disconnected. Starting over
        </PairingStatusLine>
      );
    default:
      return null;
  }
};
