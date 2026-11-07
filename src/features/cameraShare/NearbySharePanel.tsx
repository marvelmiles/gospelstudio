import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { KeyRound } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/shared/InfoTip";
import { ConnectionBadge } from "../pairing/ConnectionBadge";
import { LobbyActions } from "./LobbyActions";
import { QuickConnectNote } from "../pairing/QuickConnectNote";
import { PairingStatusLine } from "../pairing/PairingStatusLine";
import { openCamera } from "../pairing/lib/cameras";
import { detectDeviceName } from "../../lib/deviceName";
import { deriveNetworkRoom } from "../../lib/networkRoom";
import { createSender, type SenderHandle } from "../pairing/lib/senderPeer";
import {
  publishBroadcaster,
  type BroadcastHandle,
} from "../pairing/lib/signaling";
import type { StudioLink } from "../pairing/lib/cameraLink";
import { broadcastPhaseBadge, type BroadcastPhase } from "./lib/shareBadge";
import { SharingCameraCard } from "./SharingCameraCard";
import { useSharingCamera } from "./hooks/useSharingCamera";
import { useBroadcastAnalytics } from "./hooks/useBroadcastAnalytics";
import { trackBroadcastFailure } from "./lib/broadcastAnalytics";

const RECONNECT_GRACE_MS = 3 * 60 * 1000;

interface NearbySharePanelProps {
  studioLink?: StudioLink | null;
  onBack: () => void;
  onReset: () => void;
  onUseCode: () => void;
}

export const NearbySharePanel = ({
  studioLink = null,
  onBack,
  onReset,
  onUseCode,
}: NearbySharePanelProps) => {
  const pushToast = useStore((s) => s.pushToast);
  const [phase, setPhase] = useState<BroadcastPhase>("starting");
  const [isViewerLive, setIsViewerLive] = useState(false);
  const broadcastRef = useRef<BroadcastHandle | null>(null);
  const senderRef = useRef<SenderHandle | null>(null);
  const getSender = useCallback(() => senderRef.current, []);
  const camera = useSharingCamera(getSender);
  const { attachStream, stopCapture, streamRef } = camera;
  useBroadcastAnalytics({
    isLive: phase === "live",
    hasFailed: phase === "failed",
    method: "one_tap",
  });

  const switchToCode = useEffectEvent((message?: string) => {
    if (message) pushToast(message, "error");
    onUseCode();
  });
  const leaveWithError = useEffectEvent((message: string) => {
    pushToast(message, "error");
    onBack();
  });

  useEffect(() => {
    let isCancelled = false;

    const answerOffer = async (
      broadcast: BroadcastHandle,
      offerSdp: string,
    ) => {
      const existingSender = senderRef.current;
      if (existingSender) {
        const answerSdp = await existingSender.answerRestartOffer(offerSdp);
        if (!isCancelled) await broadcast.sendAnswer(answerSdp);
        return;
      }
      const stream = streamRef.current;
      if (!stream) return;
      setPhase("connecting");
      const sender = await createSender({
        offerSdp,
        stream,
        onStatus: (status) => {
          if (isCancelled) return;
          if (
            status === "live" ||
            status === "reconnecting" ||
            status === "failed"
          ) {
            setPhase(status);
          }
        },
        onViewerLive: (live) => {
          if (!isCancelled) setIsViewerLive(live);
        },
      });
      senderRef.current = sender;
      await broadcast.sendAnswer(sender.reply);
    };

    const startBroadcast = async () => {
      const room = studioLink?.room ?? (await deriveNetworkRoom());
      if (isCancelled) return;
      if (!room) {
        switchToCode(
          "Couldn't detect your network for one-tap. Use a code instead.",
        );
        return;
      }

      let stream: MediaStream;
      try {
        stream = await openCamera();
      } catch {
        if (isCancelled) return;
        trackBroadcastFailure("one_tap", "camera_unavailable");
        leaveWithError(
          "Couldn't open the camera. Allow camera access and try again.",
        );
        return;
      }
      if (isCancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      attachStream(stream);

      const deviceName = await detectDeviceName();
      if (isCancelled) return;
      let broadcast: BroadcastHandle;
      try {
        broadcast = publishBroadcaster(
          room,
          deviceName,
          studioLink?.studio ?? null,
        );
      } catch {
        switchToCode();
        return;
      }
      broadcastRef.current = broadcast;
      setPhase("waiting");

      let offerQueue = Promise.resolve();
      let lastOfferSdp = "";
      broadcast.onOffer((offerSdp) => {
        if (offerSdp === lastOfferSdp) return;
        lastOfferSdp = offerSdp;
        offerQueue = offerQueue
          .then(() => answerOffer(broadcast, offerSdp))
          .catch(() => {
            if (!isCancelled && !senderRef.current) setPhase("failed");
          });
      });
    };

    void startBroadcast();

    return () => {
      isCancelled = true;
      void broadcastRef.current?.close();
      senderRef.current?.close();
      stopCapture();
    };
  }, [attachStream, stopCapture, streamRef, studioLink]);

  useEffect(() => {
    if (phase === "live") void broadcastRef.current?.clearCall();
  }, [phase]);

  useEffect(() => {
    if (phase !== "failed") return;
    const graceMs = senderRef.current ? RECONNECT_GRACE_MS : 0;
    const timer = window.setTimeout(() => {
      pushToast(
        "The viewing device disconnected. Waiting for a new connection.",
      );
      onReset();
    }, graceMs);
    return () => window.clearTimeout(timer);
  }, [phase, pushToast, onReset]);

  return (
    <div className="mx-auto max-w-115">
      <SharingCameraCard
        videoRef={camera.videoRef}
        badge={
          <ConnectionBadge
            status={broadcastPhaseBadge(phase, isViewerLive)}
            size="sm"
          />
        }
        statusLine={
          <BroadcastStatusLine phase={phase} isViewerLive={isViewerLive} />
        }
        isAudioOn={camera.isAudioOn}
        onToggleAudio={() => void camera.toggleAudio()}
        facing={camera.facing}
        hasMultipleCameras={camera.hasMultipleCameras}
        onFlip={() => void camera.flipCamera()}
        onStop={onBack}
      />
      <QuickConnectNote />
      <LobbyActions>
        <Button variant="secondary" size="sm" onClick={onUseCode}>
          <KeyRound size={14} />
          Pair with a code instead
        </Button>
      </LobbyActions>
    </div>
  );
};

const BroadcastStatusLine = ({
  phase,
  isViewerLive,
}: {
  phase: BroadcastPhase;
  isViewerLive: boolean;
}) => {
  switch (phase) {
    case "starting":
      return (
        <PairingStatusLine isBusy>Getting your camera ready</PairingStatusLine>
      );
    case "waiting":
      return (
        <PairingStatusLine isBusy>
          Waiting for the Studio
          <InfoTip title="Waiting for the Studio">
            On the computer running the Studio, add a camera, choose Another
            device and pick this one from the list.
          </InfoTip>
        </PairingStatusLine>
      );
    case "connecting":
      return <PairingStatusLine isBusy>Connecting</PairingStatusLine>;
    case "reconnecting":
    case "failed":
      return (
        <PairingStatusLine isBusy>
          Connection interrupted. Reconnecting
        </PairingStatusLine>
      );
    default:
      return (
        <PairingStatusLine>
          {isViewerLive
            ? "You're on the live screen."
            : "You're connected. The Studio can show this camera now."}
        </PairingStatusLine>
      );
  }
};
