import type { CameraLinkRequest } from "../pairing/lib/cameraLink";
import { usePairingMode } from "../pairing/lib/usePairingMode";
import { CodeSharePanel } from "./CodeSharePanel";
import { NearbySharePanel } from "./NearbySharePanel";

interface CameraShareLobbyProps {
  link: CameraLinkRequest;
  onStop: () => void;
}

export const CameraShareLobby = ({ link, onStop }: CameraShareLobbyProps) => {
  const { mode, resetCount, reset, switchToCode, switchToOneTap } =
    usePairingMode(Boolean(link.offerCode));

  if (mode === "auto")
    return (
      <NearbySharePanel
        key={`nearby-${resetCount}`}
        studioLink={link.studio}
        onBack={onStop}
        onReset={reset}
        onUseCode={switchToCode}
      />
    );

  return (
    <CodeSharePanel
      key={`code-${resetCount}`}
      initialOffer={resetCount === 0 ? link.offerCode : null}
      onBack={onStop}
      onReset={reset}
      onUseOneTap={switchToOneTap}
    />
  );
};
