import { useEffect, useState } from "react";
import { MonitorSmartphone, RefreshCw } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  CodeExchangePanes,
  ReadCode,
  ShowCode,
} from "../../pairing/CodeExchange";
import { PairingStatusLine } from "../../pairing/PairingStatusLine";
import { PairingStep } from "../../pairing/PairingStep";
import { decodeSignal, encodeSignal } from "../../pairing/lib/pairingSignal";
import { offerLinkUrl } from "../../pairing/lib/cameraLink";
import {
  startCodePairing,
  type CodePairing as Pairing,
} from "../lib/remoteCameras";
import { useSourceState } from "../store/cameraStore";

interface CodePairingProps {
  pairingId: string;
  onRestart: () => void;
  onUseOneTap?: () => void;
}

export const CodePairing = ({
  pairingId,
  onRestart,
  onUseOneTap,
}: CodePairingProps) => {
  const pushToast = useStore((state) => state.pushToast);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [hasReply, setHasReply] = useState(false);
  const { status, message } = useSourceState(pairingId);
  const hasFailed = status === "missing";

  useEffect(() => {
    let isCancelled = false;
    startCodePairing(pairingId)
      .then((next) => {
        if (!isCancelled) setPairing(next);
      })
      .catch(() => {
        if (!isCancelled)
          pushToast("Couldn't start pairing on this device.", "error");
      });
    return () => {
      isCancelled = true;
    };
  }, [pairingId, pushToast]);

  const applyReply = (text: string): boolean => {
    const parsed = decodeSignal(text);
    if (!parsed || parsed.kind !== "answer") {
      pushToast(
        "That doesn't look like a reply code from the other device.",
        "error",
      );
      return false;
    }
    setHasReply(true);
    void pairing
      ?.accept(parsed.sdp)
      .catch(() => pushToast("Couldn't complete the connection.", "error"));
    return true;
  };

  return (
    <div className="flex flex-col gap-3">
      <CodeExchangePanes
        idPrefix="studio-camera-pairing"
        readLabel="Scan reply"
        focus={hasReply ? "read" : undefined}
        show={
          <PairingStep stepNumber={1} title="Show this to the other device">
            {pairing ? (
              <ShowCode
                value={offerLinkUrl(encodeSignal("offer", pairing.invite))}
                caption="Scan it with the phone's camera app: it opens Share camera ready to connect. Or open Share camera, choose Pair with a code, and scan or paste it there."
              />
            ) : (
              <div className="grid place-items-center p-7.5">
                <Spinner size={22} />
              </div>
            )}
          </PairingStep>
        }
        read={
          <PairingStep stepNumber={2} title="Then read its reply">
            <ReadCode
              scanFacing="user"
              scanLabel="Point the other device's reply code at this camera."
              onCode={applyReply}
            />
            {hasReply && message && (
              <PairingStatusLine
                tone={hasFailed ? "danger" : "neutral"}
                isBusy={!hasFailed}
              >
                {message}
              </PairingStatusLine>
            )}
          </PairingStep>
        }
      />
      <div className="flex flex-wrap justify-center gap-2.5">
        {hasFailed && (
          <Button variant="secondary" size="sm" onClick={onRestart}>
            <RefreshCw size={14} />
            Show a new code
          </Button>
        )}
        {onUseOneTap && (
          <Button variant="secondary" size="sm" onClick={onUseOneTap}>
            <MonitorSmartphone size={14} />
            Quick connect
          </Button>
        )}
      </div>
    </div>
  );
};
