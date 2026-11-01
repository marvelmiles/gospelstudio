import { useState } from "react";
import { RefreshCw, Smartphone, Webcam } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { SwitchField } from "@/components/shared/SwitchField";
import type { CameraLayer } from "../types/layer";
import {
  isLocalCamera,
  type CameraSource,
  type CameraStatus,
} from "../types/mediaSource";
import { retrySource } from "../lib/cameraService";
import { useCameraStore, useSourceState } from "../store/cameraStore";
import { useSources } from "../store/productionStore";
import { updateLocalCamera } from "../store/productionActions";
import { CameraPicker } from "../camera/CameraPicker";
import { ContentPickerRow } from "./ContentPickerRow";
import { ChoiceField, PropertySection, SelectField } from "./fields";
import { useLayerEditor } from "./useLayerEditor";
import { FIT_CHOICES } from "./fitChoices";

const NO_MICROPHONE = "";

const STATUS_LABELS: Record<CameraStatus, string> = {
  idle: "Not started yet",
  starting: "Starting",
  live: "Working",
  denied: "Access blocked",
  missing: "Not connected",
  busy: "In use by another app",
  unsupported: "Not available in this browser",
  error: "Could not start",
};

const isProblem = (status: CameraStatus): boolean =>
  status !== "live" && status !== "starting" && status !== "idle";

export const CameraProperties = ({ layer }: { layer: CameraLayer }) => {
  const edit = useLayerEditor(layer);
  const source = useSources().find((entry) => entry.id === layer.sourceId);
  const { status, message } = useSourceState(layer.sourceId);
  const [isPicking, setIsPicking] = useState(false);
  const isRemote = Boolean(source && !isLocalCamera(source));
  const hasNoMicrophone = Boolean(
    source && isLocalCamera(source) && !source.audioDeviceId,
  );
  const needsRemoteConnection =
    isRemote && (status === "idle" || isProblem(status));

  return (
    <>
      <PropertySection title="Camera">
        <ContentPickerRow
          icon={isRemote ? Smartphone : Webcam}
          name={source?.deviceLabel ?? null}
          emptyLabel="No camera chosen"
          actionLabel={source ? "Change" : "Choose camera"}
          onPick={() => setIsPicking(true)}
        />
        {source && (
          <div className="flex items-start gap-2 text-[12px] leading-snug">
            <span
              aria-hidden
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                status === "live" && "bg-success",
                status === "starting" && "bg-warning",
                (isProblem(status) || needsRemoteConnection) &&
                  "bg-destructive",
                status === "idle" && !isRemote && "bg-subtle-foreground",
              )}
            />
            <span className="min-w-0 flex-1 text-muted-foreground">
              <span className="font-semibold text-foreground">
                {needsRemoteConnection
                  ? "Not connected"
                  : STATUS_LABELS[status]}
                .
              </span>{" "}
              {needsRemoteConnection && status === "idle"
                ? "Connect the other device again to see its picture."
                : message}
            </span>
          </div>
        )}
        {source && isLocalCamera(source) && isProblem(status) && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => retrySource(source)}
          >
            <RefreshCw />
            Try again
          </Button>
        )}
        {needsRemoteConnection && (
          <Button size="sm" onClick={() => setIsPicking(true)}>
            <Smartphone />
            Connect again
          </Button>
        )}
        <ChoiceField
          label="How the picture fits the box"
          value={layer.fit}
          choices={FIT_CHOICES}
          onChange={(fit) => edit({ fit })}
        />
        <SwitchField
          label="Mirror the picture"
          checked={layer.mirror}
          onChange={(mirror) => edit({ mirror })}
        />
        <SwitchField
          label="Keep the camera's shape when resizing"
          checked={layer.keepAspect}
          onChange={(keepAspect) => edit({ keepAspect })}
        />
      </PropertySection>

      <PropertySection
        title="Sound"
        defaultOpen={false}
        info={
          isRemote
            ? "You hear the other device while this camera is live, once it shares its microphone. Turn this off if your sound desk already carries it."
            : "Plays through this computer while the camera is live. If your sound desk already carries the microphone, keep this off to avoid an echo."
        }
      >
        {source && isLocalCamera(source) && <MicrophoneField source={source} />}
        <SwitchField
          label="Play its sound while it is live"
          checked={!layer.muted && !hasNoMicrophone}
          disabled={hasNoMicrophone}
          onChange={(audible) => edit({ muted: !audible })}
        />
      </PropertySection>

      <CameraPicker
        open={isPicking}
        currentSourceId={source?.id}
        onChoose={(sourceId) => edit({ sourceId })}
        onClose={() => setIsPicking(false)}
      />
    </>
  );
};

const MicrophoneField = ({ source }: { source: CameraSource }) => {
  const microphones = useCameraStore((state) => state.microphones);
  return (
    <SelectField
      label="Microphone"
      value={source.audioDeviceId ?? NO_MICROPHONE}
      options={[
        { value: NO_MICROPHONE, label: "No microphone" },
        ...microphones.map((microphone) => ({
          value: microphone.deviceId,
          label: microphone.label,
        })),
      ]}
      onChange={(audioDeviceId) =>
        updateLocalCamera(source.id, { audioDeviceId: audioDeviceId || null })
      }
    />
  );
};
