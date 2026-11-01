import { useEffect, useEffectEvent, useState } from "react";
import { KeyRound, Smartphone, Wifi, WifiOff } from "lucide-react";
import { deriveNetworkRoom } from "../../../lib/networkRoom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { QuickConnectNote } from "../../pairing/QuickConnectNote";
import {
  watchBroadcasters,
  type DeviceEntry,
} from "../../pairing/lib/signaling";
import { connectNearbyCamera } from "../lib/remoteCameras";
import { useSourceState } from "../store/cameraStore";
import { CameraNotice } from "./CameraNotice";
import { studioLinkUrl } from "../../pairing/lib/cameraLink";
import { InfoTip } from "@/components/shared/InfoTip";
import { LinkQr } from "./LinkQr";

type RoomLookup =
  | { state: "searching" }
  | { state: "found"; room: string }
  | { state: "missing" };

interface NearbyDevicesProps {
  pairingId: string;
  onUseCode: () => void;
}

export const NearbyDevices = ({ pairingId, onUseCode }: NearbyDevicesProps) => {
  const [lookup, setLookup] = useState<RoomLookup>({ state: "searching" });
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [viewerId] = useState(() => crypto.randomUUID());
  const [studioToken] = useState(() => crypto.randomUUID());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const { status, message } = useSourceState(pairingId);

  const connectTo = (device: DeviceEntry, room: string) => {
    setConnectingId(device.id);
    void connectNearbyCamera(pairingId, { room, device, viewerId });
  };

  const connectLinkedDevice = useEffectEvent(
    (nextDevices: DeviceEntry[], room: string) => {
      if (connectingId) return;
      const linked = nextDevices.find(
        (device) => device.studio === studioToken,
      );
      if (linked) connectTo(linked, room);
    },
  );

  useEffect(() => {
    let isCancelled = false;
    let stopWatching = () => {};
    void deriveNetworkRoom().then((room) => {
      if (isCancelled) return;
      if (!room) {
        setLookup({ state: "missing" });
        return;
      }
      setLookup({ state: "found", room });
      stopWatching = watchBroadcasters(room, (next) => {
        if (isCancelled) return;
        setDevices(next);
        connectLinkedDevice(next, room);
      });
    });
    return () => {
      isCancelled = true;
      stopWatching();
    };
  }, []);

  const connect = (device: DeviceEntry) => {
    if (lookup.state === "found") connectTo(device, lookup.room);
  };

  const codeButton = (
    <Button variant="secondary" size="sm" onClick={onUseCode}>
      <KeyRound size={14} />
      Pair with a code instead
    </Button>
  );

  if (lookup.state === "missing")
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CameraNotice
          icon={WifiOff}
          title="Your WiFi could not be found"
          message="Quick connect needs a moment of internet on both devices. Pair with a code instead. It works with no internet at all."
        />
        {codeButton}
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      {lookup.state === "found" && (
        <div className="flex flex-col items-center gap-1.5">
          <LinkQr
            url={studioLinkUrl({ room: lookup.room, studio: studioToken })}
            caption="Scan with the phone's camera"
          />
          <span className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
            It connects to this Studio by itself
            <InfoTip title="Connecting a phone" align="center">
              Scan the code with the phone&apos;s camera app. It opens Share
              camera, starts the camera and connects here on its own. A device
              that already has Share camera open on the same WiFi shows up in
              the list below too.
            </InfoTip>
          </span>
        </div>
      )}

      {lookup.state === "searching" || devices.length === 0 ? (
        <div className="flex items-center justify-center gap-2.5 rounded-xl border border-dashed border-border p-4">
          <Spinner size={16} />
          <span className="text-[13px] text-muted-foreground">
            {lookup.state === "searching"
              ? "Looking for your WiFi"
              : "Waiting for a device"}
          </span>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {devices.map((device) => {
            const isConnecting = device.id === connectingId;
            const hasFailed = isConnecting && status === "missing";
            return (
              <li
                key={device.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3"
              >
                <span className="grid size-9.5 shrink-0 place-items-center rounded-[10px] bg-secondary text-primary-soft">
                  <Smartphone size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {device.name}
                  </span>
                  {isConnecting && message && (
                    <span
                      className={
                        hasFailed
                          ? "block text-[12px] text-destructive"
                          : "block text-[12px] text-muted-foreground"
                      }
                    >
                      {message}
                    </span>
                  )}
                </span>
                {isConnecting && !hasFailed ? (
                  <Spinner size={16} />
                ) : (
                  <Button
                    size="sm"
                    disabled={Boolean(connectingId) && !hasFailed}
                    onClick={() => connect(device)}
                  >
                    <Wifi size={14} />
                    {hasFailed ? "Try again" : "Connect"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {codeButton}
      </div>
      <QuickConnectNote />
    </div>
  );
};
