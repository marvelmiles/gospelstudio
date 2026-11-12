import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SoundSharingDevice } from "../lib/deviceSound";
import { useSoundSharingDevices } from "../hooks/useSoundSharingDevices";
import { setDeviceSoundMuted } from "../store/productionActions";

export const DeviceSoundControls = () => {
  const devices = useSoundSharingDevices();
  if (devices.length === 0) return null;

  return (
    <div role="group" aria-label="Sound from devices" className="flex gap-1">
      {devices.map((device) => (
        <DeviceSoundButton key={device.sourceId} device={device} />
      ))}
    </div>
  );
};

const DeviceSoundButton = ({ device }: { device: SoundSharingDevice }) => {
  const { sourceId, name, muted } = device;
  return (
    <Button
      size="sm"
      variant={muted ? "destructive" : "secondary"}
      aria-pressed={muted}
      title={
        muted
          ? `${name} is sharing its microphone, but it is muted here. Click to hear it again.`
          : `${name} is sharing its microphone. You hear it while its camera is live. Click to mute it.`
      }
      onClick={() => setDeviceSoundMuted(sourceId, !muted)}
    >
      {muted ? <MicOff /> : <Mic className="text-success" />}
      <span className="max-w-32 truncate">{name}</span>
      <span className="font-semibold">{muted ? "Muted" : "On"}</span>
    </Button>
  );
};
