import { useState } from "react";
import { Check, Laptop, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/shared/Modal";
import { PillTabs } from "@/components/shared/PillTabs";
import { pillTabPanelProps } from "@/components/shared/tabPanel";
import { isLocalCamera } from "../types/mediaSource";
import { useSources } from "../store/productionStore";
import { chooseCameraDevice } from "../store/productionActions";
import { useLocalCameras } from "../hooks/useLocalCameras";
import { LocalCameraPane } from "./LocalCameraPane";
import { RemoteCameraPane } from "./RemoteCameraPane";

type CameraPlace = "local" | "remote";

const PANEL_ID = "studio-camera-place";

interface CameraPickerProps {
  open: boolean;
  currentSourceId?: string | null;
  confirmLabel?: string;
  onChoose: (sourceId: string) => void;
  onClose: () => void;
}

export const CameraPicker = ({ open, ...props }: CameraPickerProps) =>
  open ? <CameraPickerDialog {...props} /> : null;

const CameraPickerDialog = ({
  currentSourceId = null,
  confirmLabel = "Use this camera",
  onChoose,
  onClose,
}: Omit<CameraPickerProps, "open">) => {
  const current = useSources().find((source) => source.id === currentSourceId);
  const [place, setPlace] = useState<CameraPlace>(
    current && !isLocalCamera(current) ? "remote" : "local",
  );
  const [chosenDeviceId, setChosenDeviceId] = useState<string | null>(
    current && isLocalCamera(current) ? current.deviceId : null,
  );
  const local = useLocalCameras(chosenDeviceId);
  const isLocal = place === "local";

  const confirmLocal = () => {
    if (!local.activeCamera) return;
    onChoose(chooseCameraDevice(local.activeCamera));
    onClose();
  };

  const finishRemote = (sourceId: string) => {
    onChoose(sourceId);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Choose a camera"
      width={760}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {isLocal && (
            <Button
              onClick={confirmLocal}
              disabled={!local.activeCamera || local.needsAccess}
            >
              <Check size={15} />
              {confirmLabel}
            </Button>
          )}
        </>
      }
    >
      <div className="mb-4 flex justify-center">
        <PillTabs<CameraPlace>
          tabs={[
            { id: "local", label: "This computer", icon: Laptop },
            { id: "remote", label: "Another device", icon: Smartphone },
          ]}
          value={place}
          onChange={setPlace}
          ariaLabel="Where the camera is"
          idPrefix={PANEL_ID}
        />
      </div>
      <div {...pillTabPanelProps(PANEL_ID, place)}>
        {isLocal ? (
          <LocalCameraPane local={local} onSelect={setChosenDeviceId} />
        ) : (
          <RemoteCameraPane
            targetSourceId={
              current && !isLocalCamera(current) ? current.id : null
            }
            onConnected={finishRemote}
          />
        )}
      </div>
    </Modal>
  );
};
